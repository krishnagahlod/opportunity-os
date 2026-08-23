import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  activateOrExtendEntitlement,
  verifyPaymentSignature,
} from "@/lib/payments/razorpay";
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
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planKey,
    } = body as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      planKey: PlanKey;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planKey) {
      return NextResponse.json(
        { error: "Missing required payment verification fields" },
        { status: 400 }
      );
    }

    // 1. Verify signature server-side
    const isValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      console.warn("[billing] invalid payment signature for user:", user.id);
      return NextResponse.json(
        { error: "Payment verification failed: Invalid signature" },
        { status: 400 }
      );
    }

    // 2. Activate / Extend entitlement
    const result = await activateOrExtendEntitlement({
      userId: user.id,
      planKey,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
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
