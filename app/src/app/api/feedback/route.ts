import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { handleApiError } from "@/lib/security/errors";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`feedback:${user.id}`, 5, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many feedback submissions. Please wait a minute." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { opportunityId, feedback } = body;

    if (!opportunityId || typeof opportunityId !== "string" || !feedback || typeof feedback !== "string") {
      return NextResponse.json({ error: "Invalid feedback submission" }, { status: 400 });
    }

    // Limit feedback length to prevent storage exhaustion
    const sanitizedFeedback = feedback.trim().slice(0, 2000);

    const { error } = await supabase
      .from("opportunity_feedback")
      .upsert({
        user_id: user.id,
        opportunity_id: opportunityId,
        feedback: sanitizedFeedback,
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "feedback");
  }
}
