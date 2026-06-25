import "server-only";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Opportunity, Profile, Score as DbScore } from "@/types/db";
import {
  computeScore,
  deriveBehavioralSignal,
  type BehavioralSignal,
  type Score,
} from "./score";

const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export type ScoreMap = Map<string, Score>;

/**
 * Ensure every opportunity in `opportunities` has a fresh score for `profile.id`.
 *
 * Strategy:
 *   1. Read all existing score rows for (user, opp) pairs in the input set.
 *   2. Filter to ones that are stale (> 6h) or missing.
 *   3. Compute scores for those locally (deterministic, no AI).
 *   4. Upsert results back into `scores` table — deferred via `after()` so
 *      the response can flush before the write completes. The user only
 *      cares that subsequent visits hit the cache; this visit already has
 *      the in-memory scores.
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
    const b = (row.breakdown ?? {}) as Score["breakdown"];
    const fitScore = (b.profileFit || 0) + (b.preferenceFit || 0) + (b.behavioralFit || 0);
    const valueScore = (b.careerUpside || 0) + (b.brandValue || 0) + (b.compensationMatch || 0);
    const actionabilityScore = (b.applicationEffort || 0) + (b.urgencyBoost || 0) + (b.sourceQuality || 0);
    
    result.set(row.opportunity_id, {
      score: row.score,
      breakdown: b,
      why: row.why ?? "",
      fitScore,
      valueScore,
      actionabilityScore,
    });
  }

  // 2) Compute scores for opportunities that don't have a fresh row
  const toCompute = opportunities.filter((o) => !fresh.has(o.id));
  if (toCompute.length === 0) return result;

  // Pull the user's behavioral signal once per refresh (not per opp). Reads
  // the last 50 saved opps' category/tags/organization — small payload, used
  // by `behavioralFitScore` to boost opps similar to past saves.
  const signal = await fetchBehavioralSignal(profile.id);

  // Fetch quality_score for the sources of opportunities we need to compute
  const sourceIds = Array.from(new Set(toCompute.map(o => o.source_id).filter(Boolean)));
  const sourceQualityMap: Record<string, number> = {};
  if (sourceIds.length > 0) {
    const { data: sources } = await supabase
      .from("sources")
      .select("id, quality_score")
      .in("id", sourceIds as string[]);
    for (const s of sources || []) {
      sourceQualityMap[s.id] = s.quality_score ?? 1.0;
    }
  }

  const newRows: Array<{
    user_id: string;
    opportunity_id: string;
    score: number;
    breakdown: Score["breakdown"];
    why: string;
    computed_at: string;
  }> = [];

  for (const opp of toCompute) {
    const quality = opp.source_id ? (sourceQualityMap[opp.source_id] ?? 1.0) : 1.0;
    const s = computeScore(profile, opp, signal, quality);
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

  // 3) Defer the write — runs after the response flushes so the user
  //    isn't waiting on the upsert round-trip.
  after(async () => {
    const { error } = await supabase
      .from("scores")
      .upsert(newRows, { onConflict: "user_id,opportunity_id" });
    if (error) console.error("[scoring] upsert failed:", error.message);
  });

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

/**
 * Fetch the user's last 50 saved opportunities' category/tags/organization
 * and derive a BehavioralSignal. Cold-start (< 3 saves) returns an empty
 * signal — `behavioralFitScore` treats that as neutral 0.5, so new users
 * aren't penalised.
 *
 * Returns the empty signal on any DB error so scoring never fails on this
 * single secondary read.
 *
 * Exported for direct use by `/opportunity/[id]` and any other server
 * component that calls `computeScore` outside of `refreshScores`.
 */
export async function fetchBehavioralSignal(userId: string): Promise<BehavioralSignal> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("saved_opportunities")
    .select("opportunities(category, tags, organization)")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    if (error) console.error("[scoring] behavioral fetch failed:", error.message);
    return deriveBehavioralSignal([]);
  }

  type Row = {
    opportunities: {
      category: string | null;
      tags: string[] | null;
      organization: string | null;
    } | null;
  };

  const samples = (data as unknown as Row[])
    .map((r) => r.opportunities)
    .filter((o): o is NonNullable<Row["opportunities"]> => o !== null)
    .map((o) => ({
      category: (o.category ?? "other") as Opportunity["category"],
      tags: o.tags ?? [],
      organization: o.organization ?? "",
    }));

  return deriveBehavioralSignal(samples);
}
