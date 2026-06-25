import { differenceInDays, differenceInHours, parseISO } from "date-fns";
import type { Opportunity, Profile } from "@/types/db";
import { getCareerValueTier, getOrgTier } from "./orgs";

/**
 * Deterministic personalization engine.
 *
 * Score formula (each component 0..1, weighted, summed, then multiplied by
 * extraction_confidence at the end):
 *
 *   raw = 0.30 * profile_relevance      (skills/interests + synonyms hit opp text)
 *       + 0.10 * preference_fit         (location + remote + commitment)
 *       + 0.20 * career_value           (org tier or category baseline)
 *       + 0.05 * brand_value            (pure org tier, only counts when known)
 *       + 0.08 * compensation
 *       + 0.05 * ease_of_application
 *       + 0.10 * urgency                (deadline proximity)
 *       + 0.05 * recency                (added in last few days)
 *       + 0.07 * behavioral_fit         (matches what the user has been saving)
 *
 *   score = round(raw * confidence * 100)   // 0..100 integer
 *
 * Rebalanced from the original (35/20/15/10/10/10) in Phase 11:
 *   - profile_relevance reduced 0.35 → 0.30 to make room for new signals
 *   - brand_value cut 0.15 → 0.05 (was redundant with career_value)
 *   - ease cut 0.10 → 0.05 (binary signal didn't deserve 10%)
 *   - new: preference_fit 0.10, behavioral_fit 0.07, recency 0.05
 *
 * No AI calls — pure functions. Why-text is generated from breakdown +
 * matched terms using deterministic templates.
 */

export type ScoreBreakdown = {
  profile_relevance: number;   // 0..100
  preference_fit: number;      // 0..100  (NEW in Phase 11)
  career_value: number;        // 0..100
  brand_value: number;         // 0..100
  compensation: number;        // 0..100
  ease: number;                // 0..100
  urgency: number;             // 0..100
  recency: number;             // 0..100  (NEW in Phase 11)
  behavioral_fit: number;      // 0..100  (NEW in Phase 11)
  confidence: number;          // 0..100, the multiplier
};

export type Score = {
  score: number;               // 0..100 integer
  fitScore?: number;           // 0..100 integer (Profile + Preference + Behavioral)
  valueScore?: number;         // 0..100 integer (Career + Brand + Comp)
  actionabilityScore?: number; // 0..100 integer (Ease + Urgency + Recency)
  breakdown: ScoreBreakdown;
  why: string;                 // 1-2 sentence human-readable explanation
};

/**
 * BehavioralSignal captures patterns from the user's last N saved
 * opportunities (no schema needed — derived inline from saved_opportunities).
 * Cold-start (< 3 samples) returns neutral 0.5 from `behavioralFitScore` so
 * new users aren't penalised.
 */
export type BehavioralSignal = {
  /** Categories the user has saved at least twice (signal of repeated intent). */
  topCategories: Set<string>;
  /** Tags appearing ≥2 times across their saved opps. */
  topTags: Set<string>;
  /** Orgs they've saved ≥2 of — rare unless following a specific company. */
  topOrgs: Set<string>;
  /** Total samples used to derive the signal. < 3 = cold start. */
  totalSamples: number;
};

const EMPTY_SIGNAL: BehavioralSignal = {
  topCategories: new Set(),
  topTags: new Set(),
  topOrgs: new Set(),
  totalSamples: 0,
};

