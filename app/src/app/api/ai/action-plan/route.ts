import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { callLLM } from "@/lib/ai/fallover";
import { 
  buildActionPlanPrompt, 
  ACTION_PLAN_SYSTEM_INSTRUCTION, 
  ActionPlanSchema 
} from "@/lib/ai/prompts";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { opportunity_id } = await req.json();

    if (!opportunity_id) {
      return NextResponse.json({ error: "Missing opportunity_id" }, { status: 400 });
    }

    // Fetch opportunity
    const { data: opp, error: oppErr } = await supabase
      .from("opportunities")
      .select("*")
      .eq("id", opportunity_id)
      .single();

    if (oppErr || !opp) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    // Fetch user profile (to get resume_text, skills, and goals)
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("resume_text, skills, goals")
      .eq("id", user.id)
      .single();

    if (profErr || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const prompt = buildActionPlanPrompt(
      opp.title,
      opp.organization || "the organization",
      opp.description,
      profile.resume_text,
      profile.skills || [],
      profile.goals || []
    );

    const { data: actionPlan, provider } = await callLLM({
      prompt,
      schema: ActionPlanSchema,
      systemInstruction: ACTION_PLAN_SYSTEM_INSTRUCTION,
      maxTokens: 2500,
    });

    return NextResponse.json({ success: true, provider, actionPlan });
  } catch (error: any) {
    console.error("Action Plan error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
