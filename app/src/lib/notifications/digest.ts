import "server-only";
import { differenceInDays, parseISO } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Opportunity, Profile, Score } from "@/types/db";

export type DigestItem = {
  opportunity: Opportunity;
  score: number;
  why: string | null;
};

export type WeekRecap = {
  /** Total opportunities added in the last 7 days that match this user. */
  matchedThisWeek: number;
  /** Items the user saved this week. */
  savedThisWeek: number;
  /** Items in their kanban (saved/applied/interviewing) closing within 7 days. */
  closingThisWeek: number;
};

export type DigestPayload = {
  user: Profile;
  /** User's own saved + applied items closing within MY_DEADLINE_HOURS. */
  myDeadlines: DigestItem[];
  /** Top N feed items by personal score. */
  topPicks: DigestItem[];
  /** Feed items (not user's own) closing within CLOSING_SOON_DAYS. */
  closingSoon: DigestItem[];
  /** Sunday-only week recap. Null on other days. */
  weekRecap: WeekRecap | null;
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

  // Sunday-only week recap. Cron fires daily at 02:30 UTC = 08:00 IST,
  // so Sunday UTC == Sunday IST for our window. Only one extra computation
  // per week, only on the Sunday run.
  const weekRecap = await maybeBuildWeekRecap(user, items, userOppIds);

  if (
    topPicks.length === 0 &&
    closingSoon.length === 0 &&
    myDeadlines.length === 0 &&
    !weekRecap
  ) {
    return null;
  }

  return {
    user,
    myDeadlines,
    topPicks,
    closingSoon,
    weekRecap,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Compute the optional Sunday week-recap. Returns null on Mon-Sat or when
 * there's no meaningful activity to summarise.
 *
 * "Matched this week" = opportunities added in the last 7 days that scored
 * at least 60 for this user — a meaningful-match floor that avoids inflating
 * the headline with low-relevance items.
 */
async function maybeBuildWeekRecap(
  user: Profile,
  items: DigestItem[],
  userOppIds: Set<string>,
): Promise<WeekRecap | null> {
  const isSunday = new Date().getUTCDay() === 0;
  if (!isSunday) return null;

  const supabase = createAdminClient();
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Count of saved-this-week — small per-user query
  const { count: savedThisWeek } = await supabase
    .from("saved_opportunities")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("saved_at", sevenDaysAgo);

  // Items added in last 7 days AND scored ≥60 for this user
  const matchedThisWeek = items.filter((i) => {
    if (i.score < 60) return false;
    const added = i.opportunity.date_added;
    if (!added) return false;
    return new Date(added).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000;
  }).length;

  // Items in user's kanban closing within 7 days
  const closingThisWeek = items.filter((i) => {
    if (!userOppIds.has(i.opportunity.id)) return false;
    const d = i.opportunity.deadline;
    if (!d) return false;
    const days = differenceInDays(parseISO(d), new Date());
    return days >= 0 && days <= 7;
  }).length;

  // Skip the section entirely if nothing happened — better than a "0 / 0 / 0" recap
  if (
    matchedThisWeek === 0 &&
    (savedThisWeek ?? 0) === 0 &&
    closingThisWeek === 0
  ) {
    return null;
  }

  return {
    matchedThisWeek,
    savedThisWeek: savedThisWeek ?? 0,
    closingThisWeek,
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

/**
 * Apply a per-user minimum-score floor to a digest before it's rendered for
 * Telegram. Email keeps the full payload — different signal/noise economics.
 *
 * `myDeadlines` is NEVER filtered: the user explicitly saved/applied to those
 * items, so missing one to a score-floor would be a worse failure mode than
 * an occasionally-low-score reminder.
 *
 * Returns null when nothing survives — caller should skip Telegram in that case.
 */
export function filterDigestForTelegram(
  payload: DigestPayload,
  minScore: number,
): DigestPayload | null {
  const filtered: DigestPayload = {
    ...payload,
    topPicks: payload.topPicks.filter((i) => i.score >= minScore),
    closingSoon: payload.closingSoon.filter((i) => i.score >= minScore),
    // weekRecap and myDeadlines pass through unfiltered — different economics.
  };
  if (
    filtered.topPicks.length === 0 &&
    filtered.closingSoon.length === 0 &&
    filtered.myDeadlines.length === 0 &&
    !filtered.weekRecap
  ) {
    return null;
  }
  return filtered;
}