export function computeScore(
  profile: Profile,
  opp: Opportunity,
  signal: BehavioralSignal = EMPTY_SIGNAL,
  sourceQuality: number = 1.0,
): Score {
  const profile_relevance = relevanceScore(profile, opp);
  const preference_fit = preferenceFitScore(profile, opp);
  const base_career = getCareerValueTier(opp.organization, opp.category);
  const career_value = opp.upside_score !== null && opp.upside_score !== undefined ? opp.upside_score / 100 : base_career;
  const brand_value = getOrgTier(opp.organization);
  const compensation = compensationScore(opp.compensation);
  const base_ease = easeScore(opp.apply_url);
  const ease = opp.effort_score !== null && opp.effort_score !== undefined ? (100 - opp.effort_score) / 100 : base_ease;
  const urgency = urgencyScore(opp.deadline);
  const recency = recencyScore(opp.date_added);
  const behavioral_fit = behavioralFitScore(opp, signal);
  const confidence = opp.extraction_confidence ?? 0.7;
  const legitimacy = opp.legitimacy_score !== null && opp.legitimacy_score !== undefined ? opp.legitimacy_score / 100 : 1.0;

  const raw =
    0.30 * profile_relevance +
    0.10 * preference_fit +
    0.20 * career_value +
    0.05 * brand_value +
    0.08 * compensation +
    0.05 * ease +
    0.10 * urgency +
    0.05 * recency +
    0.07 * behavioral_fit;

  const score = Math.max(0, Math.min(100, Math.round(raw * confidence * legitimacy * sourceQuality * 100)));

  // Outcome-aware sub-scores (0..100) based on their relative weights within their groups
  const fitScoreRaw = (0.30 * profile_relevance + 0.10 * preference_fit + 0.07 * behavioral_fit) / 0.47;
  const fitScore = Math.max(0, Math.min(100, Math.round(fitScoreRaw * 100)));

  const valueScoreRaw = (0.20 * career_value + 0.05 * brand_value + 0.08 * compensation) / 0.33;
  const valueScore = Math.max(0, Math.min(100, Math.round(valueScoreRaw * 100)));

  const actionabilityScoreRaw = (0.05 * ease + 0.10 * urgency + 0.05 * recency) / 0.20;
  const actionabilityScore = Math.max(0, Math.min(100, Math.round(actionabilityScoreRaw * 100)));

  const breakdown: ScoreBreakdown = {
    profile_relevance: pct(profile_relevance),
    preference_fit: pct(preference_fit),
    career_value: pct(career_value),
    brand_value: pct(brand_value),
    compensation: pct(compensation),
    ease: pct(ease),
    urgency: pct(urgency),
    recency: pct(recency),
    behavioral_fit: pct(behavioral_fit),
    confidence: pct(confidence),
    source_quality: pct(sourceQuality), // Added to trace feedback loops
  } as any; // Cast as any because types/db.ts may not have all fields yet

  return {
    score,
    fitScore,
    valueScore,
    actionabilityScore,
    breakdown,
    why: generateWhy(profile, opp, breakdown, signal, sourceQuality),
  };
}

/* ============================================================================
 * Behavioral signal derivation
 * ========================================================================== */

/**
 * Compute a per-user behavioral signal from a sample of saved opportunities.
 * Pass the result to `computeScore` to enable behavior-driven boosts.
 *
 * The caller queries the user's saved opportunities (limit ~50, ordered by
 * saved_at desc) joined with category/tags/organization, and passes that
 * shape in. No schema change required.
 *
 * Threshold: a category/tag/org becomes "top" at ≥2 occurrences. Using a
 * small threshold means even users with 5-10 saves get useful signal,
 * without single-save accidents dominating the ranking.
 */
export function deriveBehavioralSignal(
  samples: Pick<Opportunity, "category" | "tags" | "organization">[],
): BehavioralSignal {
  const catCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  const orgCounts = new Map<string, number>();

  for (const s of samples) {
    if (s.category) {
      catCounts.set(s.category, (catCounts.get(s.category) ?? 0) + 1);
    }
    for (const t of s.tags ?? []) {
      const norm = t.toLowerCase().trim();
      if (norm) tagCounts.set(norm, (tagCounts.get(norm) ?? 0) + 1);
    }
    const org = s.organization?.toLowerCase().trim();
    if (org) orgCounts.set(org, (orgCounts.get(org) ?? 0) + 1);
  }

  const topFrom = (m: Map<string, number>) =>
    new Set(
      Array.from(m.entries())
        .filter(([, c]) => c >= 2)
        .map(([k]) => k),
    );

  return {
    topCategories: topFrom(catCounts),
    topTags: topFrom(tagCounts),
    topOrgs: topFrom(orgCounts),
    totalSamples: samples.length,
  };
}

