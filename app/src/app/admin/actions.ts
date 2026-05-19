"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OpportunityStatus } from "@/types/db";

export type AdminActionResult = { ok: true } | { error: string };

/** Common admin gate: returns null if user is admin, otherwise an error result. */
async function requireAdmin(): Promise<AdminActionResult | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { error: "Forbidden" };
  return null;
}

export async function toggleFeatured(
  opportunityId: string,
  next: boolean,
): Promise<AdminActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  // Use admin client to bypass RLS — admin policy already permits this,
  // but service-role write avoids any auth-cookie edge cases.
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("opportunities")
    .update({ featured: next })
    .eq("id", opportunityId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export async function setOpportunityStatus(
  opportunityId: string,
  status: OpportunityStatus,
): Promise<AdminActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("opportunities")
    .update({ status })
    .eq("id", opportunityId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export async function toggleSourceEnabled(
  sourceId: string,
  next: boolean,
): Promise<AdminActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("sources")
    .update({ enabled: next })
    .eq("id", sourceId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Manually override the AI's confidence rating on an opportunity. Used by
 * the "Needs review" queue when the admin verifies that a low-confidence
 * extraction is actually fine and should appear in the feed. Bumping to
 * 0.7 takes it above the warn threshold so no "shaky" badge shows.
 */
export async function overrideConfidence(
  opportunityId: string,
  newConfidence: number,
): Promise<AdminActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (newConfidence < 0 || newConfidence > 1) {
    return { error: "Confidence must be between 0 and 1" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("opportunities")
    .update({ extraction_confidence: newConfidence })
    .eq("id", opportunityId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

/**
 * Hard-delete an opportunity. Used sparingly via the Needs-review queue
 * when an item is obviously junk (spam, hallucinated, irrelevant). Saves +
 * applications cascade-delete via FK so the user state goes with it.
 */
export async function deleteOpportunity(
  opportunityId: string,
): Promise<AdminActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("opportunities")
    .delete()
    .eq("id", opportunityId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}
