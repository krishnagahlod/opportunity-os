import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchLinkedIn } from "@/lib/ingestion/connectors/linkedin";
import { fetchDevpost } from "@/lib/ingestion/connectors/devpost";
import { fetchGreenhouse } from "@/lib/ingestion/connectors/greenhouse";
import { fetchLever } from "@/lib/ingestion/connectors/lever";
import { type SourceListing } from "@/lib/ingestion/types";

export const runtime = "nodejs";
export const maxDuration = 60; // Max allowed for hobby plan

function hashUrl(title: string, organization: string): string {
  const key = `${title.toLowerCase().trim()}|${organization.toLowerCase().trim()}`;
  return `hash:${createHash("sha1").update(key).digest("hex").slice(0, 16)}`;
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
  
  // 1. Fetch from all sources
  const results = await Promise.allSettled([
    fetchLinkedIn({ keywords: "software engineer intern", location: "India", maxPages: 2 }),
    fetchDevpost({ maxPages: 2 }),
    fetchGreenhouse({ boards: [{ slug: "canonical", displayName: "Canonical" }] }), // Example
    fetchLever({ companies: [{ slug: "netflix", displayName: "Netflix" }] }), // Example
  ]);

  let totalUpserted = 0;
  let totalErrors = 0;

  // 2. Process and upsert
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Fetcher failed:", result.reason);
      totalErrors++;
      continue;
    }
    
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
        status: "active" as const,
        tags: [],
        required_skills: [],
      };

      const { error } = await supabase
        .from("opportunities")
        .upsert(row, { onConflict: "source_url", ignoreDuplicates: true });
        
      if (error) {
        console.error("Failed to upsert:", error);
        totalErrors++;
      } else {
        totalUpserted++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    upserted: totalUpserted,
    errors: totalErrors,
    durationMs: Date.now() - start
  });
}