/* ============================================================================
 * Component scorers (each 0..1)
 * ========================================================================== */

/**
 * Profile relevance: keyword overlap between user terms (interests + skills +
 * resume_skills) and the opp's text fields, with synonym expansion and
 * word-boundary protection.
 *
 * Improvements over the previous version:
 *   - Word-boundary regex prevents false positives ("data" no longer matches
 *     inside "data entry clerk" — actually it would, but the new check is
 *     against full-word "data" so still fine; the win is "ml" not matching
 *     inside "html").
 *   - Synonym groups: a user term hits when ANY of its synonyms appears in
 *     the opp ("ml" in skills hits an opp tagged "machine learning", and
 *     vice versa).
 *
 * Capped at 5 hits = 1.0 to bound dominance.
 */
function relevanceScore(profile: Profile, opp: Opportunity): number {
  const userTerms = collectUserTerms(profile);
  if (userTerms.length === 0) return 0.5;

  const oppText = collectOppText(opp);

  let hits = 0;
  for (const term of userTerms) {
    if (anyVariantAppears(oppText, term)) hits++;
  }
  return Math.min(1, hits / 5);
}

/**
 * Preference fit: explicit user preferences from the profile, finally used.
 * Reads remote_preference, time_commitment, preferred_location.
 *
 * Returns the average across whichever preferences the user actually stated
 * (anything set to "any"/empty is skipped, not penalized). Returns 0.5 when
 * no preferences are stated — genuinely neutral, not a hidden bonus.
 *
 * An explicit mismatch (user wants remote, opp is on-site) drives the
 * relevant factor to 0; an unknown location on the opp side returns 0.6
 * (treat-as-neutral, slight skew toward "give it a chance").
 */
function preferenceFitScore(profile: Profile, opp: Opportunity): number {
  let total = 0;
  let count = 0;

  // Remote preference
  const rp = profile.remote_preference;
  if (rp && rp !== "any") {
    count++;
    if (rp === "remote") total += opp.is_remote ? 1 : 0;
    else if (rp === "onsite") total += opp.is_remote ? 0 : 1;
    else if (rp === "hybrid") total += 0.7; // satisfied either way
  }

  // Time commitment ↔ category mapping
  const tc = profile.time_commitment;
  if (tc && tc !== "any") {
    count++;
    const cat = opp.category;
    if (tc === "internship" && cat === "internship") total += 1;
    else if (tc === "full-time" && cat === "fulltime") total += 1;
    else if (
      tc === "part-time" &&
      (cat === "remote_gig" || cat === "fulltime")
    )
      total += 0.7;
    else if (
      cat === "case_competition" ||
      cat === "hackathon" ||
      cat === "fellowship" ||
      cat === "conference" ||
      cat === "scholarship"
    ) {
      // Selective extra-curriculars don't compete with commitment preference
      total += 0.6;
    }
    // else: explicit mismatch (user wants internship, opp is fulltime) → 0
  }

  // Preferred location
  const locPref = profile.preferred_location?.trim().toLowerCase();
  if (locPref && locPref !== "anywhere" && locPref !== "any") {
    count++;
    const oppLoc = opp.location?.toLowerCase() ?? "";
    if (opp.is_remote) {
      total += 0.85; // remote satisfies any location agnostically
    } else if (oppLoc && (oppLoc.includes(locPref) || locPref.includes(oppLoc))) {
      total += 1;
    } else if (!oppLoc) {
      total += 0.6; // unknown location on opp side → slight benefit-of-doubt
    }
    // else: explicit mismatch → 0
  }

  if (count === 0) return 0.5; // user said "any" everywhere
  return total / count;
}

/**
 * Behavioral fit: how well does this opp align with what the user has been
 * saving? Cold-start safe (< 3 samples → neutral 0.5).
 *
 * Components add up to a max of 1.0:
 *   - 0.5 if category matches a top-saved category
 *   - 0.3 for ≥2 tag overlaps with top-saved tags (0.15 for 1 overlap)
 *   - 0.2 if org matches a top-saved org
 */
