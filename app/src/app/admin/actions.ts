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
