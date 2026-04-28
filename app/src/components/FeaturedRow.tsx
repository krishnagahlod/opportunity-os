"use client";

import { Sparkles } from "lucide-react";
import { OpportunityCard } from "@/components/OpportunityCard";
import { pickDiversifiedTop } from "@/lib/scoring/diversify";
import type { ApplicationStatus, Opportunity } from "@/types/db";

/**
 * Top-of-feed featured row — the best-scored opportunities right now.
 * Renders as 3 cards on desktop; same OpportunityCard component as the
 * category-detail grid so the visual language stays consistent.
 *
 * Hidden when fewer than 3 opportunities have a meaningful score (avoid
 * filling the row with low-relevance picks).
 */
export function FeaturedRow({
  opportunities,
  scoreMap,
  savedSet,
  appliedMap,
  count = 3,
}: {
  opportunities: Opportunity[];
  scoreMap: Record<string, { score: number; why: string | null }>;
  savedSet: Set<string>;
  appliedMap: Record<string, ApplicationStatus>;
  count?: number;
}) {
  // Build candidates with valid scores, then diversify so the top row
  // doesn't collapse to all-internship or all-fulltime when one category
  // dominates this user's matches.
  const candidates = opportunities
    .map((opp) => ({ opp, s: scoreMap[opp.id] }))
    .filter((x) => (x.s?.score ?? 0) > 0);

  const ranked = pickDiversifiedTop(
    candidates,
    count,
    (x) => x.s?.score ?? 0,
    (x) => x.opp.category,
  );

  if (ranked.length < count) return null;

  return (
    <section>
      <header className="mb-5 flex items-baseline justify-between">
        <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Sparkles className="size-4 text-primary" />
          Featured for you
        </h2>
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground/70">
          Top {count} by personal fit
        </span>
      </header>
      <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ranked.map(({ opp }) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            isSaved={savedSet.has(opp.id)}
            applicationStatus={appliedMap[opp.id]}
          />
        ))}
      </div>
    </section>
  );
}
