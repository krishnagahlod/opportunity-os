import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchLinkedIn } from "@/lib/ingestion/connectors/linkedin";
import { fetchDevpost } from "@/lib/ingestion/connectors/devpost";
import { fetchGreenhouse } from "@/lib/ingestion/connectors/greenhouse";
import { fetchLever } from "@/lib/ingestion/connectors/lever";
import { fetchInternshala } from "@/lib/ingestion/connectors/internshala";
import { fetchHackerNews } from "@/lib/ingestion/connectors/hackernews";
import { type SourceListing } from "@/lib/ingestion/types";
import { logIngestion } from "@/lib/ingestion/logs";

export const runtime = "nodejs";
export const maxDuration = 60; // Max allowed for hobby plan

function hashUrl(title: string, organization: string): string {
  const key = `${title.toLowerCase().trim()}|${organization.toLowerCase().trim()}`;
  return `hash:${createHash("sha1").update(key).digest("hex").slice(0, 16)}`;
}

/**
 * Look up source by case-insensitive trimmed name; create one if missing.
 * Default kind='rss'. Returns the source.id (uuid) or null on failure.
 */
async function resolveOrCreateSource(
  supabase: ReturnType<typeof createAdminClient>,
  rawName: string,
): Promise<string | null> {
  const name = rawName.trim();
  if (!name) return null;

  const { data: existing } = await supabase
    .from("sources")
    .select("id")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from("sources")
    .insert({ name, kind: "rss", enabled: true })
    .select("id")
    .single();
  if (error) {
    console.error("[ingest] failed to create source:", name, error.message);
    return null;
  }
  return created.id;
}

export async function GET(req: NextRequest) {
  // Validate Vercel Cron Secret or INGEST_SHARED_SECRET
  const authHeader = req.headers.get("authorization");
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isManual = req.headers.get("x-ingest-secret") === process.env.INGEST_SHARED_SECRET;
  
  if (!isCron && !isManual) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const start = Date.now();
  
  const sourcesConfig = [
    { name: "LinkedIn Jobs", promise: fetchLinkedIn({ keywords: "software engineer intern", location: "India", maxPages: 2 }) },
    { name: "Devpost", promise: fetchDevpost({ maxPages: 2 }) },
    { name: "Greenhouse: Canonical", promise: fetchGreenhouse({ boards: [{ slug: "canonical", displayName: "Canonical" }] }) },
    { name: "Lever: Netflix", promise: fetchLever({ companies: [{ slug: "netflix", displayName: "Netflix" }] }) },
    { name: "Internshala", promise: fetchInternshala({ maxPages: 2 }) },
    { name: "Hacker News: Who is hiring", promise: fetchHackerNews({ maxItems: 30 }) },
  ];

  // 1. Fetch from all sources
  const results = await Promise.allSettled(sourcesConfig.map(s => s.promise));

  let totalUpserted = 0;
  let totalErrors = 0;

  // 2. Process and upsert
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const sourceName = sourcesConfig[i].name;
    const sourceId = await resolveOrCreateSource(supabase, sourceName);
    let hasSourceError = false;
    let sourceErrorMsg = null;

    if (result.status === "rejected") {
      console.error(`Fetcher failed for ${sourceName}:`, result.reason);
      totalErrors++;
      hasSourceError = true;
      sourceErrorMsg = String(result.reason);
    } else {
      const listings: SourceListing[] = result.value;
      
      for (const listing of listings) {
        const opp = listing.structured;
        const organization = opp.organization || "Unknown";
        const title = opp.title || "Unknown Title";
        const source_url = listing.sourceUrl || opp.apply_url || hashUrl(title, organization);
        
        const row = {
          title,
          organization,
          category: opp.category,
          description: opp.description || null,
          summary: opp.summary || null,
          location: opp.location || null,
          compensation: opp.compensation || null,
          is_remote: opp.is_remote ?? false,
          apply_url: opp.apply_url || null,
          source_url,
          source_id: sourceId,
          status: "active" as const,
          tags: [],
          required_skills: [],
        };

        const { data, error } = await supabase
          .from("opportunities")
          .upsert(row, { onConflict: "source_url", ignoreDuplicates: true })
          .select("id")
          .single();
          
        if (error) {
          console.error("Failed to upsert:", error);
          totalErrors++;
          void logIngestion({
            status: "failed",
            source_url,
            source_name: sourceName,
            source_id: sourceId,
            reason: `upsert: ${error.message}`,
            duration_ms: Date.now() - start,
          });
        } else if (data) {
          totalUpserted++;
          void logIngestion({
            status: "upserted",
            source_url,
            source_name: sourceName,
            source_id: sourceId,
            opportunity_id: data.id,
            duration_ms: Date.now() - start,
          });
        }
      }
    }

    if (sourceId) {
      await supabase
        .from("sources")
        .update({
          last_run_at: new Date().toISOString(),
          last_status: hasSourceError ? "error" : "ok",
          last_error: sourceErrorMsg,
        })
        .eq("id", sourceId);
    }
  }

  return NextResponse.json({
    ok: true,
    upserted: totalUpserted,
    errors: totalErrors,
    durationMs: Date.now() - start
  });
}
