import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createDodoPayment, PLAN_PRICING } from "@/lib/payments/dodo";

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
    const { planKey, returnUrl } = body as {
      planKey: "pro_30d" | "pro_90d" | "pro_365d";
      returnUrl?: string;
    };

    if (!planKey || !PLAN_PRICING[planKey]) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const payment = await createDodoPayment({
      userId: user.id,
      userEmail: user.email,
      userName: user.user_metadata?.full_name || user.email?.split("@")[0],
      planKey,
      returnUrl,
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.paymentId,
      checkoutUrl: payment.checkoutUrl,
      amount: payment.amount,
      currency: payment.currency,
      planName: PLAN_PRICING[planKey].name,
    });
  } catch (error: any) {
    console.error("[billing] create-order error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
