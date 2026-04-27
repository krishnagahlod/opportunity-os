import { differenceInDays, parseISO } from "date-fns";
import type { Opportunity, Profile } from "@/types/db";
import { getOrgTier } from "./orgs";

/**
 * Deterministic scoring engine.
 *
 * Score formula (all components are 0..1, weighted, summed, then multiplied
 * by extraction_confidence to penalize low-quality extractions):
 *
 *   raw = 0.35 * profile_relevance
 *       + 0.20 * career_value
 *       + 0.15 * brand_value
 *       + 0.10 * compensation
 *       + 0.10 * ease_of_application
 *       + 0.10 * urgency
 *
 *   score = round(raw * confidence * 100)   // 0..100 integer
 *
 * No AI calls — pure functions. Why text is generated from the breakdown using
 * deterministic templates. This makes scoring fast, free, and easy to debug.
 */

export type ScoreBreakdown = {
  profile_relevance: number;   // 0..100
  career_value: number;        // 0..100
  brand_value: number;         // 0..100
  compensation: number;        // 0..100
  ease: number;                // 0..100
  urgency: number;             // 0..100
  confidence: number;          // 0..100, the multiplier
};

export type Score = {
  score: number;               // 0..100 integer
  breakdown: ScoreBreakdown;
  why: string;                 // 1-2 sentence human-readable explanation
};

export function computeScore(profile: Profile, opp: Opportunity): Score {
  const profile_relevance = relevanceScore(profile, opp);
  const career_value = getOrgTier(opp.organization);
  const brand_value = career_value; // same lookup, separate weight
  const compensation = compensationScore(opp.compensation);
  const ease = easeScore(opp.apply_url);
  const urgency = urgencyScore(opp.deadline);
  const confidence = opp.extraction_confidence ?? 0.7;

  const raw =
    0.35 * profile_relevance +
    0.2 * career_value +
    0.15 * brand_value +
    0.1 * compensation +
    0.1 * ease +
    0.1 * urgency;

  const score = Math.max(0, Math.min(100, Math.round(raw * confidence * 100)));

  const breakdown: ScoreBreakdown = {
    profile_relevance: pct(profile_relevance),
    career_value: pct(career_value),
    brand_value: pct(brand_value),
    compensation: pct(compensation),
    ease: pct(ease),
    urgency: pct(urgency),
    confidence: pct(confidence),
  };

  return {
    score,
    breakdown,
    why: generateWhy(profile, opp, breakdown),
  };
}

/* ============ Component scorers (each 0..1) ============ */

/**
 * Profile relevance = overlap between user's interests/skills and the
 * opportunity's tags + title + summary, normalized.
 *
 * Simple but effective: tokenize both sides, count distinct term hits,
 * cap at 5 hits = 1.0.
 */
