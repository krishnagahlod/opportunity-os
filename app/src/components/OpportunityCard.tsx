"use client";

import Link from "next/link";
import { ArrowUpRight, Clock, MapPin, Wallet } from "lucide-react";
import { formatDistanceToNowStrict, isPast, parseISO } from "date-fns";
import { SaveButton } from "./SaveButton";
import { ApplyButton } from "./ApplyButton";
import { getCategoryStyle } from "@/lib/categories";
import { cn, stripHtml } from "@/lib/utils";
import type { ApplicationStatus, Opportunity } from "@/types/db";

/**
 * Minimalistic opportunity card. Always-on (no expand state).
 *
 * Layout (top → bottom):
 *   ● title (line-clamp-2)
 *   ORG · deadline-urgency
 *   ─────────────────
 *   📍 location · 💰 comp · category-badge
 *   "why" rationale (single line, italic)
 *   [Save] [Mark applied]                    [Apply ↗]
 *
 * The whole card body is a Link to apply_url so a tap on the card opens the
 * external posting in a new tab. Inner action buttons stop propagation so
 * Save / Apply do not also navigate.
 */
export function OpportunityCard({
  opportunity,
  isSaved,
  applicationStatus,
  why = null,
}: {
  opportunity: Opportunity;
  isSaved: boolean;
  applicationStatus?: ApplicationStatus;
  why?: string | null;
}) {
  const cat = getCategoryStyle(opportunity.category);
  const deadline = formatDeadline(opportunity.deadline);
  const compensation = stripHtml(opportunity.compensation);
  const cleanWhy = stripHtml(why);
  const location = opportunity.is_remote
    ? "Remote"
    : opportunity.location || null;

  const wrapperClass = cn(
    "group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-card transition-all",
    opportunity.apply_url &&
      "hover:-translate-y-0.5 hover:border-border hover:shadow-elevated",
  );

  const inner = (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <span
          aria-hidden
          className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", cat.dotBg)}
        />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[14.5px] font-medium leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
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
                    deadline.urgent && "text-amber-600 dark:text-amber-300",
                  )}
                >
                  <Clock className="size-3" />
                  {deadline.text}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Body — divider, secondary metadata, why, then actions sticking to bottom */}
      <div className="flex flex-1 flex-col gap-3 border-t border-border/50 px-4 pb-4 pt-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px] text-muted-foreground">
          {location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {location}
            </span>
          )}
          {compensation && (
            <span className="inline-flex items-center gap-1 font-medium text-foreground/85">
              <Wallet className="size-3 text-muted-foreground" />
              {compensation}
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center gap-1 font-medium",
              cat.badgeText,
            )}
          >
            {cat.label}
          </span>
        </div>

        {cleanWhy && (
          <p className="line-clamp-2 rounded-md border-l-2 border-primary/40 bg-primary/[0.04] py-1 pl-2.5 pr-2 text-[11.5px] italic leading-snug text-primary/85 dark:bg-primary/[0.06]">
            {cleanWhy}
          </p>
        )}

        {/* Spacer pushes actions to the bottom in equal-height grid rows */}
        <div className="flex-1" />

        <div
          className="flex items-center gap-1.5"
          // Don't let action-button clicks navigate the wrapping link
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") e.stopPropagation();
          }}
        >
          <SaveButton
            opportunityId={opportunity.id}
            isSaved={isSaved}
          />
          <ApplyButton
            opportunityId={opportunity.id}
            currentStatus={applicationStatus}
          />
          {opportunity.apply_url && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background transition group-hover:bg-foreground/85">
              Apply
              <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (opportunity.apply_url) {
    return (
      <Link
        href={opportunity.apply_url}
        target="_blank"
        rel="noopener noreferrer"
        className={wrapperClass}
      >
        {inner}
      </Link>
    );
  }
  return <article className={wrapperClass}>{inner}</article>;
}

/* ============ helpers ============ */

function formatDeadline(
  deadline: string | null,
): { text: string; urgent: boolean } | null {
  if (!deadline) return null;
  const date = parseISO(deadline);
  if (isPast(date)) return { text: "Closed", urgent: false };
  const distance = formatDistanceToNowStrict(date, { addSuffix: false });
  const days = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return { text: `${distance} left`, urgent: days <= 7 };
}
