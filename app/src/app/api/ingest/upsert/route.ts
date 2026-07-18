import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CATEGORIES,
  ExtractedOpportunitySchema,
} from "@/lib/ai/prompts";
import { checkDuplicate } from "@/lib/ai/dedup";
import { requireIngestAuth } from "@/lib/auth/ingest";
import { logIngestion } from "@/lib/ingestion/logs";

export const runtime = "nodejs";
export const maxDuration = 20;

/*
 * Upserts a structured opportunity into the `opportunities` table.
 *
 * Dedup strategy:
 * 1. If source_url is provided and already exists → update that row.
 * 2. Otherwise, compute a hash of normalized (title + organization) and store
 *    it as `source_url = "hash:<sha1>"` so we still get a unique key.
 *
 * Source resolution:
 * - If source_name is provided, look up the source row.
 * - If not found, create one (kind='rss' by default — adjust if we add scrapers).
 * - Update last_run_at + last_status='ok' on every successful upsert.
 *
 * Called by n8n. Secured by INGEST_SHARED_SECRET header.
 */

const RequestSchema = z.object({
  opportunity: ExtractedOpportunitySchema,
  // Accept null OR missing — treat both as "fall back to apply_url or hash".
  source_url: z.string().url().nullable().optional(),
  source_name: z.string().max(100).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const unauthorized = requireIngestAuth(req);
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bad request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { opportunity: opp, source_url, source_name } = parsed.data;
  const supabase = createAdminClient();
  const start = Date.now();

  // Fallback chain for organization: AI may return null (e.g. for community
  // forum posts that aren't tied to a specific employer). Derive a reasonable
  // value rather than failing the upsert against a NOT-NULL column.
  const cleanOrg = (opp.organization ?? "").trim();
  const organization =
    cleanOrg.length > 0
      ? cleanOrg
      : deriveOrgFallback(source_url ?? opp.apply_url, source_name);

  const dedupUrl =
    source_url ?? opp.apply_url ?? hashUrl(opp.title, organization);

  const source_id = source_name
    ? await resolveOrCreateSource(supabase, source_name)
    : null;

  // Cross-source dedup: before inserting, look for an opportunity with the
  // same (normalized title + organization) on a DIFFERENT source_url, added
  // in the last 14 days. If we find one, ask the AI whether they're the
  // same role. Skip the insert if AI confirms.
  //
  // Bypass when source_url already matches an existing row (caller will hit
  // the standard upsert-on-conflict path) — the same-URL case is exact dedup,
  // not the cross-source we're guarding against here.
  const titleNorm = opp.title.toLowerCase().trim();
  const orgNorm = organization.toLowerCase().trim();
  const fourteenDaysAgo = new Date(
    Date.now() - 14 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: fuzzyMatches } = await supabase
    .from("opportunities")
    .select("id, title, organization, category, location, summary, source_url")
    .ilike("title", titleNorm)
    .ilike("organization", orgNorm)
    .neq("source_url", dedupUrl)
    .gte("date_added", fourteenDaysAgo)
    .eq("status", "active")
    .limit(1);

  if (fuzzyMatches && fuzzyMatches.length > 0) {
    const candidate = fuzzyMatches[0] as {
      id: string;
      title: string;
      organization: string;
      category: string;
      location: string | null;
      summary: string | null;
    };
    try {
      const verdict = await checkDuplicate(
        {
          title: opp.title,
          organization,
          category: opp.category,
          location: opp.location,
          summary: opp.summary,
        },
        {
          title: candidate.title,
          organization: candidate.organization,
          category: candidate.category,
          location: candidate.location,
          summary: candidate.summary,
        },
      );

      if (verdict.same && verdict.confidence >= 0.7) {
        // AI confirms duplicate — log and bail with success-but-skipped so
        // the workflow doesn't error.
        void logIngestion({
          status: "skipped_duplicate",
          source_url: dedupUrl,
          source_name: source_name ?? null,
          source_id,
          opportunity_id: candidate.id,
          reason: `cross-source dedup: matches ${candidate.id} (confidence ${verdict.confidence.toFixed(2)})`,
          duration_ms: Date.now() - start,
        });
        return NextResponse.json({
          id: candidate.id,
          source_url: dedupUrl,
          ok: true,
          skipped: "cross-source duplicate",
          matchedId: candidate.id,
        });
      }
    } catch (e) {
      // AI failure shouldn't block ingestion — better to occasionally
      // double-insert than silently lose a legitimate opportunity.
      console.warn(
        "[upsert] cross-source dedup AI failed; falling through:",
        e instanceof Error ? e.message : String(e),
      );
    }
  }

  // Normalize extracted required-skills: lowercase, trim, drop short tokens,
  // dedupe. Cap at 8 (matches the schema's max). Belt-and-suspenders against
  // bad AI output that slipped past Zod (e.g. duplicate casings).
  const normalizedRequired = Array.from(
    new Set(
      (opp.required_skills ?? [])
        .map((s) => s.toLowerCase().trim())
        .filter((s) => s.length >= 2 && s.length <= 40),
    ),
  ).slice(0, 8);

  const row = {
    title: opp.title,
    organization,
    category: opp.category as (typeof CATEGORIES)[number],
    description: opp.description,
    summary: opp.summary,
    tags: opp.tags,
    required_skills: normalizedRequired,
    deadline: opp.deadline,
    eligibility: opp.eligibility,
    location: opp.location,
    compensation: opp.compensation,
    is_remote: opp.is_remote,
    apply_url: opp.apply_url,
    source_url: dedupUrl,
    source_id,
    difficulty: opp.difficulty,
    estimated_value_score: opp.estimated_value_score,
    extraction_confidence: opp.extraction_confidence,
    status: "active" as const,
    date_added: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("opportunities")
    .upsert(row, { onConflict: "source_url" })
    .select("id")
    .single();

  if (error) {
    void logIngestion({
      status: "failed",
      source_url: dedupUrl,
      source_name: source_name ?? null,
      source_id,
      reason: `upsert: ${error.message}`,
      duration_ms: Date.now() - start,
    });
    if (source_id) {
      await supabase
        .from("sources")
        .update({
          last_run_at: new Date().toISOString(),
          last_status: "error",
          last_error: error.message,
        })
        .eq("id", source_id);
    }
    return NextResponse.json(
      { error: "Upsert failed", detail: error.message },
      { status: 500 },
    );
  }

  if (source_id) {
    await supabase
      .from("sources")
      .update({
        last_run_at: new Date().toISOString(),
        last_status: "ok",
        last_error: null,
      })
      .eq("id", source_id);
  }

  void logIngestion({
    status: "upserted",
    source_url: dedupUrl,
    source_name: source_name ?? null,
    source_id,
    opportunity_id: data.id,
    duration_ms: Date.now() - start,
  });

  return NextResponse.json({
    id: data.id,
    source_url: dedupUrl,
    ok: true,
  });
}

function hashUrl(title: string, organization: string): string {
  const key = `${title.toLowerCase().trim()}|${organization.toLowerCase().trim()}`;
  return `hash:${createHash("sha1").update(key).digest("hex").slice(0, 16)}`;
}

/**
 * Best-effort organization name when AI couldn't infer one.
 * Tries (in order): URL hostname (capitalized), source_name, "Unknown".
 */
function deriveOrgFallback(
  url: string | null | undefined,
  sourceName: string | null | undefined,
): string {
  if (url) {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      const root = host.split(".")[0];
      if (root) return root.charAt(0).toUpperCase() + root.slice(1);
    } catch {
      // not a real URL (could be a hash:xxx string) — fall through
    }
  }
  if (sourceName && sourceName.trim()) return sourceName.trim();
  return "Unknown";
}

/**
 * Look up source by case-insensitive trimmed name; create one if missing.
 * Default kind='rss' (most common). Returns the source.id (uuid) or null on failure.
 */
async function resolveOrCreateSource(
  supabase: ReturnType<typeof createAdminClient>,
  rawName: string,
): Promise<string | null> {
  const name = rawName.trim();
  if (!name) return null;

  // Case-insensitive match
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
    console.error("[upsert] failed to create source:", name, error.message);
    return null;
  }
  return created.id;
}
