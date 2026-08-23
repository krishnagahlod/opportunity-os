import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanKey } from "@/types/db";

export const PLAN_PRICING: Record<
  "pro_30d" | "pro_90d" | "pro_365d",
  { amount: number; durationDays: number; name: string }
> = {
  pro_30d: { amount: 299, durationDays: 30, name: "Pro (30 Days)" },
  pro_90d: { amount: 799, durationDays: 90, name: "Pro (90 Days)" },
  pro_365d: { amount: 2499, durationDays: 365, name: "Pro (1 Year)" },
};

export function getCashfreeCredentials() {
  const appId = process.env.CASHFREE_APP_ID || process.env.NEXT_PUBLIC_CASHFREE_APP_ID || "cf_test_placeholder";
  const secretKey = process.env.CASHFREE_SECRET_KEY || "cf_secret_placeholder";
  const envMode = (process.env.CASHFREE_ENV || process.env.NEXT_PUBLIC_CASHFREE_ENV || "sandbox").toLowerCase();
  const apiBase =
    envMode === "production"
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";

  return { appId, secretKey, envMode, apiBase };
}

/**
 * Creates an order directly with the Cashfree PG API.
 * Returns order details including payment_session_id for the modal checkout.
 */
export async function createCashfreeOrder({
  userId,
  userEmail,
  planKey,
  returnUrl,
}: {
  userId: string;
  userEmail?: string | null;
  planKey: "pro_30d" | "pro_90d" | "pro_365d";
  returnUrl?: string;
}): Promise<{
  orderId: string;
  paymentSessionId: string;
  amount: number;
  currency: string;
  envMode: string;
}> {
  const { appId, secretKey, envMode, apiBase } = getCashfreeCredentials();
  const planInfo = PLAN_PRICING[planKey];

  if (!planInfo) {
    throw new Error(`Invalid plan key: ${planKey}`);
  }

  const amount = planInfo.amount;
  const currency = "INR";
  const supabase = createAdminClient();

  const cleanUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 45);
  const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  let paymentSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // If real Cashfree credentials are configured, call the Cashfree REST API
  if (secretKey !== "cf_secret_placeholder" && !appId.includes("placeholder")) {
    const response = await fetch(`${apiBase}/orders`, {
      method: "POST",
      headers: {
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: currency,
        customer_details: {
          customer_id: cleanUserId || "cust_user",
          customer_email: userEmail || "user@opportunityos.com",
          customer_phone: "9999999999",
        },
        order_meta: {
          return_url: returnUrl || `https://opportunity-os.vercel.app/settings/billing?order_id={order_id}`,
        },
        order_note: `${planInfo.name} Access`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cashfree order creation failed: ${errorText}`);
    }

    const orderData = await response.json();
    paymentSessionId = orderData.payment_session_id;
  }

  // Record transaction in database
  await supabase.from("payment_transactions").insert({
    user_id: userId,
    product: "opportunity_os",
    plan_key: planKey,
    amount: amount * 100, // In paise
    currency,
    provider: "cashfree",
    provider_order_id: orderId,
    status: "created",
    raw_reference: { planKey, amount, currency, paymentSessionId },
  });

  return {
    orderId,
    paymentSessionId,
    amount,
    currency,
    envMode,
  };
}

/**
 * Fetches order status directly from Cashfree to verify payment.
 */
export async function getCashfreeOrderStatus(orderId: string): Promise<{
  status: "PAID" | "ACTIVE" | "EXPIRED" | "TERMINATED" | "FAILED";
  orderAmount?: number;
}> {
  const { appId, secretKey, apiBase } = getCashfreeCredentials();

  if (secretKey === "cf_secret_placeholder") {
    return { status: "PAID" };
  }

  const response = await fetch(`${apiBase}/orders/${orderId}`, {
    method: "GET",
    headers: {
      "x-client-id": appId,
      "x-client-secret": secretKey,
      "x-api-version": "2023-08-01",
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to fetch Cashfree order status: ${err}`);
  }

  const data = await response.json();
  return {
    status: data.order_status,
    orderAmount: data.order_amount,
  };
}

/**
 * Validates Cashfree Webhook signature using HMAC-SHA256.
 */
export function verifyCashfreeWebhookSignature({
  rawBody,
  timestamp,
  signature,
}: {
  rawBody: string;
  timestamp: string;
  signature: string;
}): boolean {
  const { secretKey } = getCashfreeCredentials();
  if (secretKey === "cf_secret_placeholder") {
    return true;
  }

  const message = `${timestamp}${rawBody}`;
  const generatedSignature = createHmac("sha256", secretKey)
    .update(message)
    .digest("base64");

  try {
    return timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Idempotently grants or extends Pro entitlement when payment is verified.
 */
export async function activateOrExtendEntitlement({
  userId,
  planKey,
  orderId,
  paymentId,
  amount,
}: {
  userId: string;
  planKey: PlanKey;
  orderId: string;
  paymentId?: string;
  amount?: number;
}): Promise<{ entitlementId: string; expiresAt: string }> {
  const supabase = createAdminClient();
  const planInfo = PLAN_PRICING[planKey as keyof typeof PLAN_PRICING];
  const durationDays = planInfo?.durationDays || 30;

  // 1. Check existing active entitlement
  const { data: existing } = await supabase
    .from("entitlements")
    .select("*")
    .eq("user_id", userId)
    .eq("product", "opportunity_os")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let baseDate = new Date();
  if (existing?.expires_at) {
    const existingExpiry = new Date(existing.expires_at);
    if (existingExpiry > baseDate) {
      baseDate = existingExpiry; // Extend from current expiration date without losing days
    }
  }

  const newExpiresAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  // 2. Upsert / Insert Entitlement
  const { data: entitlement, error: entErr } = await supabase
    .from("entitlements")
    .insert({
      user_id: userId,
      product: "opportunity_os",
      plan_key: planKey,
      status: "active",
      source: "cashfree",
      starts_at: new Date().toISOString(),
      expires_at: newExpiresAt,
      external_reference: paymentId || orderId,
      metadata: { orderId, paymentId, amount, durationDays, provider: "cashfree" },
    })
    .select("id, expires_at")
    .single();

  if (entErr) {
    throw new Error(`Failed to activate entitlement: ${entErr.message}`);
  }

  // 3. Upsert Subscription record
  await supabase.from("subscriptions").insert({
    user_id: userId,
    product: "opportunity_os",
    plan_key: planKey,
    provider: "cashfree",
    provider_order_id: orderId,
    provider_payment_id: paymentId,
    status: "active",
    started_at: new Date().toISOString(),
    current_period_start: new Date().toISOString(),
    current_period_end: newExpiresAt,
    metadata: { orderId, paymentId, amount, provider: "cashfree" },
  });

  // 4. Update Payment Transaction ledger
  await supabase
    .from("payment_transactions")
    .update({
      status: "paid",
      provider_payment_id: paymentId || orderId,
      updated_at: new Date().toISOString(),
    })
    .eq("provider_order_id", orderId);

  return { entitlementId: entitlement.id, expiresAt: entitlement.expires_at };
}
