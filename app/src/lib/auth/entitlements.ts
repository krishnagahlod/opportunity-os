import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import type {
  Entitlement,
  FeatureKey,
  FeatureLimit,
  PlanKey,
  UserEntitlementState,
} from "@/types/db";

const DEFAULT_LIMITS: Record<PlanKey, Record<FeatureKey, { enabled: boolean; limitValue: number; period: string }>> = {
  free: {
    opportunity_feed_limit: { enabled: true, limitValue: 25, period: "forever" },
    search_query: { enabled: true, limitValue: 10, period: "daily" },
    ai_cold_outreach: { enabled: true, limitValue: 2, period: "monthly" },
    verified_contact_info: { enabled: false, limitValue: 0, period: "forever" },
    hot_leads_access: { enabled: false, limitValue: 0, period: "forever" },
    ai_action_plan: { enabled: false, limitValue: 0, period: "forever" },
    company_trust_scores: { enabled: false, limitValue: 0, period: "forever" },
    priority_instant_alerts: { enabled: false, limitValue: 0, period: "forever" },
  },
  iitb_free: {
    opportunity_feed_limit: { enabled: true, limitValue: -1, period: "forever" },
    search_query: { enabled: true, limitValue: -1, period: "daily" },
    ai_cold_outreach: { enabled: true, limitValue: 50, period: "monthly" },
    verified_contact_info: { enabled: true, limitValue: 50, period: "monthly" },
    hot_leads_access: { enabled: true, limitValue: -1, period: "forever" },
    ai_action_plan: { enabled: true, limitValue: 50, period: "monthly" },
    company_trust_scores: { enabled: true, limitValue: -1, period: "forever" },
    priority_instant_alerts: { enabled: true, limitValue: -1, period: "forever" },
  },
  pro_30d: {
    opportunity_feed_limit: { enabled: true, limitValue: -1, period: "forever" },
    search_query: { enabled: true, limitValue: -1, period: "daily" },
    ai_cold_outreach: { enabled: true, limitValue: 50, period: "monthly" },
    verified_contact_info: { enabled: true, limitValue: 50, period: "monthly" },
    hot_leads_access: { enabled: true, limitValue: -1, period: "forever" },
    ai_action_plan: { enabled: true, limitValue: 50, period: "monthly" },
    company_trust_scores: { enabled: true, limitValue: -1, period: "forever" },
    priority_instant_alerts: { enabled: true, limitValue: -1, period: "forever" },
  },
  pro_90d: {
    opportunity_feed_limit: { enabled: true, limitValue: -1, period: "forever" },
    search_query: { enabled: true, limitValue: -1, period: "daily" },
    ai_cold_outreach: { enabled: true, limitValue: 50, period: "monthly" },
    verified_contact_info: { enabled: true, limitValue: 50, period: "monthly" },
    hot_leads_access: { enabled: true, limitValue: -1, period: "forever" },
    ai_action_plan: { enabled: true, limitValue: 50, period: "monthly" },
    company_trust_scores: { enabled: true, limitValue: -1, period: "forever" },
    priority_instant_alerts: { enabled: true, limitValue: -1, period: "forever" },
  },
  pro_365d: {
    opportunity_feed_limit: { enabled: true, limitValue: -1, period: "forever" },
    search_query: { enabled: true, limitValue: -1, period: "daily" },
    ai_cold_outreach: { enabled: true, limitValue: 100, period: "monthly" },
    verified_contact_info: { enabled: true, limitValue: 100, period: "monthly" },
    hot_leads_access: { enabled: true, limitValue: -1, period: "forever" },
    ai_action_plan: { enabled: true, limitValue: 100, period: "monthly" },
    company_trust_scores: { enabled: true, limitValue: -1, period: "forever" },
    priority_instant_alerts: { enabled: true, limitValue: -1, period: "forever" },
  },
  lifetime: {
    opportunity_feed_limit: { enabled: true, limitValue: -1, period: "forever" },
    search_query: { enabled: true, limitValue: -1, period: "daily" },
    ai_cold_outreach: { enabled: true, limitValue: 100, period: "monthly" },
    verified_contact_info: { enabled: true, limitValue: 100, period: "monthly" },
    hot_leads_access: { enabled: true, limitValue: -1, period: "forever" },
    ai_action_plan: { enabled: true, limitValue: 100, period: "monthly" },
    company_trust_scores: { enabled: true, limitValue: -1, period: "forever" },
    priority_instant_alerts: { enabled: true, limitValue: -1, period: "forever" },
  },
  admin: {
    opportunity_feed_limit: { enabled: true, limitValue: -1, period: "forever" },
    search_query: { enabled: true, limitValue: -1, period: "daily" },
    ai_cold_outreach: { enabled: true, limitValue: -1, period: "monthly" },
    verified_contact_info: { enabled: true, limitValue: -1, period: "monthly" },
    hot_leads_access: { enabled: true, limitValue: -1, period: "forever" },
    ai_action_plan: { enabled: true, limitValue: -1, period: "monthly" },
    company_trust_scores: { enabled: true, limitValue: -1, period: "forever" },
    priority_instant_alerts: { enabled: true, limitValue: -1, period: "forever" },
  },
};

