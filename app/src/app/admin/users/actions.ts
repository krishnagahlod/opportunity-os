"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { PlanKey } from "@/types/db";

async function verifyAdminUser(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Forbidden: Admin privileges required");
  }

  return user.id;
}

export async function grantProEntitlement({
  targetUserId,
  planKey = "pro_30d",
  durationDays = 30,
  reason = "Admin manual grant",
}: {
  targetUserId: string;
  planKey?: PlanKey;
  durationDays?: number;
  reason?: string;
}) {
  const adminId = await verifyAdminUser();
  const supabase = createAdminClient();

  const expiresAt =
    planKey === "lifetime"
      ? null
      : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  // 1. Insert active entitlement
  const { data: entitlement, error } = await supabase
    .from("entitlements")
    .insert({
      user_id: targetUserId,
      product: "opportunity_os",
      plan_key: planKey,
      status: "active",
      source: "admin",
      starts_at: new Date().toISOString(),
      expires_at: expiresAt,
      granted_by: adminId,
      metadata: { reason, durationDays },
    })
    .select()
    .single();

  if (error) throw new Error(`Grant failed: ${error.message}`);

  // 2. Record in admin_audit_logs
  await supabase.from("admin_audit_logs").insert({
    admin_user_id: adminId,
    target_user_id: targetUserId,
    product: "opportunity_os",
    action: "grant_access",
    after_state: { plan_key: planKey, expires_at: expiresAt },
    reason,
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/subscriptions");
  return { success: true, entitlement };
}

export async function revokeUserEntitlement({
  targetUserId,
  entitlementId,
  reason = "Admin revocation",
}: {
  targetUserId: string;
  entitlementId: string;
  reason?: string;
}) {
  const adminId = await verifyAdminUser();
  const supabase = createAdminClient();

  const { data: before } = await supabase
    .from("entitlements")
    .select("*")
    .eq("id", entitlementId)
    .single();

  const { error } = await supabase
    .from("entitlements")
    .update({
      status: "revoked",
      updated_at: new Date().toISOString(),
    })
    .eq("id", entitlementId);

  if (error) throw new Error(`Revocation failed: ${error.message}`);

  await supabase.from("admin_audit_logs").insert({
    admin_user_id: adminId,
    target_user_id: targetUserId,
    product: "opportunity_os",
    action: "revoke_access",
    before_state: before,
    reason,
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/subscriptions");
  return { success: true };
}

export async function resetUserSessions({
  targetUserId,
  reason = "Admin session reset",
}: {
  targetUserId: string;
  reason?: string;
}) {
  const adminId = await verifyAdminUser();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", targetUserId)
    .is("revoked_at", null)
    .select("id");

  if (error) throw new Error(`Reset sessions failed: ${error.message}`);

  await supabase.from("admin_audit_logs").insert({
    admin_user_id: adminId,
    target_user_id: targetUserId,
    product: "opportunity_os",
    action: "reset_sessions",
    reason,
    after_state: { revoked_count: data?.length || 0 },
  });

  revalidatePath("/admin/users");
  return { success: true, count: data?.length || 0 };
}
