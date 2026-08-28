"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateUserScores } from "@/lib/scoring/refresh";
import { parseResumePdf } from "@/lib/ai/parse-resume";
import type { ResumeExtraction } from "@/lib/ai/prompts";

export type SaveSettingsResult = { ok: true } | { error: string };
export type CalendarTokenResult =
  | { ok: true; token: string }
  | { error: string };
export type ResumeParseResult =
  | { ok: true; extraction: ResumeExtraction }
  | { error: string };
export type ResumeMutationResult = { ok: true } | { error: string };

export async function saveSettings(
  formData: FormData,
): Promise<SaveSettingsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not signed in" };
  }

  const full_name = String(formData.get("full_name") ?? "").trim();
  const college = String(formData.get("college") ?? "").trim();
  const graduation_year_raw = formData.get("graduation_year");
  const graduation_year = graduation_year_raw
    ? Number(graduation_year_raw)
    : null;
  const preferred_location =
    String(formData.get("preferred_location") ?? "").trim() || null;
  const remote_preference = String(
    formData.get("remote_preference") ?? "any",
  );
  const time_commitment = String(formData.get("time_commitment") ?? "any");
  const telegram_chat_id =
    String(formData.get("telegram_chat_id") ?? "").trim() || null;
  // Telegram min-score floor (0..100). Range slider sends an integer string.
  const telegram_min_score_raw = String(
    formData.get("telegram_min_score") ?? "70",
  );
  const telegram_min_score = Math.max(
    0,
    Math.min(100, Number.parseInt(telegram_min_score_raw, 10) || 70),
  );

  const stage = String(formData.get("stage") ?? "").trim() || null;
  const min_compensation = String(formData.get("min_compensation") ?? "").trim() || null;

  let interests: string[] = [];
  let skills: string[] = [];
  let opportunity_goals: string[] = [];
  let avoid_tags: string[] = [];
  let target_companies: string[] = [];
  try {
    interests = JSON.parse(String(formData.get("interests") ?? "[]"));
    skills = JSON.parse(String(formData.get("skills") ?? "[]"));
    opportunity_goals = JSON.parse(String(formData.get("opportunity_goals") ?? "[]"));
    avoid_tags = JSON.parse(String(formData.get("avoid_tags") ?? "[]"));
    target_companies = JSON.parse(String(formData.get("target_companies") ?? "[]"));
  } catch {
    return { error: "Invalid array payloads" };
  }

  if (!full_name || !college || !graduation_year) {
    return {
      error: "Full name, college, and graduation year are required",
    };
  }

  // Read previous interests + skills to decide whether to invalidate scores.
  const { data: prev } = await supabase
    .from("profiles")
    .select("interests, skills")
    .eq("id", user.id)
    .single();

  const interestsChanged =
    !arraysEqual(prev?.interests ?? [], interests) ||
    !arraysEqual(prev?.skills ?? [], skills);

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name,
      college,
      graduation_year,
      interests,
      skills,
      opportunity_goals,
      avoid_tags,
      target_companies,
      stage,
      min_compensation,
      preferred_location,
      remote_preference,
      time_commitment,
      telegram_chat_id,
      telegram_min_score,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  if (interestsChanged) {
    await invalidateUserScores(user.id);
  }

  revalidatePath("/settings");
  revalidatePath("/");
  return { ok: true };
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  for (let i = 0; i < sa.length; i++) {
    if (sa[i] !== sb[i]) return false;
  }
  return true;
}

/**
 * Returns the user's existing calendar token, generating one on first call.
 * Idempotent: subsequent calls return the same token unless rotated.
 */
export async function ensureCalendarToken(): Promise<CalendarTokenResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: existing } = await supabase
    .from("profiles")
    .select("calendar_token")
    .eq("id", user.id)
    .single();

  if (existing?.calendar_token) {
    return { ok: true, token: existing.calendar_token as string };
  }

  const token = randomUUID();
  const { error } = await supabase
    .from("profiles")
    .update({ calendar_token: token })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { ok: true, token };
}

/**
 * Rotates the user's calendar token. Old subscription URLs immediately stop
 * working. Use when the URL has been shared by accident.
 */
export async function rotateCalendarToken(): Promise<CalendarTokenResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const token = randomUUID();
  const { error } = await supabase
    .from("profiles")
    .update({ calendar_token: token })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { ok: true, token };
}

/* ============================================================================
 * Resume upload + AI parsing
 *
 * Flow:
 *   1. Browser uploads PDF directly to Storage at `<user_id>/<uuid>.pdf`
 *      using the user-scoped client (RLS allows). This keeps the binary off
 *      our server.
 *   2. Browser calls parseResume(storagePath) once upload finishes.
 *   3. Server downloads the file (admin client — RLS-bypassing), feeds it to
 *      Gemini, validates the structured response, and saves resume_skills
 *      (suggested, not yet merged) + resume_url + resume_uploaded_at on the
 *      profile.
 *   4. UI shows the suggestions as confirmable chips. applyResumeSkill()
 *      merges a chosen suggestion into the user-confirmed `skills` array.
 *
 * Why split parseResume vs applyResumeSkill: the AI suggests, the user
 * decides. Silent merge would auto-add wrong skills if Gemini misreads (e.g.
 * "Excel" because they listed an Excel course).
 * ========================================================================== */

const RESUME_PATH_RE = /^[0-9a-f-]{36}\/[a-zA-Z0-9_.-]{4,80}\.pdf$/i;