function behavioralFitScore(
  opp: Opportunity,
  signal: BehavioralSignal,
): number {
  if (signal.totalSamples < 3) return 0.5;

  let score = 0;
  if (signal.topCategories.has(opp.category)) score += 0.5;

  const tagOverlap = (opp.tags ?? []).filter((t) =>
    signal.topTags.has(t.toLowerCase().trim()),
  ).length;
  if (tagOverlap >= 2) score += 0.3;
  else if (tagOverlap === 1) score += 0.15;

  const orgNorm = opp.organization?.toLowerCase().trim();
  if (orgNorm && signal.topOrgs.has(orgNorm)) score += 0.2;

  return Math.min(1, score);
}

/**
 * Recency: how fresh is this opportunity? Helps the feed feel alive without
 * dominating the ranking (only weighted at 0.05).
 *
 * Decays over the first week — anything ≥7 days old gets the floor (0.1).
 * Brand-new (<24h) opps get a meaningful nudge.
 */
function recencyScore(dateAdded: string | null | undefined): number {
  if (!dateAdded) return 0.3;
  const added = parseISO(dateAdded);
  const hoursOld = differenceInHours(new Date(), added);
  if (hoursOld < 0) return 1; // shouldn't happen but safe
  if (hoursOld <= 24) return 1;
  if (hoursOld <= 48) return 0.75;
  if (hoursOld <= 24 * 7) return 0.5;
  if (hoursOld <= 24 * 30) return 0.2;
  return 0.1;
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

  const numbers = compensation.match(/[\d,]+/g)?.map((s) =>
    Number(s.replace(/,/g, "")),
  ) ?? [];
  const max = numbers.length > 0 ? Math.max(...numbers) : 0;
  if (max >= 50000) return 1;
  if (max > 0) return 0.7;
  return 0.4;
}

/**
 * Ease of application: are we one click away?
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

/* ============================================================================
 * Synonym expansion + word-boundary matching
 * ========================================================================== */

/**
 * Synonym groups for common career terms. A user-stated term hits the opp
 * text when ANY of its synonyms appears (case-insensitive, word-boundary
 * for purely-alphanumeric terms).
 *
 * Each entry is a group of equivalent forms. Lookup is bidirectional:
 * a user term in the group expands to all members; an opp text containing
 * any member matches a user term containing any other member.
 *
 * Keep the list focused on terms that genuinely cause student-side
 * mismatches today. Adding too many groups makes false positives.
 */
const SYNONYM_GROUPS: string[][] = [
  // Technical roles
  ["machine learning", "ml", "ai", "deep learning", "ai/ml", "ml / ai", "neural networks", "ml engineer"],
  ["software engineering", "swe", "software engineer", "software developer", "developer"],
  ["product management", "pm", "product manager", "apm", "associate product manager"],
  ["data science", "data scientist", "data analyst", "analytics", "data analysis"],
  ["frontend", "front-end", "front end", "react", "vue", "angular"],
  ["backend", "back-end", "back end", "api", "node.js", "node"],
  ["devops", "sre", "site reliability", "platform engineer", "infrastructure"],

  // Roles by function
  ["consulting", "consultant", "advisory", "strategy", "associate consultant"],
  ["venture capital", "vc", "investing", "investor"],
  ["finance", "financial analyst", "investment banking", "ib", "equity research"],
  ["marketing", "growth", "marketer", "content marketing", "performance marketing", "brand marketing"],
  ["design", "designer", "ui designer", "ux", "ui/ux", "product design", "graphic design"],
  ["research", "researcher", "r&d", "research engineer", "research scientist"],
  ["sales", "business development", "bd", "sales associate", "account executive", "ae"],
  ["operations", "ops", "business operations"],
  ["content / writing", "writing", "content", "copywriter", "editor"],

  // Tools / languages
  ["python", "py"],
  ["javascript", "js"],
  ["typescript", "ts"],
  ["sql", "mysql", "postgres", "postgresql"],
  ["powerpoint", "ppt", "ms powerpoint", "presentation"],
  ["excel", "spreadsheet", "ms excel"],
  ["no-code tools", "no-code", "nocode", "low-code"],
];

