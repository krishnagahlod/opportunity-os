import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  activateOrExtendEntitlement,
  getDodoPaymentStatus,
} from "@/lib/payments/dodo";
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

    // 1. Verify payment status directly with Dodo Payments
    const paymentStatus = await getDodoPaymentStatus(paymentId);

    if (paymentStatus.status !== "succeeded") {
      return NextResponse.json(
        { error: `Payment not completed. Current status: ${paymentStatus.status}` },
        { status: 400 }
      );
    }

    // 2. Activate or Extend entitlement
    const result = await activateOrExtendEntitlement({
      userId: user.id,
      planKey,
      paymentId,
      amount: paymentStatus.totalAmount,
    });

    return NextResponse.json({
      success: true,
      message: "Pro access activated successfully",
      expiresAt: result.expiresAt,
    });
  } catch (error: any) {
    console.error("[billing] verification error:", error);
    return NextResponse.json(
      { error: error.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}
