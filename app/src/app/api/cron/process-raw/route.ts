import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { callLLM } from "@/lib/ai/fallover";
import { logIngestion, estimateTokens } from "@/lib/ingestion/logs";
import { 
  buildCategoryRefinementPrompt, 
  CategoryRefinementSchema, 
  CATEGORY_REFINEMENT_SYSTEM_INSTRUCTION 
} from "@/lib/ai/prompts";

export const runtime = "nodejs";
export const maxDuration = 60; 

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

  // 1. Fetch up to 75 pending raw opportunities
  const { data: rawRows, error: fetchError } = await supabase
    .from("raw_opportunities")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(75);

  if (fetchError) {
    console.error("Failed to fetch raw_opportunities", fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!rawRows || rawRows.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, message: "No pending rows" });
  }

  let totalUpserted = 0;
  let totalErrors = 0;
  let totalDuplicates = 0;

  // 2. Process concurrently
  await Promise.all(rawRows.map(async (raw) => {
    try {
      const opp = raw.raw_data;
      const organization = opp.organization || "Unknown";
      const title = opp.title || "Unknown Title";
      const source_url = raw.source_url;
      const sourceId = raw.source_id;

      // Deduplication Check
      // Look for active opportunities with the same organization and similar title
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
        return;
      }

      let finalCategory = guessCategoryFast(title, opp.category);
      
      const timeElapsed = Date.now() - start;
      const nearTimeout = timeElapsed > 45000;
      
      if (!nearTimeout && (!finalCategory || finalCategory === "other")) {
        try {
          const refinementResult = await callLLM({
            prompt: buildCategoryRefinementPrompt(title, organization, opp.description || opp.rawText || "", finalCategory || "unknown"),
            schema: CategoryRefinementSchema,
            systemInstruction: CATEGORY_REFINEMENT_SYSTEM_INSTRUCTION
          });
          
          if (refinementResult.data.confidence >= 0.7) {
            finalCategory = refinementResult.data.category;
          }
          
          void logIngestion({
            status: "extracted",
            source_url,
            source_name: "RawProcessor",
            source_id: sourceId,
            provider: refinementResult.provider,
            tokens_used: estimateTokens(refinementResult.raw),
            duration_ms: Date.now() - start,
          });
        } catch (e) {
          console.error(`[process-raw] Category refinement failed for ${title}:`, e);
        }
      }
      
      const row = {
        title,
        organization,
        category: finalCategory || "other",
        description: opp.description || null,
        summary: opp.summary || null,
        location: opp.location || null,
        compensation: opp.compensation || null,
        is_remote: opp.is_remote ?? false,
        apply_url: opp.apply_url || null,
        source_url,
        source_id: sourceId,
        status: "active",
        tags: opp.tags || [],
        required_skills: opp.required_skills || [],
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
  }));

  return NextResponse.json({
    ok: true,
    processed: rawRows.length,
    upserted: totalUpserted,
    duplicatesSkipped: totalDuplicates,
    errors: totalErrors,
    durationMs: Date.now() - start
  });
}