export async function parseResume(
  storagePath: string,
): Promise<ResumeParseResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  // Path must start with the user's id to prevent cross-user reads even if
  // the action were ever called with a hand-crafted path.
  if (!RESUME_PATH_RE.test(storagePath) || !storagePath.startsWith(`${user.id}/`)) {
    return { error: "Invalid resume path" };
  }

  // Download via admin client — Storage RLS would already allow the user to
  // read, but admin avoids relying on session refresh state inside an action.
  const admin = createAdminClient();
  const { data: file, error: dlErr } = await admin.storage
    .from("resumes")
    .download(storagePath);
  if (dlErr || !file) {
    return { error: dlErr?.message ?? "Couldn't read uploaded file" };
  }

  // Cap at 5 MB — multimodal token cost scales with PDF size, and resumes
  // shouldn't be that big anyway.
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Resume larger than 5 MB. Try a smaller PDF." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  let extraction: import("@/lib/ai/parse-resume").ResumeExtractionResult;
  try {
    extraction = await parseResumePdf(bytes);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `AI parsing failed: ${msg}` };
  }

  // Save the suggested skills alongside the resume URL. The `skills` array
  // (confirmed) is untouched until the user explicitly merges them via
  // applyResumeSkill().
  const { error: updateErr } = await admin
    .from("profiles")
    .update({
      resume_url: storagePath,
      resume_skills: extraction.skills,
      resume_text: extraction.raw_text,
      resume_uploaded_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (updateErr) return { error: updateErr.message };

  // Resume skills feed scoring → invalidate any cached scores so the next
  // dashboard load reflects the boost.
  await invalidateUserScores(user.id);

  revalidatePath("/settings");
  revalidatePath("/");
  return { ok: true, extraction };
}

/**
 * Move a single suggested skill from `resume_skills` into the user-confirmed
 * `skills` array. Idempotent — adding a skill that's already in `skills`
 * is a no-op. The suggestion is removed from `resume_skills` so the chip
 * disappears from the UI after confirmation.
 */
export async function applyResumeSkill(
  skill: string,
): Promise<ResumeMutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const clean = skill.trim();
  if (!clean || clean.length > 40) return { error: "Invalid skill" };

  const { data: prof, error: readErr } = await supabase
    .from("profiles")
    .select("skills, resume_skills")
    .eq("id", user.id)
    .single();
  if (readErr) return { error: readErr.message };

  const currentSkills = (prof?.skills ?? []) as string[];
  const currentSuggestions = (prof?.resume_skills ?? []) as string[];

  // Case-insensitive dedupe so "React" and "react" don't both get added.
  const lower = clean.toLowerCase();
  const alreadyHave = currentSkills.some((s) => s.toLowerCase() === lower);
  const nextSkills = alreadyHave ? currentSkills : [...currentSkills, clean];

  const nextSuggestions = currentSuggestions.filter(
    (s) => s.toLowerCase() !== lower,
  );

  const { error: updErr } = await supabase
    .from("profiles")
    .update({
      skills: nextSkills,
      resume_skills: nextSuggestions,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (updErr) return { error: updErr.message };

  await invalidateUserScores(user.id);
  revalidatePath("/settings");
  revalidatePath("/");
  return { ok: true };
}

/** Dismiss a suggestion without adding it. Removes the chip from the UI. */
export async function dismissResumeSkill(
  skill: string,
): Promise<ResumeMutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const lower = skill.trim().toLowerCase();
  if (!lower) return { error: "Invalid skill" };

  const { data: prof } = await supabase
    .from("profiles")
    .select("resume_skills")
    .eq("id", user.id)
    .single();

  const next = ((prof?.resume_skills ?? []) as string[]).filter(
    (s) => s.toLowerCase() !== lower,
  );

  const { error } = await supabase
    .from("profiles")
    .update({ resume_skills: next })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { ok: true };
}

/** Delete the uploaded resume + clear all related profile fields. */
export async function removeResume(): Promise<ResumeMutationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: prof } = await supabase
    .from("profiles")
    .select("resume_url")
    .eq("id", user.id)
    .single();

  // Best-effort delete on Storage — if it's already gone, we still clear the
  // DB pointers so the UI shows the empty state.
  const path = prof?.resume_url as string | null;
  if (path) {
    const admin = createAdminClient();
    await admin.storage.from("resumes").remove([path]);
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      resume_url: null,
      resume_skills: [],
      resume_uploaded_at: null,
    })
    .eq("id", user.id);
  if (error) return { error: error.message };

  await invalidateUserScores(user.id);
  revalidatePath("/settings");
  revalidatePath("/");
  return { ok: true };
}

/** Permanently deletes the user's account and all associated personal data. */
export async function deleteUserAccount(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const admin = createAdminClient();

  const { data: prof } = await admin
    .from("profiles")
    .select("resume_url")
    .eq("id", user.id)
    .maybeSingle();

  if (prof?.resume_url) {
    try {
      await admin.storage.from("resumes").remove([prof.resume_url]);
    } catch {
      // Best-effort storage deletion
    }
  }

  await admin.from("user_sessions").delete().eq("user_id", user.id);
  await admin.from("applications").delete().eq("user_id", user.id);
  await admin.from("saved_opportunities").delete().eq("user_id", user.id);
  await admin.from("opportunity_feedback").delete().eq("user_id", user.id);
  await admin.from("user_entitlements").delete().eq("user_id", user.id);
  await admin.from("profiles").delete().eq("id", user.id);

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, error: error.message };

  await supabase.auth.signOut();
  return { ok: true };
}

