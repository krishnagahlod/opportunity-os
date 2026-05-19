"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { OpportunityCard } from "@/components/OpportunityCard";
import type { ApplicationStatus, Opportunity } from "@/types/db";

/**
 * Collapsible "Closed" section on /saved. Phase 12 addition — previously
 * expired/spam-marked saves got mixed into the main grid as if active,
 * polluting the user's "what should I act on" workflow.
 *
 * Demoted (not deleted) so users can still revisit what they tracked.
 */
export function SavedClosedSection({
  closedOpps,
  appliedMap,
}: {
  closedOpps: Opportunity[];
  appliedMap: Record<string, ApplicationStatus>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="mt-10 border-t border-border/60 pt-6">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="size-3.5" />
        ) : (
          <ChevronRight className="size-3.5" />
        )}
        Closed ({closedOpps.length})
      </button>

      {expanded && (
        <div className="mt-4 grid gap-3 opacity-80 sm:grid-cols-2 lg:grid-cols-3">
          {closedOpps.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              isSaved={true}
              applicationStatus={appliedMap[opp.id]}
            />
          ))}
        </div>
      )}
    </section>
  );
}
