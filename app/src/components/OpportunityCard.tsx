"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Clock, MapPin, Sparkles, Wallet } from "lucide-react";
import { formatDistanceToNowStrict, isPast, parseISO } from "date-fns";
import { SaveButton } from "./SaveButton";
import { ApplyButton } from "./ApplyButton";
import { getCategoryStyle } from "@/lib/categories";
import { cn, stripHtml } from "@/lib/utils";
import type { ApplicationStatus, Opportunity } from "@/types/db";

/**
 * Compact opportunity card.
 *
 * Visible (default):
 *   ● title (line-clamp-2)
 *   ORG · deadline-urgency
 *   ─────
 *   📍 location · 💰 comp · category-badge
 *
 * On hover/focus the metadata strip is replaced (in the same space, no
 * expansion) by Save / Mark applied / Apply ↗ actions.
 *
 * The card itself acts as a link to apply_url via JS — Save / Mark applied
 * clicks stop propagation so they do NOT also navigate to the apply URL.
 * The Apply pill inside the action layer is a real Link.
 */
export function OpportunityCard({
  opportunity,
  isSaved,
  applicationStatus,
  matchedTerms,
}: {
  opportunity: Opportunity;
  isSaved: boolean;
  applicationStatus?: ApplicationStatus;
  /** User-profile terms that overlap with this opportunity. Up to 3, case-preserved. */
  matchedTerms?: string[];
}) {
  const router = useRouter();
  const cat = getCategoryStyle(opportunity.category);
  const deadline = formatDeadline(opportunity.deadline);
  const compensation = stripHtml(opportunity.compensation);
  const location = opportunity.is_remote
    ? "Remote"
    : opportunity.location || null;
  const apply = opportunity.apply_url;

  const detailHref = `/opportunity/${opportunity.id}`;
  const openDetail = () => router.push(detailHref);

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`${opportunity.title} at ${opportunity.organization}`}
      onClick={openDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetail();
        }
      }}
      className={cn(
        "group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-card outline-none transition-all",
        "focus-visible:ring-2 focus-visible:ring-primary/40",
        "hover:-translate-y-0.5 hover:border-border hover:shadow-elevated",
      )}
    >
      {/* Header — title + org + deadline */}
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
          {matchedTerms && matchedTerms.length > 0 && (
            <div
              className="mt-1.5 inline-flex max-w-full items-center gap-1 text-[11px] text-muted-foreground"
              title={`Matches your profile: ${matchedTerms.join(", ")}`}
            >
              <Sparkles className="size-3 shrink-0 text-primary/70" />
              <span className="truncate">{matchedTerms.join(" · ")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Body — relative container; metadata + action layers occupy same space */}
      <div className="relative mt-auto border-t border-border/50">
        {/* Metadata layer (default visible) */}
        <div
          className={cn(
            "flex min-h-[44px] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-[11.5px] text-muted-foreground transition-opacity duration-200",
            "group-hover:opacity-0 group-hover:pointer-events-none",
            "group-focus-within:opacity-0 group-focus-within:pointer-events-none",
          )}
          aria-hidden="true"
        >
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

        {/* Action layer (revealed on hover / keyboard focus) */}
        <div
          className={cn(
            "absolute inset-0 flex items-center gap-1.5 px-3 opacity-0 transition-opacity duration-150",
            "pointer-events-none",
            "group-hover:opacity-100 group-hover:pointer-events-auto",
            "group-focus-within:opacity-100 group-focus-within:pointer-events-auto",
          )}
          // Don't let action-area clicks navigate the parent card.
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <SaveButton
            opportunityId={opportunity.id}
            isSaved={isSaved}
            compact
          />
          <ApplyButton
            opportunityId={opportunity.id}
            currentStatus={applicationStatus}
            compact
          />
          {apply && (
            <Link
              href={apply}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-auto inline-flex items-center gap-1 rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background transition hover:bg-foreground/85"
            >
              Apply
              <ArrowUpRight className="size-3" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
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
