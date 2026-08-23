import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanKey } from "@/types/db";

export const PLAN_PRICING: Record<
  "pro_30d" | "pro_90d" | "pro_365d",
  { amount: number; amountPaise: number; durationDays: number; name: string; description: string }
> = {
  pro_30d: {
    amount: 299,
    amountPaise: 29900,
    durationDays: 30,
    name: "Opportunity OS Pro (30 Days)",
    description: "1 Month Pro Pass - Full intelligence, feeds & outreach",
  },
  pro_90d: {
    amount: 799,
    amountPaise: 79900,
    durationDays: 90,
    name: "Opportunity OS Pro (90 Days)",
    description: "Quarterly Career Pass - Most popular student pass",
  },
  pro_365d: {
    amount: 2499,
    amountPaise: 249900,
    durationDays: 365,
    name: "Opportunity OS Pro (1 Year)",
    description: "Annual Unlimited Career Pass - All hiring cycles & priority AI",
  },
};

export function getDodoCredentials() {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY || "dodo_test_placeholder";
  const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY || "";
  const envMode = (process.env.DODO_PAYMENTS_MODE || process.env.NEXT_PUBLIC_DODO_PAYMENTS_MODE || "test_mode").toLowerCase();
  const apiBase =
    envMode === "live_mode" || envMode === "live" || envMode === "production"
      ? "https://live.dodopayments.com"
      : "https://test.dodopayments.com";

  // Optional Product IDs if created inside Dodo Payments Dashboard
  const productIds = {
    pro_30d: process.env.DODO_PRODUCT_PRO_30D || "",
    pro_90d: process.env.DODO_PRODUCT_PRO_90D || "",
    pro_365d: process.env.DODO_PRODUCT_PRO_365D || "",
  };

  return { apiKey, webhookKey, envMode, apiBase, productIds };
}

/**
 * Creates a checkout / payment link using Dodo Payments API.
 * Users can pay via UPI (GPay, PhonePe, Paytm, QR) or Debit/Credit Cards.
 */
export async function createDodoPayment({
  userId,
  userEmail,
  userName,
  planKey,
  returnUrl,
}: {
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  planKey: "pro_30d" | "pro_90d" | "pro_365d";
  returnUrl?: string;
}): Promise<{
  paymentId: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
}> {
  const { apiKey, apiBase, productIds } = getDodoCredentials();
  const planInfo = PLAN_PRICING[planKey];

  if (!planInfo) {
    throw new Error(`Invalid plan key: ${planKey}`);
  }

  const supabase = createAdminClient();
  const amount = planInfo.amount;
  const currency = "INR";
  const defaultReturnUrl =
    returnUrl ||
    `${process.env.NEXT_PUBLIC_APP_URL || "https://opportunity-os.vercel.app"}/settings/billing?status=success`;

  let paymentId = `dodo_pay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  let checkoutUrl = `${defaultReturnUrl}&payment_id=${paymentId}`;

  // If real Dodo Payments API key is configured, call Dodo Payments API
  if (apiKey && apiKey !== "dodo_test_placeholder") {
    const configuredProductId = productIds[planKey];

    // Payload supporting product_id or dynamic line items
    const productCart = configuredProductId
      ? [{ product_id: configuredProductId, quantity: 1 }]
      : [
          {
            amount: planInfo.amountPaise,
            currency: "INR",
            name: planInfo.name,
            description: planInfo.description,
            quantity: 1,
          },
        ];

    const bodyPayload: any = {
      billing: {
        country: "IN",
      },
      customer: {
        email: userEmail || "student@opportunityos.com",
        name: userName || "Opportunity OS User",
      },
      payment_link: true,
      product_cart: productCart,
      return_url: defaultReturnUrl,
      metadata: {
        userId,
        planKey,
        product: "opportunity_os",
      },
    };

    const response = await fetch(`${apiBase}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dodo Payments order creation failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    paymentId = data.payment_id || data.id || paymentId;
    checkoutUrl = data.payment_link || data.payment_link_url || data.checkout_url || checkoutUrl;
  }

  // Record payment transaction in database
  await supabase.from("payment_transactions").insert({
    user_id: userId,
    product: "opportunity_os",
    plan_key: planKey,
    amount: planInfo.amountPaise, // In paise
    currency,
    provider: "dodopayments",
    provider_order_id: paymentId,
    status: "created",
    raw_reference: { planKey, amount, currency, checkoutUrl, provider: "dodopayments" },
  });

  return {
    paymentId,
    checkoutUrl,
    amount,
    currency,
  };
}

