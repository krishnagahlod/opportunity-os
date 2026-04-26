"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATEGORIES } from "@/lib/ai/prompts";
import type { OpportunityCategory } from "@/types/db";

export type SubmitResult =
  | { ok: true; id: string }
  | { error: string };

export async function submitOpportunity(
  formData: FormData,
): Promise<SubmitResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const title = String(formData.get("title") ?? "").trim();
  const organization = String(formData.get("organization") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const apply_url = String(formData.get("apply_url") ?? "").trim() || null;
  const deadline = String(formData.get("deadline") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const compensation = String(formData.get("compensation") ?? "").trim() || null;

  if (!title || !organization) {
    return { error: "Title and organization are required" };
  }
  if (!CATEGORIES.includes(categoryRaw as OpportunityCategory)) {
    return { error: "Invalid category" };
  }
  if (apply_url && !/^https?:\/\//i.test(apply_url)) {
    return { error: "apply_url must start with http(s)://" };
  }

  // Find or create a "User Submissions" source to attribute to.
  const admin = createAdminClient();
  let source_id: string | null = null;
  const { data: existingSrc } = await admin
    .from("sources")
    .select("id")
    .eq("name", "User Submissions")
    .maybeSingle();
  if (existingSrc) {
    source_id = existingSrc.id;
  } else {
    const { data: createdSrc } = await admin
      .from("sources")
      .insert({ name: "User Submissions", kind: "user_submission", enabled: true })
      .select("id")
      .single();
    source_id = createdSrc?.id ?? null;
  }

  // Hash key so re-submitting the same title/org doesn't break the unique
  // source_url constraint.
  const dedupKey = `submission:${user.id}:${Date.now()}`;

  const { data, error } = await admin
    .from("opportunities")
    .insert({
      title,
      organization,
      category: categoryRaw as OpportunityCategory,
      description,
      summary: description?.slice(0, 280) ?? null,
      apply_url,
      deadline,
      location,
      compensation,
      source_url: dedupKey,
      source_id,
      // status='pending' so the admin sees it in their queue,
      // out of the public feed (we filter status='active' there)
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { ok: true, id: data.id };
}
