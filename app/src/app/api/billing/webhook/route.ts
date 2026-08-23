import { NextResponse, type NextRequest } from "next/server";
import {
  activateOrExtendEntitlement,
  verifyDodoWebhookSignature,
} from "@/lib/payments/dodo";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanKey } from "@/types/db";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headers = req.headers;

    const isValid = verifyDodoWebhookSignature({ rawBody, headers });
    if (!isValid) {
      console.warn("[billing-webhook] Invalid Dodo Payments webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.type || payload.event_type || payload.event;
    const data = payload.data || payload;

    const paymentId = data.payment_id || data.id || data.metadata?.paymentId;
    const userId = data.metadata?.userId || data.customer?.metadata?.userId;
    const planKey = data.metadata?.planKey as PlanKey | undefined;
    const totalAmount = data.total_amount || data.amount;

    if (!paymentId) {
      return NextResponse.json({ received: true });
    }

    const supabase = createAdminClient();

    // Check transaction record
    const { data: transaction } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("provider_order_id", paymentId)
      .maybeSingle();

    const targetUserId = userId || transaction?.user_id;
    const targetPlanKey = (planKey || transaction?.plan_key || "pro_30d") as PlanKey;

    if (!targetUserId) {
      console.warn("[billing-webhook] Could not resolve user for Dodo payment:", paymentId);
      return NextResponse.json({ received: true });
    }

    // Idempotency: if already marked paid, return 200
    if (transaction?.status === "paid") {
      return NextResponse.json({ received: true, message: "Already processed" });
    }

    if (eventType === "payment.succeeded" || eventType === "payment_success" || eventType === "order.paid") {
      await activateOrExtendEntitlement({
        userId: targetUserId,
        planKey: targetPlanKey,
        paymentId,
        amount: totalAmount,
      });

      console.log(`[billing-webhook] Activated Pro entitlement for user ${targetUserId} via Dodo Payments`);
    } else if (eventType === "payment.failed" || eventType === "payment_failed") {
      await supabase
        .from("payment_transactions")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("provider_order_id", paymentId);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[billing-webhook] Error processing Dodo webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
