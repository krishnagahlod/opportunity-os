import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchLinkedIn } from "@/lib/ingestion/connectors/linkedin";
import { fetchDevpost } from "@/lib/ingestion/connectors/devpost";
import { fetchGreenhouse } from "@/lib/ingestion/connectors/greenhouse";
import { fetchLever } from "@/lib/ingestion/connectors/lever";
import { fetchInternshala } from "@/lib/ingestion/connectors/internshala";
import { fetchHackerNews } from "@/lib/ingestion/connectors/hackernews";
import { fetchRss } from "@/lib/ingestion/connectors/rss";
import { fetchAshbyConnector } from "@/lib/ingestion/connectors/ashby";
import { fetchRemoteOK } from "@/lib/ingestion/connectors/remoteok";
import { fetchStaticPages } from "@/lib/ingestion/connectors/static";
import { type SourceListing } from "@/lib/ingestion/types";
import { logIngestion, estimateTokens } from "@/lib/ingestion/logs";
import { callLLM } from "@/lib/ai/fallover";
import { 
  buildCategoryRefinementPrompt, 
  CategoryRefinementSchema, 
  CATEGORY_REFINEMENT_SYSTEM_INSTRUCTION 
} from "@/lib/ai/prompts";

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

  // Re-enable sweep: auto-disabled sources that have recovered (at least
  // 1 success in their last 3 logs) get re-enabled automatically so they
  // don't require manual admin intervention for transient failures.
  try {
    const { data: disabledSources } = await supabase
      .from("sources")
      .select("id, name")
      .eq("enabled", false)
      .like("last_error", "auto-disabled%");

    if (disabledSources && disabledSources.length > 0) {
      for (const src of disabledSources as { id: string; name: string }[]) {
        const { data: recentLogs } = await supabase
          .from("ingestion_logs")
          .select("status")
          .eq("source_id", src.id)
          .order("created_at", { ascending: false })
          .limit(3);
        const hasRecent = (recentLogs ?? []).some(
          (l: { status: string }) =>
            l.status === "upserted" || l.status === "extracted" || l.status === "skipped_duplicate",
        );
        if (hasRecent) {
          await supabase
            .from("sources")
            .update({ enabled: true, last_error: "auto-re-enabled after recovery" })
            .eq("id", src.id);
          console.log(`[ingest] Auto re-enabled source: ${src.name}`);
        }
      }
    }
  } catch (e) {
    console.error("[ingest] Re-enable sweep failed:", e);
  }

  
  const sourcesConfig = [
    { name: "LinkedIn Jobs", promise: fetchLinkedIn({ keywords: "software engineer intern", location: "India", maxPages: 2 }) },
    { name: "Devpost", promise: fetchDevpost({ maxPages: 2 }) },
    { 
      name: "Greenhouse", 
      promise: fetchGreenhouse({ 
        boards: [
          { slug: "canonical", displayName: "Canonical" },
          { slug: "anthropic", displayName: "Anthropic" },
          { slug: "figma", displayName: "Figma" },
          { slug: "vercel", displayName: "Vercel" },
          { slug: "discord", displayName: "Discord" },
          { slug: "airbnb", displayName: "Airbnb" },
          { slug: "postman", displayName: "Postman" },
          { slug: "stripe", displayName: "Stripe" },
          { slug: "openai", displayName: "OpenAI" },
          { slug: "databricks", displayName: "Databricks" },
          { slug: "snowflake", displayName: "Snowflake" },
          { slug: "plaid", displayName: "Plaid" },
          { slug: "robinhood", displayName: "Robinhood" },
          { slug: "uber", displayName: "Uber" },
          { slug: "lyft", displayName: "Lyft" },
          { slug: "pinterest", displayName: "Pinterest" },
          { slug: "dropbox", displayName: "Dropbox" },
          { slug: "coinbase", displayName: "Coinbase" },
          { slug: "reddit", displayName: "Reddit" },
          { slug: "duolingo", displayName: "Duolingo" },
          { slug: "canva", displayName: "Canva" },
          { slug: "twitch", displayName: "Twitch" },
          { slug: "brex", displayName: "Brex" },
          { slug: "glossier", displayName: "Glossier" },
          { slug: "gusto", displayName: "Gusto" }
        ] 
      }) 
    },
    { 
      name: "Lever", 
      promise: fetchLever({ 
        companies: [
          { slug: "netflix", displayName: "Netflix" },
          { slug: "cred", displayName: "CRED" },
          { slug: "meesho", displayName: "Meesho" },
          { slug: "spotify", displayName: "Spotify" },
          { slug: "yelp", displayName: "Yelp" },
          { slug: "palantir", displayName: "Palantir" },
          { slug: "atlassian", displayName: "Atlassian" },
          { slug: "shopify", displayName: "Shopify" },
          { slug: "retool", displayName: "Retool" },
          { slug: "figma", displayName: "Figma" }
        ] 
      }) 
    },
    {
      name: "Ashby",
      promise: fetchAshbyConnector({
        includeCompensation: true,
        companies: [
          { slug: "ramp", displayName: "Ramp" },
          { slug: "linear", displayName: "Linear" },
          { slug: "vanta", displayName: "Vanta" },
          { slug: "deel", displayName: "Deel" },
          { slug: "notion", displayName: "Notion" },
          { slug: "loom", displayName: "Loom" },
          { slug: "zapier", displayName: "Zapier" },
          { slug: "vercel", displayName: "Vercel" }
        ]
      })
    },
    { name: "Internshala", promise: fetchInternshala({ maxPages: 2 }) },
    { name: "Hacker News: Who is hiring", promise: fetchHackerNews({ maxItems: 30 }) },
    { name: "RemoteOK", promise: fetchRemoteOK() },
    { name: "HN Jobs RSS", promise: fetchRss({ url: "https://hnrss.org/whoishiring", sourceName: "HN Jobs RSS", categoryHint: "fulltime" }) },
    { name: "Lenny's Newsletter", promise: fetchRss({ url: "https://www.lennysnewsletter.com/feed", sourceName: "Lenny's Newsletter" }) },
    { name: "WeWorkRemotely", promise: fetchRss({ url: "https://weworkremotely.com/remote-jobs.rss", sourceName: "WeWorkRemotely" }) },
    { name: "Unstop", promise: fetchRss({ url: "https://unstop.com/api/public/opportunities/rss", sourceName: "Unstop" }) },
    { name: "Unstop Competitions", promise: fetchRss({ url: "https://unstop.com/api/public/competitions/rss", sourceName: "Unstop Competitions" }) },
    { name: "Unstop Internships", promise: fetchRss({ url: "https://unstop.com/api/public/internships/rss", sourceName: "Unstop Internships", categoryHint: "internship" }) },
    { 
      name: "Top Fellowships", 
      promise: fetchStaticPages({
        pages: [
          { url: "https://www.teachforindia.org/fellowship", sourceName: "Teach For India", categoryHint: "fellowship" },
          { url: "https://thielfellowship.org/", sourceName: "Thiel Fellowship", categoryHint: "fellowship" },
          { url: "https://schmidtsciencefellows.org/", sourceName: "Schmidt Science Fellows", categoryHint: "fellowship" },
          { url: "https://www.schwarzmanscholars.org/", sourceName: "Schwarzman Scholars", categoryHint: "fellowship" },
          { url: "https://knight-hennessy.stanford.edu/", sourceName: "Knight-Hennessy Scholars", categoryHint: "fellowship" },
          { url: "https://www.mercatus.org/emergent-ventures", sourceName: "Emergent Ventures", categoryHint: "fellowship" }
        ]
      }) 
    },
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
        
        let finalCategory = opp.category;
        
        // AI Category Refinement Pass
        try {
          const refinementResult = await callLLM({
            prompt: buildCategoryRefinementPrompt(title, organization, opp.description || listing.rawText || "", finalCategory || "unknown"),
            schema: CategoryRefinementSchema,
            systemInstruction: CATEGORY_REFINEMENT_SYSTEM_INSTRUCTION
          });
          
          if (refinementResult.data.confidence >= 0.7) {
            finalCategory = refinementResult.data.category;
          }
          
          void logIngestion({
            status: "extracted",
            source_url,
            source_name: sourceName,
            source_id: sourceId,
            provider: refinementResult.provider,
            tokens_used: estimateTokens(refinementResult.raw),
            duration_ms: Date.now() - start,
          });
        } catch (e) {
          console.error(`[ingest] Category refinement failed for ${title}:`, e);
        }
        
        const row = {
          title,
          organization,
          category: finalCategory,
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