const DISPLAY_NAMES: Record<PlanKey, string> = {
  free: "Free",
  iitb_free: "IIT Bombay Partner Access",
  pro_30d: "Pro (30 Days)",
  pro_90d: "Pro (90 Days)",
  pro_365d: "Pro (1 Year)",
  lifetime: "Lifetime Pro",
  admin: "Administrator",
};

export function isVerifiedIITBUser(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().trim().endsWith("@iitb.ac.in");
}

export function getPeriodKey(period: string): string {
  const now = new Date();
  switch (period) {
    case "daily":
      return format(now, "yyyy-MM-dd");
    case "weekly":
      return format(now, "yyyy-'W'II");
    case "monthly":
      return format(now, "yyyy-MM");
    case "lifetime":
    case "forever":
    default:
      return "lifetime";
  }
}

/**
 * Resolves the authoritative active entitlement for a user on the server.
 */
export async function getUserEntitlement(userId: string): Promise<UserEntitlementState> {
  const supabase = createAdminClient();

  // Check admin role directly on profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, role")
    .eq("id", userId)
    .single();

  if (profile?.role === "admin") {
    return {
      planKey: "admin",
      displayName: DISPLAY_NAMES.admin,
      isPro: true,
      isIITB: true,
      isAdmin: true,
      isLifetime: true,
      expiresAt: null,
      daysRemaining: null,
      limits: DEFAULT_LIMITS.admin,
      usage: {} as Record<FeatureKey, number>,
    };
  }

  // Fetch user's entitlements
  const nowIso = new Date().toISOString();
  const { data: entitlements } = await supabase
    .from("entitlements")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  let activeEntitlement: Entitlement | null = null;

  if (entitlements && entitlements.length > 0) {
    // Filter out expired ones
    const valid = entitlements.filter(
      (e) => !e.expires_at || new Date(e.expires_at) > new Date()
    );

    // Pick highest precedence: lifetime > pro > iitb_free > free
    activeEntitlement =
      valid.find((e) => e.plan_key === "lifetime") ||
      valid.find((e) => e.plan_key.startsWith("pro_")) ||
      valid.find((e) => e.plan_key === "iitb_free") ||
      valid.find((e) => e.plan_key === "free") ||
      null;
  }

  // Fallback check: Auto-provision IITB if email matches
  if (!activeEntitlement && isVerifiedIITBUser(profile?.email)) {
    const { data: created } = await supabase
      .from("entitlements")
      .insert({
        user_id: userId,
        product: "opportunity_os",
        plan_key: "iitb_free",
        status: "active",
        source: "iitb",
        starts_at: nowIso,
        expires_at: null,
      })
      .select("*")
      .single();

    if (created) activeEntitlement = created as Entitlement;
  }

  // Default fallback to Free plan
  const planKey: PlanKey = (activeEntitlement?.plan_key as PlanKey) || "free";
  const isPro = planKey.startsWith("pro_") || planKey === "lifetime";
  const isIITB = planKey === "iitb_free";
  const isLifetime = planKey === "lifetime";

  let daysRemaining: number | null = null;
  if (activeEntitlement?.expires_at) {
    const diffMs = new Date(activeEntitlement.expires_at).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  // Fetch feature limits for this plan
  const { data: dbLimits } = await supabase
    .from("feature_limits")
    .select("feature_key, enabled, limit_value, period")
    .eq("product", "opportunity_os")
    .eq("plan_key", planKey);

  const limits: Record<FeatureKey, { enabled: boolean; limitValue: number; period: string }> = {
    ...DEFAULT_LIMITS[planKey],
  };

  if (dbLimits && dbLimits.length > 0) {
    for (const l of dbLimits) {
      limits[l.feature_key as FeatureKey] = {
        enabled: l.enabled,
        limitValue: l.limit_value,
        period: l.period,
      };
    }
  }

  // Fetch current period usage counts
  const usageKeys = Object.entries(limits).map(([featureKey, config]) => ({
    featureKey,
    periodKey: getPeriodKey(config.period),
  }));

  const { data: usageData } = await supabase
    .from("usage_events")
    .select("feature_key, count, period_key")
    .eq("user_id", userId)
    .eq("product", "opportunity_os");

  const usage: Record<FeatureKey, number> = {
    opportunity_feed_limit: 0,
    search_query: 0,
    ai_cold_outreach: 0,
    verified_contact_info: 0,
    hot_leads_access: 0,
    ai_action_plan: 0,
    company_trust_scores: 0,
    priority_instant_alerts: 0,
  };

  if (usageData) {
    for (const row of usageData) {
      const config = limits[row.feature_key as FeatureKey];
      if (config && getPeriodKey(config.period) === row.period_key) {
        usage[row.feature_key as FeatureKey] = row.count;
      }
    }
  }

  return {
    planKey,
    displayName: DISPLAY_NAMES[planKey] || "Free",
    isPro,
    isIITB,
    isAdmin: false,
    isLifetime,
    expiresAt: activeEntitlement?.expires_at || null,
    daysRemaining,
    limits,
    usage,
  };
}

/**
 * Fast server-side check if a user has access to a specific feature.
 */
export async function hasFeatureAccess(userId: string, featureKey: FeatureKey): Promise<boolean> {
  const entitlement = await getUserEntitlement(userId);
  if (entitlement.isAdmin) return true;
  const config = entitlement.limits[featureKey];
  return !!config?.enabled;
}

/**
 * Atomic quota consumption check. Returns allowed, remaining, and limit.
 */
export async function checkAndConsumeQuota(
  userId: string,
  featureKey: FeatureKey,
  cost: number = 1
): Promise<{ allowed: boolean; remaining: number; limit: number; consumed: number; reason?: string }> {
  const entitlement = await getUserEntitlement(userId);

  if (entitlement.isAdmin) {
    return { allowed: true, remaining: -1, limit: -1, consumed: 0 };
  }

  const config = entitlement.limits[featureKey];

  if (!config || !config.enabled) {
    return {
      allowed: false,
      remaining: 0,
      limit: 0,
      consumed: entitlement.usage[featureKey] || 0,
      reason: "feature_locked",
    };
  }

  // Unlimited check
  if (config.limitValue === -1) {
    return { allowed: true, remaining: -1, limit: -1, consumed: entitlement.usage[featureKey] || 0 };
  }

  const periodKey = getPeriodKey(config.period);
  const supabase = createAdminClient();

  // Call the atomic procedure
  const { data, error } = await supabase.rpc("consume_feature_quota", {
    p_user_id: userId,
    p_feature_key: featureKey,
    p_period_key: periodKey,
    p_cost: cost,
    p_limit: config.limitValue,
  });

  if (error) {
    console.error("[entitlements] consume_feature_quota rpc error:", error);
    // Fallback: in-memory check against local snapshot
    const currentUsage = entitlement.usage[featureKey] || 0;
    if (currentUsage + cost <= config.limitValue) {
      await supabase.from("usage_events").upsert({
        user_id: userId,
        product: "opportunity_os",
        feature_key: featureKey,
        period_key: periodKey,
        count: currentUsage + cost,
        last_used_at: new Date().toISOString(),
      });
      return {
        allowed: true,
        remaining: config.limitValue - (currentUsage + cost),
        limit: config.limitValue,
        consumed: currentUsage + cost,
      };
    } else {
      return {
        allowed: false,
        remaining: Math.max(0, config.limitValue - currentUsage),
        limit: config.limitValue,
        consumed: currentUsage,
        reason: "quota_exceeded",
      };
    }
  }

  return {
    allowed: data.allowed,
    remaining: data.remaining,
    limit: data.limit,
    consumed: data.consumed,
    reason: data.allowed ? undefined : "quota_exceeded",
  };
}
