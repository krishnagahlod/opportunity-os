import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { callLLM } from "@/lib/ai/fallover";
import {
  AI_MATCH_SYSTEM_INSTRUCTION,
  buildMatchPrompt,
  ResumeMatchSchema,
} from "@/lib/ai/prompts";

export const runtime = "nodejs";
export const maxDuration = 60; // 60s since it calls LLM

/**
 * GET /api/ai/match?opportunityId=xxx
 * 
 * Fetches the user's resume text and the opportunity details,
 * evaluates the fit via LLM, caches the result in resume_matches,
 * and returns it.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const oppId = searchParams.get("opportunityId");
  if (!oppId) {
    return NextResponse.json({ error: "Missing opportunityId" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Check cache first
  const { data: cachedMatch } = await admin
    .from("resume_matches")
    .select("*")
    .eq("user_id", user.id)
    .eq("opportunity_id", oppId)
    .single();

  if (cachedMatch) {
    return NextResponse.json(cachedMatch);
  }

  // Fetch opportunity
  const { data: opp, error: oppErr } = await admin
    .from("opportunities")
    .select("title, organization, description, required_skills")
    .eq("id", oppId)
    .single();

  if (oppErr || !opp) {
    return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  }

  // Fetch profile's resume_text
  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select("resume_text")
    .eq("id", user.id)
    .single();

  if (profErr || !profile || !profile.resume_text) {
    return NextResponse.json({ error: "No resume found on profile" }, { status: 400 });
  }

  // Call AI Match
  const prompt = buildMatchPrompt(
    profile.resume_text,
    opp.title,
    opp.organization,
    opp.description,
    opp.required_skills || []
  );

  try {
    const { data: matchResult } = await callLLM({
      prompt,
      schema: ResumeMatchSchema,
      systemInstruction: AI_MATCH_SYSTEM_INSTRUCTION,
      maxTokens: 500,
      groqModel: "openai/gpt-oss-120b",
      primaryProvider: "groq", // We use Groq first for speed
    });

    // Cache the result
    const { data: newMatch, error: insertErr } = await admin
      .from("resume_matches")
      .insert({
        user_id: user.id,
        opportunity_id: oppId,
        match_score: matchResult.match_score,
        strengths: matchResult.strengths,
        weaknesses: matchResult.weaknesses,
      })
      .select()
      .single();

    if (insertErr || !newMatch) {
      console.error("[api/ai/match] Insert error:", insertErr);
      return NextResponse.json(matchResult); // Return it anyway even if cache fails
    }

    return NextResponse.json(newMatch);
  } catch (error: any) {
    console.error("[api/ai/match] LLM error:", error);
    return NextResponse.json({ error: "Failed to compute match score" }, { status: 500 });
  }
}
