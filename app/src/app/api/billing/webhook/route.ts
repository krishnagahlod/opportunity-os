import { NextResponse, type NextRequest } from "next/server";
import {
  activateOrExtendEntitlement,
  verifyWebhookSignature,
} from "@/lib/payments/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanKey } from "@/types/db";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const isValid = verifyWebhookSignature({ rawBody, signature });
    if (!isValid) {
      console.warn("[billing-webhook] Invalid webhook signature received");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    const orderId = paymentEntity?.order_id || orderEntity?.id;
    const paymentId = paymentEntity?.id;
    const amount = paymentEntity?.amount;

    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    const supabase = createAdminClient();

    // Find the matching transaction in database
    const { data: transaction } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("provider_order_id", orderId)
      .maybeSingle();

    if (!transaction) {
      console.warn("[billing-webhook] Unrecognized order id:", orderId);
      return NextResponse.json({ received: true });
    }

    // Idempotency check: if transaction is already processed as paid, return 200 immediately
    if (transaction.status === "paid") {
      return NextResponse.json({ received: true, message: "Already processed" });
    }

    if (event === "payment.captured" || event === "order.paid") {
      await activateOrExtendEntitlement({
        userId: transaction.user_id,
        planKey: transaction.plan_key as PlanKey,
        orderId,
        paymentId,
        amount,
      });

      console.log(`[billing-webhook] Successfully processed payment for user ${transaction.user_id}`);
    } else if (event === "payment.failed") {
      await supabase
        .from("payment_transactions")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("provider_order_id", orderId);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[billing-webhook] Error processing webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
