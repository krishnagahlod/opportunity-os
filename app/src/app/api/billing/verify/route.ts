import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  activateOrExtendEntitlement,
  getDodoPaymentStatus,
  PLAN_PRICING,
} from "@/lib/payments/dodo";
import { handleApiError } from "@/lib/security/errors";
import type { PlanKey } from "@/types/db";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { paymentId, planKey } = body as {
      paymentId: string;
      planKey: PlanKey;
    };

    if (!paymentId || !planKey) {
      return NextResponse.json(
        { error: "Missing required paymentId or planKey" },
        { status: 400 }
      );
    }

    // 1. Verify transaction record if previously initiated
    const admin = createAdminClient();
    const { data: tx } = await admin
      .from("payment_transactions")
      .select("*")
      .eq("provider_order_id", paymentId)
      .maybeSingle();

    // 2. Verify payment status directly with Dodo Payments API
    const paymentStatus = await getDodoPaymentStatus(paymentId);

    if (paymentStatus.status !== "succeeded") {
      return NextResponse.json(
        { error: `Payment not completed. Current status: ${paymentStatus.status}` },
        { status: 400 }
      );
    }

    // 3. Defense against price tampering / tier escalation:
    // Ensure the client cannot claim pro_365d if they only paid for pro_30d
    let verifiedPlanKey: PlanKey = (tx?.plan_key as PlanKey) || planKey;
    const paidKey = verifiedPlanKey as keyof typeof PLAN_PRICING;
    if (paymentStatus.totalAmount && PLAN_PRICING[paidKey]) {
      const expectedAmount = PLAN_PRICING[paidKey].amount;
      if (paymentStatus.totalAmount < expectedAmount) {
        if (paymentStatus.totalAmount >= PLAN_PRICING.pro_90d.amount) {
          verifiedPlanKey = "pro_90d";
        } else {
          verifiedPlanKey = "pro_30d";
        }
      }
    }

    // 4. Activate or Extend entitlement idempotently
    const result = await activateOrExtendEntitlement({
      userId: user.id,
      planKey: verifiedPlanKey,
      paymentId,
      amount: paymentStatus.totalAmount,
    });

    return NextResponse.json({
      success: true,
      message: "Pro access activated successfully",
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    return handleApiError(error, "billing-verify");
  }
}
