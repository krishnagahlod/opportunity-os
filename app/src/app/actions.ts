"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { invalidateUserScores } from "@/lib/scoring/refresh";

export async function toggleSaved(opportunityId: string, isSaved: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  if (isSaved) {
    await supabase
      .from("saved_opportunities")
      .delete()
      .eq("user_id", user.id)
      .eq("opportunity_id", opportunityId);
  } else {
    await supabase.from("saved_opportunities").insert({
      user_id: user.id,
      opportunity_id: opportunityId,
    });
  }

  revalidatePath("/");
  revalidatePath("/saved");
  return { ok: true };
}

export async function markApplied(opportunityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  await supabase.from("applications").upsert(
    {
      user_id: user.id,
      opportunity_id: opportunityId,
      status: "applied",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,opportunity_id" },
  );

  revalidatePath("/");
  revalidatePath("/applications");
  return { ok: true };
}

export async function updateApplicationStatus(
  opportunityId: string,
  status: "saved" | "applied" | "interviewing" | "rejected" | "won",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  await supabase.from("applications").upsert(
    {
      user_id: user.id,
      opportunity_id: opportunityId,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,opportunity_id" },
  );

  revalidatePath("/applications");
  return { ok: true };
}

/**
 * Merge a single skill into the user's confirmed `profile.skills` array.
 * Used by the detail page's "What you're missing" gap-analysis chips —
 * the user clicks a missing requirement to add it to their profile in one
 * tap. Idempotent: case-insensitive dedup so "React" and "react" don't
 * both get added.
 *
 * Invalidates cached scores so the next dashboard load reflects the new
 * skill in the relevance signal.
 */
export async function addSkillToProfile(
  skill: string,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const clean = skill.trim();
  if (!clean || clean.length > 40) return { error: "Invalid skill" };

  const { data: prof, error: readErr } = await supabase
    .from("profiles")
    .select("skills")
    .eq("id", user.id)
    .single();
  if (readErr) return { error: readErr.message };

  const current = (prof?.skills ?? []) as string[];
  const lower = clean.toLowerCase();
  const alreadyHave = current.some((s) => s.toLowerCase() === lower);
  if (alreadyHave) {
    // No-op success — the chip will animate away on the client either way.
    return { ok: true };
  }

  const next = [...current, clean];
  const { error: updErr } = await supabase
    .from("profiles")
    .update({ skills: next, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (updErr) return { error: updErr.message };

  await invalidateUserScores(user.id);
  revalidatePath("/");
  revalidatePath("/settings");
  return { ok: true };
}

export type FeedbackType = 'not_interested' | 'bad_match' | 'already_seen' | 'ineligible' | 'low_quality' | 'broken_link' | 'great_match';

export async function submitFeedback(opportunityId: string, feedback: FeedbackType) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase.from("opportunity_feedback").upsert(
    {
      user_id: user.id,
      opportunity_id: opportunityId,
      feedback,
      created_at: new Date().toISOString(),
    },
    { onConflict: "user_id,opportunity_id,feedback" }
  );

  if (error) return { error: error.message };
  return { ok: true };
}
