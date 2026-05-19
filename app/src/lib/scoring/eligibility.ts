import type { Opportunity } from "@/types/db";

/**
 * Quality gates applied at every user-facing surface (dashboard, search,
 * digest, saved, applications). The audit in Phase 12 found that low-
 * confidence AI extractions and tail-end-score rows were polluting the feed
 * — visible to users but adding no value.
 *
 * Single source of truth so we don't drift across surfaces. Both gates are
 * cheap booleans; safe to call inside React render paths.
 */

/** Confidence floor below which an opp is hidden from every user surface
 * and instead routed to the admin "Needs review" queue. */
export const CONFIDENCE_HIDE_THRESHOLD = 0.5;

/** Confidence range that's shown but visually flagged with a small badge. */
export const CONFIDENCE_WARN_THRESHOLD = 0.7;

/** Default minimum personal-fit score for the dashboard browse view.
 * Below this, rows are hidden unless the user toggles "show all". Search
 * and digest do NOT apply this floor — they have their own ranking signals
 * (user-typed query, top-N selection). */
export const DASHBOARD_SCORE_FLOOR = 25;

/**
 * Hard quality gate — true if this opportunity should ever be shown to a
 * user. Currently equivalent to `extraction_confidence >= 0.5`. Rows
 * failing this gate are still in the DB (admin can review them) but
 * filtered out of every user-facing query.
 *
 * Treats null/undefined confidence as eligible — pre-Phase-2.5 rows didn't
 * have the column populated, so we trust them by default.
 */
export function isFeedEligible(opp: Pick<Opportunity, "extraction_confidence">): boolean {
  const c = opp.extraction_confidence;
  if (c === null || c === undefined) return true;
  return c >= CONFIDENCE_HIDE_THRESHOLD;
}

/** True if the opp should get the "lower confidence" warn badge in the UI.
 * Below the hide threshold returns false because the row won't be shown at
 * all; we only badge the "shown-but-shaky" middle band. */
export function shouldWarnLowConfidence(
  opp: Pick<Opportunity, "extraction_confidence">,
): boolean {
  const c = opp.extraction_confidence;
  if (c === null || c === undefined) return false;
  return c >= CONFIDENCE_HIDE_THRESHOLD && c < CONFIDENCE_WARN_THRESHOLD;
}
