"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronDown,
  Clock,
  MapPin,
  Wallet,
} from "lucide-react";
import { formatDistanceToNowStrict, isPast, parseISO } from "date-fns";
import { SaveButton } from "./SaveButton";
import { ApplyButton } from "./ApplyButton";
import { getCategoryStyle } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, Opportunity } from "@/types/db";

/**
 * Minimalistic opportunity card — collapsed by default, expands on click.
 *
 * Collapsed: title + org + deadline urgency only (3 elements).
 * Expanded: adds location, compensation, "why" rationale, save/apply actions.
 */
export function OpportunityCard({
  opportunity,
  isSaved,
  applicationStatus,
  why = null,
  defaultExpanded = false,
}: {
  opportunity: Opportunity;
  isSaved: boolean;
  applicationStatus?: ApplicationStatus;
  why?: string | null;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const cat = getCategoryStyle(opportunity.category);
  const deadline = formatDeadline(opportunity.deadline);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card transition-all",
        expanded
          ? "border-border shadow-elevated"
          : "border-border/70 shadow-card hover:border-border hover:-translate-y-0.5 hover:shadow-elevated",
      )}
    >
      {/* Header — always visible, clickable to toggle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors"
      >
        <span
          aria-hidden
          className={cn(
            "mt-1.5 size-1.5 shrink-0 rounded-full",
            cat.dotBg,
          )}
        />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[14.5px] font-medium leading-snug tracking-tight text-foreground transition-colors group-hover:text-foreground">
            {opportunity.title}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-[11.5px] text-muted-foreground">
            <span className="truncate font-medium uppercase tracking-[0.06em] text-foreground/75">
              {opportunity.organization}
            </span>
            {deadline && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1 tabular-nums",
                    deadline.urgent &&
                      "text-amber-600 dark:text-amber-300",
                  )}
                >
                  <Clock className="size-3" /> {deadline.text}
                </span>
              </>
            )}
          </div>
        </div>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-muted-foreground/60 transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {/* Expandable body — animated via grid trick */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/50 px-4 pb-4 pt-3">
            {/* Secondary metadata strip */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-muted-foreground">
              {opportunity.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" />
                  {opportunity.is_remote ? "Remote" : opportunity.location}
                </span>
              )}
              {opportunity.compensation && (
                <span className="inline-flex items-center gap-1 font-medium text-foreground/85">
                  <Wallet className="size-3 text-muted-foreground" />
                  {opportunity.compensation}
                </span>
              )}
              <span className={cn("inline-flex items-center gap-1 font-medium", cat.badgeText)}>
                {cat.label}
              </span>
            </div>

            {why && (
              <p className="mt-3 rounded-md border-l-2 border-primary/40 bg-primary/[0.04] py-1.5 pl-2.5 pr-2 text-[11.5px] italic leading-snug text-primary/85 dark:bg-primary/[0.06]">
                {why}
              </p>
            )}

            {opportunity.summary && (
              <p className="mt-3 line-clamp-3 text-[12.5px] leading-relaxed text-muted-foreground">
                {opportunity.summary}
              </p>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center gap-1.5">
              <SaveButton
                opportunityId={opportunity.id}
                isSaved={isSaved}
              />
              <ApplyButton
                opportunityId={opportunity.id}
                currentStatus={applicationStatus}
              />
              {opportunity.apply_url && (
                <Link
                  href={opportunity.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1 rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background transition hover:bg-foreground/85"
                >
                  Apply
                  <ArrowUpRight className="size-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ============ helpers ============ */

function formatDeadline(
  deadline: string | null,
): { text: string; urgent: boolean } | null {
  if (!deadline) return null; // truly unknown — omit deadline chip entirely
  const date = parseISO(deadline);
  if (isPast(date)) return { text: "Closed", urgent: false };
  const distance = formatDistanceToNowStrict(date, { addSuffix: false });
  const days = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return { text: `${distance} left`, urgent: days <= 7 };
}
