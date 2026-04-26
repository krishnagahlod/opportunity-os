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
  /** User's own saved + applied items closing within MY_DEADLINE_HOURS. */
  myDeadlines: DigestItem[];
  /** Top N feed items by personal score. */
  topPicks: DigestItem[];
  /** Feed items (not user's own) closing within CLOSING_SOON_DAYS. */
  closingSoon: DigestItem[];
  generatedAt: string;
};

const TOP_PICKS_LIMIT = 5;
const CLOSING_SOON_DAYS = 3;
const MY_DEADLINE_HOURS = 48;

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

  // Fetch active opportunities, the user's cached scores, and their saved +
  // applied opportunity ids in parallel.
  const [
    { data: opps },
    { data: scores },
    { data: saved },
    { data: applied },
  ] = await Promise.all([
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
    supabase
      .from("saved_opportunities")
      .select("opportunity_id")
      .eq("user_id", user.id),
    supabase
      .from("applications")
      .select("opportunity_id")
      .eq("user_id", user.id)
      .in("status", ["saved", "applied", "interviewing"]),
  ]);

  if (!opps || opps.length === 0) return null;

  // Set of opportunity ids the user has personal interest in
  const userOppIds = new Set<string>([
    ...((saved ?? []) as { opportunity_id: string }[]).map((s) => s.opportunity_id),
    ...((applied ?? []) as { opportunity_id: string }[]).map((a) => a.opportunity_id),
  ]);

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

  // Personal deadline reminders: user's saved+applied items within 48h.
  // Highest priority section in the digest because they've already shown
  // intent — missing one of these is the worst-case experience.
  const myDeadlines = items
    .filter((i) => userOppIds.has(i.opportunity.id))
    .filter((i) => {
      const d = i.opportunity.deadline;
      if (!d) return false;
      const hoursUntil =
        (parseISO(d).getTime() - Date.now()) / (1000 * 60 * 60);
      return hoursUntil >= 0 && hoursUntil <= MY_DEADLINE_HOURS;
    })
    .sort((a, b) => {
      const da = parseISO(a.opportunity.deadline!).getTime();
      const db = parseISO(b.opportunity.deadline!).getTime();
      return da - db;
    });
  const myDeadlineIds = new Set(myDeadlines.map((m) => m.opportunity.id));

  // Always show top N — score is the rank, no quality floor. Filtering would
  // hide all picks on cold-start days when the score cache is sparse.
  const topPicks = [...items]
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_PICKS_LIMIT);

  // Feed-wide closing-soon, but skip anything already surfaced in
  // myDeadlines so the same opportunity doesn't appear twice.
  const closingSoon = items
    .filter((i) => !myDeadlineIds.has(i.opportunity.id))
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

  if (
    topPicks.length === 0 &&
    closingSoon.length === 0 &&
    myDeadlines.length === 0
  ) {
    return null;
  }

  return {
    user,
    myDeadlines,
    topPicks,
    closingSoon,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Mark every active opportunity whose deadline has passed as expired.
 * Run before the digest fan-out so dead links don't appear in today's
 * emails. Rolling-deadline rows (deadline IS NULL) stay active.
 */
export async function markExpiredOpportunities(): Promise<{ count: number }> {
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("opportunities")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("deadline", nowIso)
    .select("id");
  if (error) {
    console.error("[markExpiredOpportunities] failed:", error.message);
    return { count: 0 };
  }
  return { count: data?.length ?? 0 };
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
