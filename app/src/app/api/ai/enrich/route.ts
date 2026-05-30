import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { callLLM } from "@/lib/ai/fallover";
import { 
  buildEnrichPrompt, 
  ENRICH_SYSTEM_INSTRUCTION, 
  OpportunityEnrichmentSchema 
} from "@/lib/ai/prompts";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // In a real scenario, this might also be called by an admin or cron job.
    // For now, let's require authentication to trigger enrichment.
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { opportunity_id } = await req.json();

    if (!opportunity_id) {
      return NextResponse.json({ error: "Missing opportunity_id" }, { status: 400 });
    }

    const { data: opp, error: oppErr } = await supabase
      .from("opportunities")
      .select("*")
      .eq("id", opportunity_id)
      .single();

    if (oppErr || !opp) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const prompt = buildEnrichPrompt(
      opp.title,
      opp.organization,
      opp.category,
      opp.description,
      opp.eligibility
    );

    const { data: enrichment, provider } = await callLLM({
      prompt,
      schema: OpportunityEnrichmentSchema,
      systemInstruction: ENRICH_SYSTEM_INSTRUCTION,
      maxTokens: 1000,
    });

    // Save enrichment fields back to the opportunity
    const { error: updateErr } = await supabase
      .from("opportunities")
      .update({
        role_seniority: enrichment.role_seniority,
        eligibility_tags: enrichment.eligibility_tags,
        effort_score: enrichment.effort_score,
        upside_score: enrichment.upside_score,
        competition_intensity: enrichment.competition_intensity,
        legitimacy_score: enrichment.legitimacy_score,
        action_plan: enrichment.action_plan,
        red_flags: enrichment.red_flags,
        enriched_at: new Date().toISOString(),
      })
      .eq("id", opportunity_id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, provider, enrichment });
  } catch (error: any) {
    console.error("Enrichment error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
