import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { callLLM } from "@/lib/ai/fallover";
import { logIngestion, estimateTokens } from "@/lib/ingestion/logs";
import { 
  buildExtractPrompt, 
  ExtractedOpportunitySchema, 
  EXTRACT_SYSTEM_INSTRUCTION 
} from "@/lib/ai/prompts";

export const runtime = "nodejs";
export const maxDuration = 60; 

function isRelevantOpportunity(title: string, category: string | null): boolean {
  const t = title.toLowerCase();
  
  // Explicitly reject senior/managerial roles immediately
  const isSenior = t.includes("senior") || t.includes("staff") || t.includes("lead ") || t.includes("manager") || t.includes("director") || t.includes("head ") || t.includes("principal") || t.includes("vp ") || t.includes("president");
  if (isSenior) return false;

  // Accept explicitly early-career formats
  if (["internship", "fellowship", "scholarship", "hackathon", "bootcamp"].includes(category || "")) return true;
  if (t.includes("intern") || t.includes("fellow") || t.includes("scholar") || t.includes("hackathon") || t.includes("co-op")) return true;

  // For full-time jobs, we apply strict filters to rebalance the platform.
  // We only accept full-time roles if they explicitly say "new grad", "junior", "entry level", or "associate".
  const isStrictEarlyCareer = t.includes("new grad") || t.includes("junior") || t.includes("entry level") || t.includes("entry-level") || t.includes("associate");
  if (category === "fulltime" && !isStrictEarlyCareer) {
    return false; // Skip generic full-time roles to reduce their proportion on the platform
  }

  // Allow if it passes the checks (e.g. it's early career fulltime or another unhandled category)
  // Or if category is unknown but title has early career keywords.
  return isStrictEarlyCareer;
}

