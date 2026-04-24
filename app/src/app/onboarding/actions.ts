"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  let interests: string[] = [];
  let skills: string[] = [];
  try {
    interests = JSON.parse(String(formData.get("interests") ?? "[]"));
    skills = JSON.parse(String(formData.get("skills") ?? "[]"));
  } catch {
    return { error: "Invalid interests/skills payload" };
  }

  if (!full_name || !college || !graduation_year) {
    return { error: "Full name, college, and graduation year are required" };
  }

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
      onboarded: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}
