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

/**
 * Re-enable every source whose last_error starts with 'auto-disabled'.
 * Clears the error so the next cron run picks it up normally.
 */
export async function reEnableAllAutoDisabled(): Promise<AdminActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("sources")
    .update({ enabled: true, last_error: null })
    .like("last_error", "auto-disabled%");
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Expire active opportunities that have no deadline set and were added more
 * than `maxAgeDays` days ago. Prevents the feed from showing stale listings
 * forever.
 */
export async function expireStaleOpportunities(
  maxAgeDays: number,
): Promise<AdminActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (maxAgeDays < 1 || maxAgeDays > 365) {
    return { error: "maxAgeDays must be between 1 and 365" };
  }

  const cutoff = new Date(
    Date.now() - maxAgeDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("opportunities")
    .update({ status: "expired" as const })
    .eq("status", "active")
    .is("deadline", null)
    .lt("date_added", cutoff);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

/**
 * Trigger a cron endpoint from the admin panel. Useful for manually kicking
 * off an ingestion cycle or daily digest without touching the terminal.
 */
export async function triggerCronEndpoint(
  endpoint: "ingest" | "daily-digest" | "cleanup" | "source-quality",
): Promise<AdminActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const secret = process.env.CRON_SECRET;
  if (!secret) return { error: "CRON_SECRET not configured on server" };

  // Build absolute URL — works in both Vercel and local dev.
  let base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";
    
  if (!base.startsWith("http")) {
    base = `https://${base}`;
  }
  
  const url = `${base.replace(/\/$/, "")}/api/cron/${endpoint}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { error: `Cron ${endpoint} returned ${res.status}: ${text}` };
    }
    // Success — revalidate so the admin sees fresh logs.
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    return { error: `Fetch failed: ${(err as Error).message}` };
  }
}