function guessCategoryFast(title: string, hint?: string): string | null {
  if (hint && hint !== "unknown" && hint !== "other") return hint;
  const t = title.toLowerCase();
  if (t.includes("intern") || t.includes("co-op")) return "internship";
  if (t.includes("fellowship")) return "fellowship";
  if (t.includes("scholarship")) return "scholarship";
  if (t.includes("hackathon")) return "hackathon";
  if (t.includes("conference")) return "conference";
  if (t.includes("bootcamp")) return "bootcamp";
  if (t.includes("workshop")) return "workshop";
  return null;
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  
  if (
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}` &&
    process.env.NODE_ENV === "production"
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 1. Fetch up to 5 pending raw opportunities to avoid LLM timeouts
  const { data: rawRows, error: fetchError } = await supabase
    .from("raw_opportunities")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(5); // Reduced from 30 to prevent 504 Gateway Timeout

  if (fetchError) {
    console.error("Failed to fetch pending raw opportunities:", fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!rawRows || rawRows.length === 0) {
    return NextResponse.json({ ok: true, message: "No pending opportunities found." });
  }

  let totalUpserted = 0;
  let totalErrors = 0;
  let totalDuplicates = 0;

  // 2. Process sequentially to prevent Vercel 60s cutoff and Groq rate limits
  for (const raw of rawRows) {
    if (Date.now() - start > 25000) { // Reduced from 45000 to ensure we exit before Vercel kills us
      console.log("Approaching Vercel timeout, stopping batch early.");
      break;
    }

    try {
      const opp = raw.raw_data;
      const organization = opp.organization || "Unknown";
      const title = opp.title || "Unknown Title";
      const source_url = raw.source_url;
      const sourceId = raw.source_id;

      // Deduplication Check
      const { data: existing } = await supabase
        .from("opportunities")
        .select("id")
        .ilike("organization", organization)
        .ilike("title", title)
        .limit(1)
        .maybeSingle();
      
      if (existing) {
        await supabase.from("raw_opportunities").update({ status: "duplicate", processed_at: new Date().toISOString() }).eq("id", raw.id);
        totalDuplicates++;
        continue;
      }

      let finalCategory = guessCategoryFast(title, opp.category);

      if (!isRelevantOpportunity(title, finalCategory)) {
        await supabase.from("raw_opportunities").update({ status: "skipped", processed_at: new Date().toISOString() }).eq("id", raw.id);
        totalDuplicates++; // treating as skipped
        continue;
      }
      
      let extractedData: Partial<typeof opp> = {};
      let extractionConfidence = null;
      let extractionDifficulty = null;
      let estimatedValueScore = null;
        try {
          const rawInputText = opp.description || opp.rawText || title;
          const extractionResult = await callLLM({
            prompt: buildExtractPrompt({ 
              rawText: rawInputText, 
              sourceUrl: source_url, 
              hint: `title: ${title}, org: ${organization}` 
            }),
            schema: ExtractedOpportunitySchema,
            systemInstruction: EXTRACT_SYSTEM_INSTRUCTION
          });
          
          if (extractionResult.data.extraction_confidence >= 0.4) {
            finalCategory = extractionResult.data.category;
            extractedData = extractionResult.data;
            extractionConfidence = extractionResult.data.extraction_confidence;
            extractionDifficulty = extractionResult.data.difficulty;
            estimatedValueScore = extractionResult.data.estimated_value_score;
          }
          
          void logIngestion({
            status: "extracted",
            source_url,
            source_name: "RawProcessor",
            source_id: sourceId,
            provider: extractionResult.provider,
            tokens_used: estimateTokens(extractionResult.raw),
            duration_ms: Date.now() - start,
          });
        } catch (e) {
          console.error(`[process-raw] Extraction failed for ${title}:`, e);
        }

      // Re-run relevance filter in case LLM categorization revealed it's irrelevant
      if (!isRelevantOpportunity(extractedData.title || title, finalCategory)) {
        await supabase.from("raw_opportunities").update({ status: "skipped", processed_at: new Date().toISOString() }).eq("id", raw.id);
        totalDuplicates++; // repurpose counter
        continue;
      }
      
      const row = {
        title: extractedData.title || title,
        organization: extractedData.organization || organization,
        category: finalCategory || "other",
        description: extractedData.description || opp.description || null,
        summary: extractedData.summary || opp.summary || null,
        location: extractedData.location || opp.location || null,
        compensation: extractedData.compensation || opp.compensation || null,
        is_remote: extractedData.is_remote ?? opp.is_remote ?? false,
        apply_url: extractedData.apply_url || opp.apply_url || null,
        source_url,
        source_id: sourceId,
        status: "active",
        tags: extractedData.tags || opp.tags || [],
        required_skills: extractedData.required_skills || opp.required_skills || [],
        difficulty: extractionDifficulty || null,
        estimated_value_score: estimatedValueScore || null,
        extraction_confidence: extractionConfidence,
      };

      const { data, error } = await supabase
        .from("opportunities")
        .upsert(row, { onConflict: "source_url", ignoreDuplicates: true })
        .select("id")
        .single();
        
      if (error) {
        console.error("Failed to upsert from raw:", error);
        totalErrors++;
        await supabase.from("raw_opportunities").update({ status: "failed", processed_at: new Date().toISOString() }).eq("id", raw.id);
      } else if (data) {
        totalUpserted++;
        await supabase.from("raw_opportunities").update({ status: "processed", processed_at: new Date().toISOString() }).eq("id", raw.id);
      }
    } catch (err) {
      console.error(`Error processing raw id ${raw.id}`, err);
      totalErrors++;
      await supabase.from("raw_opportunities").update({ status: "failed", processed_at: new Date().toISOString() }).eq("id", raw.id);
    }
  }

  return NextResponse.json({
    ok: true,
    processed: rawRows.length,
    upserted: totalUpserted,
    duplicatesSkipped: totalDuplicates,
    errors: totalErrors,
    durationMs: Date.now() - start
  });
}
