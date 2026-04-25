import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Opportunity, Profile, Score as DbScore } from "@/types/db";
import { computeScore, type Score } from "./score";

const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export type ScoreMap = Map<string, Score>;

/**
 * Ensure every opportunity in `opportunities` has a fresh score for `profile.id`.
 *
 * Strategy:
 *   1. Read all existing score rows for (user, opp) pairs in the input set.
 *   2. Filter to ones that are stale (> 6h) or missing.
 *   3. Compute scores for those locally (deterministic, no AI).
 *   4. Upsert results back into `scores` table.
 *   5. Return a Map<opportunity_id, Score> covering ALL inputs.
 *
 * Uses the service-role admin client so we can write scores even from a
 * server component (where the user-scoped client may not have a session yet).
 */
export async function refreshScores(
  profile: Profile,
  opportunities: Opportunity[],
): Promise<ScoreMap> {
  const result: ScoreMap = new Map();
  if (opportunities.length === 0) return result;

  const supabase = createAdminClient();
  const oppIds = opportunities.map((o) => o.id);
  const cutoff = new Date(Date.now() - TTL_MS).toISOString();

  // 1) Read existing fresh scores in one query
  const { data: existing } = await supabase
    .from("scores")
    .select("opportunity_id, score, breakdown, why, computed_at")
    .eq("user_id", profile.id)
    .in("opportunity_id", oppIds)
    .gte("computed_at", cutoff);

  const fresh = new Map<string, DbScore>();
  for (const row of (existing ?? []) as DbScore[]) {
    fresh.set(row.opportunity_id, row);
    result.set(row.opportunity_id, {
      score: row.score,
      breakdown: (row.breakdown ?? {}) as Score["breakdown"],
      why: row.why ?? "",
    });
  }

  // 2) Compute scores for opportunities that don't have a fresh row
  const toCompute = opportunities.filter((o) => !fresh.has(o.id));
  if (toCompute.length === 0) return result;

  const newRows: Array<{
    user_id: string;
    opportunity_id: string;
    score: number;
    breakdown: Score["breakdown"];
    why: string;
    computed_at: string;
  }> = [];

  for (const opp of toCompute) {
    const s = computeScore(profile, opp);
    result.set(opp.id, s);
    newRows.push({
      user_id: profile.id,
      opportunity_id: opp.id,
      score: s.score,
      breakdown: s.breakdown,
      why: s.why,
      computed_at: new Date().toISOString(),
    });
  }

  // 3) Upsert all new rows in a single round-trip
  const { error } = await supabase
    .from("scores")
    .upsert(newRows, { onConflict: "user_id,opportunity_id" });

  if (error) {
    console.error("[scoring] upsert failed:", error.message);
    // Non-fatal — we still return the in-memory scores so the UI works
  }

  return result;
}

/**
 * Wipe all cached scores for a user. Call after profile changes that affect
 * relevance (interests, skills) so the next dashboard load recomputes from
 * scratch.
 */
export async function invalidateUserScores(userId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("scores").delete().eq("user_id", userId);
  if (error) {
    console.error("[scoring] invalidate failed:", error.message);
  }
}
