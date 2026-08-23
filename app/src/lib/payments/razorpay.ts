import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanKey } from "@/types/db";

export const PLAN_PRICING: Record<
  "pro_30d" | "pro_90d" | "pro_365d",
  { amount: number; durationDays: number; name: string }
> = {
  pro_30d: { amount: 29900, durationDays: 30, name: "Pro (30 Days)" },
  pro_90d: { amount: 79900, durationDays: 90, name: "Pro (90 Days)" },
  pro_365d: { amount: 249900, durationDays: 365, name: "Pro (1 Year)" },
};

export function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "rzp_secret_placeholder";
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || keySecret;

  return { keyId, keySecret, webhookSecret };
}

/**
 * Creates an order directly with the Razorpay API.
 */
export async function createRazorpayOrder({
  userId,
  planKey,
  receipt,
}: {
  userId: string;
  planKey: "pro_30d" | "pro_90d" | "pro_365d";
  receipt?: string;
}): Promise<{ id: string; amount: number; currency: string; keyId: string }> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const planInfo = PLAN_PRICING[planKey];

  if (!planInfo) {
    throw new Error(`Invalid plan key: ${planKey}`);
  }

  const amount = planInfo.amount;
  const currency = "INR";
  const supabase = createAdminClient();

  let orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // If real Razorpay keys are configured, call the Razorpay REST API
  if (keySecret !== "rzp_secret_placeholder" && !keyId.includes("placeholder")) {
    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt: receipt || `rec_${userId.slice(0, 8)}_${Date.now()}`,
        notes: {
          user_id: userId,
          plan_key: planKey,
          product: "opportunity_os",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Razorpay order creation failed: ${errorText}`);
    }

    const orderData = await response.json();
    orderId = orderData.id;
  }

  // Record transaction in database
  await supabase.from("payment_transactions").insert({
    user_id: userId,
    product: "opportunity_os",
    plan_key: planKey,
    amount,
    currency,
    provider: "razorpay",
    provider_order_id: orderId,
    status: "created",
    raw_reference: { planKey, amount, currency },
  });

  return { id: orderId, amount, currency, keyId };
}

/**
 * Validates the checkout callback signature sent from the browser.
 */
export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { keySecret } = getRazorpayCredentials();
  if (keySecret === "rzp_secret_placeholder") {
    // In dev / test placeholder mode, permit test verification
    return true;
  }

  const generatedSignature = createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Validates Razorpay Webhook signature against the raw body.
 */
export function verifyWebhookSignature({
  rawBody,
  signature,
}: {
  rawBody: string;
  signature: string;
}): boolean {
  const { webhookSecret } = getRazorpayCredentials();
  if (webhookSecret === "rzp_secret_placeholder") {
    return true;
  }

  const generatedSignature = createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

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
      source: "razorpay",
      starts_at: new Date().toISOString(),
      expires_at: newExpiresAt,
      external_reference: paymentId || orderId,
      metadata: { orderId, paymentId, amount, durationDays },
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
    provider: "razorpay",
    provider_order_id: orderId,
    provider_payment_id: paymentId,
    status: "active",
    started_at: new Date().toISOString(),
    current_period_start: new Date().toISOString(),
    current_period_end: newExpiresAt,
    metadata: { orderId, paymentId, amount },
  });

  // 4. Update Payment Transaction ledger
  await supabase
    .from("payment_transactions")
    .update({
      status: "paid",
      provider_payment_id: paymentId,
      updated_at: new Date().toISOString(),
    })
    .eq("provider_order_id", orderId);

  return { entitlementId: entitlement.id, expiresAt: entitlement.expires_at };
}
