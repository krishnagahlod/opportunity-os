import { NextResponse, type NextRequest } from "next/server";
import {
  activateOrExtendEntitlement,
  verifyCashfreeWebhookSignature,
} from "@/lib/payments/cashfree";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanKey } from "@/types/db";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    const timestamp = req.headers.get("x-webhook-timestamp") || "";

    if (signature) {
      const isValid = verifyCashfreeWebhookSignature({ rawBody, timestamp, signature });
      if (!isValid) {
        console.warn("[billing-webhook] Invalid Cashfree webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    // Cashfree PG webhook payload structure
    const orderId = payload.data?.order?.order_id || payload.orderId;
    const paymentStatus = payload.data?.payment?.payment_status || payload.txStatus;
    const paymentId = payload.data?.payment?.cf_payment_id || payload.referenceId;
    const amount = payload.data?.payment?.payment_amount || payload.orderAmount;

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
      console.warn("[billing-webhook] Unrecognized Cashfree order id:", orderId);
      return NextResponse.json({ received: true });
    }

    // Idempotency check: if transaction is already processed as paid, return 200 immediately
    if (transaction.status === "paid") {
      return NextResponse.json({ received: true, message: "Already processed" });
    }

    if (paymentStatus === "SUCCESS" || paymentStatus === "PAID") {
      await activateOrExtendEntitlement({
        userId: transaction.user_id,
        planKey: transaction.plan_key as PlanKey,
        orderId,
        paymentId: paymentId?.toString(),
        amount,
      });

      console.log(`[billing-webhook] Successfully processed Cashfree payment for user ${transaction.user_id}`);
    } else if (paymentStatus === "FAILED" || paymentStatus === "USER_DROPPED") {
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
    console.error("[billing-webhook] Error processing Cashfree webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
