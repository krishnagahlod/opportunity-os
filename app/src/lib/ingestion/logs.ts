import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type IngestionLogStatus =
  | "extracted"
  | "upserted"
  | "skipped_duplicate"
  | "skipped_filtered"
  | "failed";

export type IngestionLogInput = {
  status: IngestionLogStatus;
  source_url?: string | null;
  source_name?: string | null;
  source_id?: string | null;
  reason?: string | null;
  provider?: "gemini" | "groq" | null;
  tokens_used?: number | null;
  duration_ms?: number | null;
  opportunity_id?: string | null;
};

/**
 * Insert a single ingestion log row. Never throws — logging is best-effort and
 * must not poison the request that's being logged.
 */
export async function logIngestion(input: IngestionLogInput): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("ingestion_logs").insert({
      status: input.status,
      source_url: input.source_url ?? null,
      source_name: input.source_name ?? null,
      source_id: input.source_id ?? null,
      reason: input.reason ?? null,
      provider: input.provider ?? null,
      tokens_used: input.tokens_used ?? null,
      duration_ms: input.duration_ms ?? null,
      opportunity_id: input.opportunity_id ?? null,
    });
  } catch (e) {
    console.error("[ingestion/logs] insert failed:", e);
  }
}

/** Heuristic token estimate from raw response length. ~4 chars per token. */
export function estimateTokens(rawText: string): number {
  return Math.ceil(rawText.length / 4);
}
