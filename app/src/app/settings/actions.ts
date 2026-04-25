"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { invalidateUserScores } from "@/lib/scoring/refresh";

export type SaveSettingsResult = { ok: true } | { error: string };

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

  let interests: string[] = [];
  let skills: string[] = [];
  try {
    interests = JSON.parse(String(formData.get("interests") ?? "[]"));
    skills = JSON.parse(String(formData.get("skills") ?? "[]"));
  } catch {
    return { error: "Invalid interests/skills payload" };
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
      preferred_location,
      remote_preference,
      time_commitment,
      telegram_chat_id,
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
