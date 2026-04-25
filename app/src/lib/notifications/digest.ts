import "server-only";
import { differenceInDays, parseISO } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Opportunity, Profile, Score } from "@/types/db";

export type DigestItem = {
  opportunity: Opportunity;
  score: number;
  why: string | null;
};

export type DigestPayload = {
  user: Profile;
  topPicks: DigestItem[];      // top N by score, all with score >= MIN_SCORE
  closingSoon: DigestItem[];   // ≤3 days deadline, sorted soonest-first
  generatedAt: string;
};

const TOP_PICKS_LIMIT = 5;
const CLOSING_SOON_DAYS = 3;

/**
 * Build a digest payload for a single user. Reads current cached scores
 * (no recomputation here — the dashboard refresh handles that).
 *
 * Returns null when there's nothing worth notifying about (no fresh
 * top picks AND no closing-soon items).
 */
export async function buildDigestForUser(
  user: Profile,
): Promise<DigestPayload | null> {
  const supabase = createAdminClient();

  // Fetch all active opportunities + the user's cached scores in two queries.
  const [{ data: opps }, { data: scores }] = await Promise.all([
    supabase
      .from("opportunities")
      .select("*")
      .eq("status", "active")
      .order("date_added", { ascending: false })
      .limit(150),
    supabase
      .from("scores")
      .select("opportunity_id, score, why")
      .eq("user_id", user.id),
  ]);

  if (!opps || opps.length === 0) return null;

  const scoreMap = new Map<string, { score: number; why: string | null }>();
  for (const s of (scores ?? []) as Pick<
    Score,
    "opportunity_id" | "score" | "why"
  >[]) {
    scoreMap.set(s.opportunity_id, { score: s.score, why: s.why });
  }

  const items: DigestItem[] = (opps as Opportunity[]).map((o) => {
    const s = scoreMap.get(o.id);
    return {
      opportunity: o,
      score: s?.score ?? 0,
      why: s?.why ?? null,
    };
  });

  // Always show top N — score is the rank, no quality floor. Filtering would
  // hide all picks on cold-start days when the score cache is sparse.
  const topPicks = [...items]
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_PICKS_LIMIT);

  const closingSoon = items
    .filter((i) => {
      const d = i.opportunity.deadline;
      if (!d) return false;
      const days = differenceInDays(parseISO(d), new Date());
      return days >= 0 && days <= CLOSING_SOON_DAYS;
    })
    .sort((a, b) => {
      const da = parseISO(a.opportunity.deadline!).getTime();
      const db = parseISO(b.opportunity.deadline!).getTime();
      return da - db;
    });

  if (topPicks.length === 0 && closingSoon.length === 0) return null;

  return {
    user,
    topPicks,
    closingSoon,
    generatedAt: new Date().toISOString(),
  };
}

/** Returns all users with onboarded=true, suitable for digest delivery. */
export async function getDigestRecipients(): Promise<Profile[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("onboarded", true);
  return (data as Profile[] | null) ?? [];
}
