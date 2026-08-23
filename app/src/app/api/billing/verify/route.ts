import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  activateOrExtendEntitlement,
  getCashfreeOrderStatus,
} from "@/lib/payments/cashfree";
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
    const { orderId, planKey } = body as {
      orderId: string;
      planKey: PlanKey;
    };

    if (!orderId || !planKey) {
      return NextResponse.json(
        { error: "Missing required orderId or planKey" },
        { status: 400 }
      );
    }

    // 1. Query Cashfree API directly for order verification
    const orderStatus = await getCashfreeOrderStatus(orderId);

    if (orderStatus.status !== "PAID") {
      return NextResponse.json(
        { error: `Payment not completed. Current status: ${orderStatus.status}` },
        { status: 400 }
      );
    }

    // 2. Activate / Extend entitlement
    const result = await activateOrExtendEntitlement({
      userId: user.id,
      planKey,
      orderId,
      amount: orderStatus.orderAmount,
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