/**
 * Build a flat lookup: term → all synonyms (including itself). Computed once
 * at module load. A term not in any group simply maps to [term].
 */
const SYNONYM_LOOKUP = (() => {
  const map = new Map<string, readonly string[]>();
  for (const group of SYNONYM_GROUPS) {
    const lowered = group.map((t) => t.toLowerCase());
    for (const t of lowered) map.set(t, lowered);
  }
  return map;
})();

function variantsOf(term: string): readonly string[] {
  const norm = term.toLowerCase().trim();
  return SYNONYM_LOOKUP.get(norm) ?? [norm];
}

/**
 * Word-boundary aware substring match for purely-alphanumeric terms; falls
 * back to substring for terms containing punctuation (e.g. "ai/ml") since
 * \b doesn't behave well there.
 */
function termAppears(text: string, term: string): boolean {
  if (!term) return false;
  if (/^[a-z0-9]+$/i.test(term)) {
    return new RegExp(`\\b${term}\\b`, "i").test(text);
  }
  return text.toLowerCase().includes(term.toLowerCase());
}

function anyVariantAppears(text: string, term: string): boolean {
  for (const v of variantsOf(term)) {
    if (termAppears(text, v)) return true;
  }
  return false;
}

function collectUserTerms(profile: Profile): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (terms: readonly string[] | null | undefined) => {
    for (const t of terms ?? []) {
      const norm = t.toLowerCase().trim();
      if (!norm || seen.has(norm)) continue;
      out.push(t);
      seen.add(norm);
    }
  };
  add(profile.skills);
  add(profile.interests);
  add(profile.resume_skills);
  return out;
}

function collectOppText(opp: Opportunity): string {
  return [
    opp.title,
    opp.summary ?? "",
    opp.description ?? "",
    ...(opp.tags ?? []),
    opp.category,
  ]
    .filter(Boolean)
    .join(" ");
}

/* ============================================================================
 * Why-text — leads with the strongest specific signal
 * ========================================================================== */

function generateWhy(
  profile: Profile,
  opp: Opportunity,
  b: Record<string, number>,
  signal: BehavioralSignal,
  sourceQuality: number = 1.0
): string {
  const reasons: string[] = [];

  // 0. Macro Source Quality
  if (sourceQuality <= 0.6) {
    reasons.push("Warning: historically low-yield source");
  } else if (sourceQuality >= 1.2) {
    reasons.push("Highly trusted source (high community save rate)");
  }

  // 1. Profile relevance — name the actual matched term when possible
  if (b.profile_relevance >= 60) {
    const matched = findMatchedTerms(profile, opp).slice(0, 2);
    if (matched.length >= 2) {
      reasons.push(`Matches your ${matched[0]} + ${matched[1]} background`);
    } else if (matched.length === 1) {
      reasons.push(`Matches your interest in ${matched[0]}`);
    } else {
      reasons.push("Strong match with your profile");
    }
  } else if (b.profile_relevance >= 30) {
    reasons.push("Some overlap with your profile");
  }

  // 2. Preference fit — only when explicitly strong
  if (b.preference_fit >= 85 && hasAnyExplicitPreference(profile)) {
    if (
      profile.remote_preference === "remote" &&
      opp.is_remote
    ) {
      reasons.push("matches your remote preference");
    } else if (profile.time_commitment === "internship" && opp.category === "internship") {
      reasons.push("internship as you wanted");
    } else {
      reasons.push("aligned with your preferences");
    }
  }

  // 3. Behavioral resonance — only when the user has enough history
  if (signal.totalSamples >= 3 && b.behavioral_fit >= 60) {
    if (signal.topCategories.has(opp.category)) {
      reasons.push(`you've been saving ${labelForCategory(opp.category)}s`);
    } else {
      reasons.push("similar to opportunities you've saved");
    }
  }

  // 4. Career / brand value
  if (b.career_value >= 90) {
    reasons.push(`top-tier brand (${opp.organization})`);
  } else if (b.career_value >= 75) {
    reasons.push(`well-known org (${opp.organization})`);
  }

  // 5. Urgency context
  if (b.urgency >= 100) {
    if (opp.deadline) {
      const days = Math.max(0, differenceInDays(parseISO(opp.deadline), new Date()));
      reasons.push(days <= 1 ? "closing within 24h" : `closing in ${days} day${days === 1 ? "" : "s"}`);
    } else {
      reasons.push("closing this week");
    }
  } else if (b.urgency >= 70) {
    reasons.push("closing in <30 days");
  }

  // 6. Compensation
  if (b.compensation >= 100) {
    reasons.push("solid compensation");
  }

  // 7. Recency — only if there's nothing stronger
  if (reasons.length === 0 && b.recency >= 75) {
    reasons.push("Just added — fresh in the feed");
  }

  if (reasons.length === 0) {
    return "Surfaced because it's active and recently added.";
  }

  // Capitalize first reason; keep the rest lowercase. Join with · for visual rhythm.
  const first = reasons[0][0].toUpperCase() + reasons[0].slice(1);
  const rest = reasons.slice(1, 3).map((r) => r[0].toLowerCase() + r.slice(1));
  return [first, ...rest].join(" · ") + ".";
}