function relevanceScore(profile: Profile, opp: Opportunity): number {
  // Resume-extracted skills feed in alongside user-confirmed interests + skills.
  // Capped-at-5-hits below means they widen the keyword net but don't dominate
  // the score even on a resume with many extracted terms.
  const userTerms = new Set(
    [
      ...(profile.interests ?? []),
      ...(profile.skills ?? []),
      ...(profile.resume_skills ?? []),
    ].map(normalize),
  );
  if (userTerms.size === 0) return 0.5;

  const oppText = [
    opp.title,
    opp.summary ?? "",
    opp.description ?? "",
    ...(opp.tags ?? []),
    opp.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let hits = 0;
  for (const term of userTerms) {
    if (oppText.includes(term)) hits++;
  }
  return Math.min(1, hits / 5);
}

/**
 * Compensation: presence + size hint.
 *   has a number ≥ 50000 (INR/month-ish) or ≥ 50000 USD-ish → 1.0
 *   has any number > 0   → 0.7
 *   has text but no number (e.g. "competitive") → 0.4
 *   null / "unpaid" → 0
 */
function compensationScore(compensation: string | null): number {
  if (!compensation) return 0;
  const lower = compensation.toLowerCase();
  if (lower.includes("unpaid") || lower.includes("no pay")) return 0;
  if (lower.includes("free")) return 0;

  const numbers = compensation.match(/[\d,]+/g)?.map((s) => Number(s.replace(/,/g, ""))) ?? [];
  const max = numbers.length > 0 ? Math.max(...numbers) : 0;
  if (max >= 50000) return 1;
  if (max > 0) return 0.7;
  return 0.4;
}

/**
 * Ease of application: are we one click away?
 *   has apply_url → 1.0
 *   no apply_url  → 0.4
 */
function easeScore(applyUrl: string | null): number {
  return applyUrl ? 1 : 0.4;
}

/**
 * Urgency: closer deadline = higher.
 *   past / null → 0
 *   ≤ 7 days   → 1.0
 *   ≤ 30 days  → 0.7
 *   ≤ 90 days  → 0.4
 *   > 90 days  → 0.2
 */
function urgencyScore(deadline: string | null): number {
  if (!deadline) return 0.3; // rolling deadlines get a small baseline
  const date = parseISO(deadline);
  const days = differenceInDays(date, new Date());
  if (days < 0) return 0;
  if (days <= 7) return 1;
  if (days <= 30) return 0.7;
  if (days <= 90) return 0.4;
  return 0.2;
}

/* ============ Why-text templates ============ */

/**
 * Pick the strongest 1-2 factors from the breakdown and turn them into a short
 * second-person sentence. Keeps the dashboard explanation specific without
 * needing an AI call per opportunity.
 */
function generateWhy(
  profile: Profile,
  opp: Opportunity,
  b: ScoreBreakdown,
): string {
  const reasons: string[] = [];

  // Profile relevance — try to name the matched interest
  if (b.profile_relevance >= 60) {
    const matched = matchedInterest(profile, opp);
    if (matched) {
      reasons.push(`Matches your interest in ${matched}`);
    } else {
      reasons.push("Strong match with your profile");
    }
  } else if (b.profile_relevance >= 30) {
    reasons.push("Some overlap with your profile");
  }

  // Career value (org tier)
  if (b.career_value >= 85) {
    reasons.push(`top-tier brand (${opp.organization})`);
  } else if (b.career_value >= 70) {
    reasons.push(`well-known org (${opp.organization})`);
  }

  // Urgency
  if (b.urgency >= 100) {
    reasons.push("closing this week");
  } else if (b.urgency >= 70) {
    reasons.push("closing in <30 days");
  }

  // Compensation
  if (b.compensation >= 100) {
    reasons.push("solid compensation");
  }

  if (reasons.length === 0) {
    return "Surfaced because it's active and recently added.";
  }

  // Capitalize first letter of first reason; lowercase the rest
  const first = reasons[0][0].toUpperCase() + reasons[0].slice(1);
  const rest = reasons.slice(1, 3).map((r) => r[0].toLowerCase() + r.slice(1));
  return [first, ...rest].join(" · ") + ".";
}

function matchedInterest(profile: Profile, opp: Opportunity): string | null {
  return findMatchedTerms(profile, opp)[0] ?? null;
}

/**
 * Return up to 3 user terms that appear in the opportunity's text, in
 * priority order: confirmed skills first (strongest signal), then interests,
 * then AI-extracted resume_skills last. Preserves original casing for display
 * so the UI can show "React" not "react".
 *
 * Used by:
 *   - matchedInterest() above (one-term version, drives generateWhy())
 *   - the dashboard match-pill UI (which shows the full set)
 *
 * Same haystack the relevance score uses, so the displayed terms are
 * exactly the ones contributing to the score.
 */
export function findMatchedTerms(
  profile: Profile,
  opp: Opportunity,
): string[] {
  const oppText = [
    opp.title,
    opp.summary ?? "",
    opp.description ?? "",
    ...(opp.tags ?? []),
    opp.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const matches: string[] = [];
  const seen = new Set<string>();

  const consider = (terms: readonly string[]) => {
    for (const term of terms) {
      if (matches.length >= 3) return;
      const norm = normalize(term);
      if (!norm || seen.has(norm)) continue;
      if (oppText.includes(norm)) {
        matches.push(term);
        seen.add(norm);
      }
    }
  };

  consider(profile.skills ?? []);
  consider(profile.interests ?? []);
  consider(profile.resume_skills ?? []);

  return matches;
}

/* ============ Helpers ============ */

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function pct(v: number): number {
  return Math.round(v * 100);
}
