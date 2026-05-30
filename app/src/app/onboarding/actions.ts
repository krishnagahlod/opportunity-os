"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { invalidateUserScores } from "@/lib/scoring/refresh";

export async function saveOnboarding(formData: FormData) {
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
  const remote_preference = String(formData.get("remote_preference") ?? "any");
  const time_commitment = String(formData.get("time_commitment") ?? "any");
  // Telegram is optional — empty/whitespace becomes null. We do light validation
  // (digits only, reasonable length) so a typo'd "abc123" doesn't make it into
  // the cron's chat_id and 400 the Telegram API every morning.
  const telegram_raw = String(formData.get("telegram_chat_id") ?? "").trim();
  const telegram_chat_id =
    telegram_raw.length > 0 && /^-?\d{6,20}$/.test(telegram_raw)
      ? telegram_raw
      : null;

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
  
  const stage = String(formData.get("stage") ?? "").trim() || null;
  const min_compensation = String(formData.get("min_compensation") ?? "").trim() || null;

  if (!full_name || !college || !graduation_year) {
    return { error: "Full name, college, and graduation year are required" };
  }

  // If they typed something that doesn't look like a Telegram chat ID, surface
  // the validation issue inline rather than silently dropping it.
  if (telegram_raw.length > 0 && telegram_chat_id === null) {
    return {
      error:
        "Telegram chat ID should be a number (e.g. 1064311577). Leave blank to skip.",
    };
  }

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
      onboarded: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  // Profile changed → drop cached scores so the next dashboard load recomputes
  // against the new interests/skills.
  await invalidateUserScores(user.id);

  redirect("/onboarding/done");
}
