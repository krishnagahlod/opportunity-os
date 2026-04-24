import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CATEGORIES,
  ExtractedOpportunitySchema,
} from "@/lib/ai/prompts";
import { requireIngestAuth } from "@/lib/auth/ingest";

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
 * Called by n8n. Secured by INGEST_SHARED_SECRET header.
 */

const RequestSchema = z.object({
  opportunity: ExtractedOpportunitySchema,
  // Override / provide a canonical source URL for dedup. Falls back to the
  // opportunity's apply_url, else we hash-dedup.
  source_url: z.string().url().optional(),
  // Optional: the human-readable source name (e.g. "Unstop RSS"). We'll
  // match it to sources.name and attach source_id.
  source_name: z.string().max(100).optional(),
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

  // Compute the dedup key (unique in opportunities.source_url).
  const dedupUrl =
    source_url ??
    opp.apply_url ??
    hashUrl(opp.title, opp.organization);

  // Resolve source_id from source_name, if provided.
  let source_id: string | null = null;
  if (source_name) {
    const { data: src } = await supabase
      .from("sources")
      .select("id")
      .eq("name", source_name)
      .single();
    source_id = src?.id ?? null;

    // Update source health
    if (source_id) {
      await supabase
        .from("sources")
        .update({ last_run_at: new Date().toISOString(), last_status: "ok" })
        .eq("id", source_id);
    }
  }

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
    status: "active" as const,
  };

  const { data, error } = await supabase
    .from("opportunities")
    .upsert(row, { onConflict: "source_url" })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Upsert failed", detail: error.message },
      { status: 500 },
    );
  }

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
