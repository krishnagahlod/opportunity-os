import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CATEGORIES,
  ExtractedOpportunitySchema,
} from "@/lib/ai/prompts";
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

  const dedupUrl =
    source_url ?? opp.apply_url ?? hashUrl(opp.title, opp.organization);

  const source_id = source_name
    ? await resolveOrCreateSource(supabase, source_name)
    : null;

  const row = {
    title: opp.title,
    organization: opp.organization,
    category: opp.category as (typeof CATEGORIES)[number],
    description: opp.description,
    summary: opp.summary,
    tags: opp.tags,
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
