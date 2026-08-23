import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCashfreeOrder, PLAN_PRICING } from "@/lib/payments/cashfree";

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
    const { planKey } = body as { planKey: "pro_30d" | "pro_90d" | "pro_365d" };

    if (!planKey || !PLAN_PRICING[planKey]) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const order = await createCashfreeOrder({
      userId: user.id,
      userEmail: user.email,
      planKey,
    });

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      paymentSessionId: order.paymentSessionId,
      amount: order.amount,
      currency: order.currency,
      envMode: order.envMode,
      planName: PLAN_PRICING[planKey].name,
      userEmail: user.email,
    });
  } catch (error: any) {
    console.error("[billing] create-order error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
