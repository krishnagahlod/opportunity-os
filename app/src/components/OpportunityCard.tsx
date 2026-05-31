"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowUpRight, Clock, MapPin, Wallet, Sparkles } from "lucide-react";
import { formatDistanceToNowStrict, isPast, parseISO } from "date-fns";
import { SaveButton } from "./SaveButton";
import { ApplyButton } from "./ApplyButton";
import { HideButton } from "./HideButton";
import { recordPendingApply } from "./ApplyNudge";
import { getCategoryStyle } from "@/lib/categories";
import { shouldWarnLowConfidence } from "@/lib/scoring/eligibility";
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
  matchReason,
}: {
  opportunity: Opportunity;
  isSaved: boolean;
  applicationStatus?: ApplicationStatus;
  matchReason?: string | null;
}) {
  const [hidden, setHidden] = React.useState(false);
  const router = useRouter();
  const cat = getCategoryStyle(opportunity.category);
  const deadline = formatDeadline(opportunity.deadline);
  const compensation = stripHtml(opportunity.compensation);
  const location = opportunity.is_remote
    ? "Remote"
    : opportunity.location || null;
  const apply = opportunity.apply_url;

  const detailHref = `/opportunity/${opportunity.id}`;
  const openDetail = () => router.push(detailHref, { scroll: false });

  if (hidden) return null;

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
        <CompanyLogo name={opportunity.organization} />
        <div className="min-w-0 flex-1">
          {matchReason && (
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-primary">
              <Sparkles className="size-3" />
              <span className="line-clamp-1">{matchReason}</span>
            </div>
          )}
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
            {shouldWarnLowConfidence(opportunity) && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span
                  title="Lower-confidence AI extraction — verify details before applying"
                  className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300"
                >
                  <AlertCircle className="size-2.5" />
                  shaky
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Body — actions visible on mobile (no hover possible on touch),
          hover-swap pattern preserved on sm+ for the desktop experience. */}
      <div className="relative mt-auto border-t border-border/50">
        {/* Metadata layer — hidden entirely on mobile (actions take its space).
            Desktop: shown by default, hover-faded so actions can take over. */}
        <div
          className={cn(
            "hidden min-h-[44px] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-[11.5px] text-muted-foreground transition-opacity duration-200 sm:flex",
            "sm:group-hover:opacity-0 sm:group-hover:pointer-events-none",
            "sm:group-focus-within:opacity-0 sm:group-focus-within:pointer-events-none",
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

        {/* Action layer — always visible on mobile (in-flow), absolute hover-
            revealed on sm+ (sits over the metadata strip). */}
        <div
          className={cn(
            // Mobile: in-flow, full padding, always visible
            "flex items-center gap-1.5 px-3 py-3",
            // Desktop: layered over metadata, hover-revealed
            "sm:absolute sm:inset-0 sm:py-0 sm:opacity-0 sm:pointer-events-none sm:transition-opacity sm:duration-150",
            "sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto",
            "sm:group-focus-within:opacity-100 sm:group-focus-within:pointer-events-auto",
          )}
          // Don't let action-area clicks navigate the parent card.
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <HideButton
            opportunityId={opportunity.id}
            compact
            onHidden={() => setHidden(true)}
          />
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
              onClick={(e) => {
                e.stopPropagation();
                recordPendingApply({
                  id: opportunity.id,
                  title: opportunity.title,
                  organization: opportunity.organization,
                });
              }}
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

function CompanyLogo({ name }: { name: string }) {
  const [failed, setFailed] = React.useState(false);
  const domain = name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";

  if (failed) {
    return (
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-xs font-bold text-muted-foreground uppercase shadow-sm">
        {name.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={`https://logo.clearbit.com/${domain}`}
      alt={`${name} logo`}
      className="mt-0.5 size-9 shrink-0 rounded-lg border border-border/60 bg-white object-cover shadow-sm"
      onError={() => setFailed(true)}
    />
  );
}