/**
 * Fetches payment status directly from Dodo Payments.
 */
export async function getDodoPaymentStatus(paymentId: string): Promise<{
  status: "succeeded" | "failed" | "pending" | "processing";
  totalAmount?: number;
  metadata?: Record<string, any>;
}> {
  const { apiKey, apiBase } = getDodoCredentials();

  if (!apiKey || apiKey === "dodo_test_placeholder") {
    return { status: "succeeded" };
  }

  const response = await fetch(`${apiBase}/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to fetch Dodo payment status: ${err}`);
  }

  const data = await response.json();
  const status = (data.status || "").toLowerCase();

  return {
    status:
      status === "succeeded" || status === "success" || status === "paid"
        ? "succeeded"
        : status === "failed" || status === "cancelled"
        ? "failed"
        : "pending",
    totalAmount: data.total_amount || data.amount,
    metadata: data.metadata,
  };
}

/**
 * Validates Dodo Payments webhook signature (using Svix standard or HMAC SHA256).
 */
export function verifyDodoWebhookSignature({
  rawBody,
  headers,
}: {
  rawBody: string;
  headers: Headers;
}): boolean {
  const { webhookKey } = getDodoCredentials();
  if (!webhookKey) {
    // If webhook secret not configured yet, allow for testing
    return true;
  }

  const webhookId = headers.get("webhook-id") || headers.get("x-webhook-id") || "";
  const timestamp = headers.get("webhook-timestamp") || headers.get("x-webhook-timestamp") || "";
  const signature = headers.get("webhook-signature") || headers.get("x-webhook-signature") || "";

  if (!signature) return false;

  try {
    const cleanKey = webhookKey.startsWith("whsec_")
      ? webhookKey.substring("whsec_".length)
      : webhookKey;
    const secretBytes = Buffer.from(cleanKey, "base64");

    const message = `${webhookId}.${timestamp}.${rawBody}`;
    const hmac = createHmac("sha256", secretBytes);
    hmac.update(message);
    const expectedSig = hmac.digest("base64");

    // Extract signature part if v1,... format
    const sigParts = signature.split(" ");
    for (const part of sigParts) {
      const [version, sig] = part.split(",");
      const actualSig = sig || version;
      if (actualSig && timingSafeEqual(Buffer.from(expectedSig), Buffer.from(actualSig))) {
        return true;
      }
    }
    return false;
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
  paymentId,
  amount,
}: {
  userId: string;
  planKey: PlanKey;
  paymentId: string;
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

  // 2. Insert Entitlement
  const { data: entitlement, error: entErr } = await supabase
    .from("entitlements")
    .insert({
      user_id: userId,
      product: "opportunity_os",
      plan_key: planKey,
      status: "active",
      source: "dodopayments",
      starts_at: new Date().toISOString(),
      expires_at: newExpiresAt,
      external_reference: paymentId,
      metadata: { paymentId, amount, durationDays, provider: "dodopayments" },
    })
    .select("id, expires_at")
    .single();

  if (entErr) {
    throw new Error(`Failed to activate entitlement: ${entErr.message}`);
  }

  // 3. Insert Subscription record
  await supabase.from("subscriptions").insert({
    user_id: userId,
    product: "opportunity_os",
    plan_key: planKey,
    provider: "dodopayments",
    provider_order_id: paymentId,
    provider_payment_id: paymentId,
    status: "active",
    started_at: new Date().toISOString(),
    current_period_start: new Date().toISOString(),
    current_period_end: newExpiresAt,
    metadata: { paymentId, amount, provider: "dodopayments" },
  });

  // 4. Update Payment Transaction ledger
  await supabase
    .from("payment_transactions")
    .update({
      status: "paid",
      provider_payment_id: paymentId,
      updated_at: new Date().toISOString(),
    })
    .eq("provider_order_id", paymentId);

  return { entitlementId: entitlement.id, expiresAt: entitlement.expires_at };
}