function hasAnyExplicitPreference(profile: Profile): boolean {
  return (
    (!!profile.remote_preference && profile.remote_preference !== "any") ||
    (!!profile.time_commitment && profile.time_commitment !== "any") ||
    !!profile.preferred_location?.trim()
  );
}

function labelForCategory(cat: string): string {
  const map: Record<string, string> = {
    internship: "internship",
    fulltime: "full-time role",
    case_competition: "case comp",
    hackathon: "hackathon",
    fellowship: "fellowship",
    scholarship: "scholarship",
  };
  return map[cat] ?? "opportunity";
}

/* ============================================================================
 * Public helpers used by UI surfaces
 * ========================================================================== */

/**
 * Return up to 3 user terms whose synonym group hits the opportunity text.
 * Preserves the user's original term casing for display ("React" not "react",
 * "ML / AI" not "ml") so chips read naturally.
 *
 * Uses the same word-boundary + synonym logic the relevance score uses, so
 * the displayed terms are exactly the ones that contributed to the score.
 */
export function findMatchedTerms(
  profile: Profile,
  opp: Opportunity,
): string[] {
  const oppText = collectOppText(opp);
  const matches: string[] = [];
  const seen = new Set<string>();

  const consider = (terms: readonly string[]) => {
    for (const term of terms) {
      if (matches.length >= 3) return;
      const norm = term.toLowerCase().trim();
      if (!norm || seen.has(norm)) continue;
      if (anyVariantAppears(oppText, term)) {
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

/**
 * Return the opportunity's required_skills that the user *doesn't* have in
 * their profile (skills + resume_skills + interests). Drives the detail
 * page's "What you're missing" gap-analysis section.
 *
 * Comparison is case-insensitive AND synonym-aware — if the user has
 * "machine learning" in skills, we don't flag a required "ml" as missing.
 */
export function findMissingRequirements(
  profile: Profile,
  opp: Opportunity,
): string[] {
  const required = opp.required_skills ?? [];
  if (required.length === 0) return [];

  // Build a set that includes every user term AND every synonym variant of
  // each user term, so "ml" in profile covers required "machine learning".
  const have = new Set<string>();
  for (const t of [
    ...(profile.skills ?? []),
    ...(profile.resume_skills ?? []),
    ...(profile.interests ?? []),
  ]) {
    const norm = t.toLowerCase().trim();
    if (!norm) continue;
    for (const v of variantsOf(norm)) have.add(v);
  }

  const missing: string[] = [];
  const seen = new Set<string>();
  for (const r of required) {
    const norm = r.toLowerCase().trim();
    if (!norm || seen.has(norm)) continue;
    // r is missing only when none of its synonym variants are already had
    const variants = variantsOf(norm);
    const covered = variants.some((v) => have.has(v));
    if (!covered) {
      missing.push(norm);
      seen.add(norm);
    }
  }
  return missing;
}

/* ============================================================================
 * Helpers
 * ========================================================================== */

function pct(v: number): number {
  return Math.round(v * 100);
}
