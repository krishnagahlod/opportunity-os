"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowUpRight, Clock, MapPin, Wallet, ShieldCheck } from "lucide-react";
import { formatDistanceToNowStrict, isPast, parseISO } from "date-fns";
import { SaveButton } from "./SaveButton";
import { ApplyButton } from "./ApplyButton";
import { HideButton } from "./HideButton";
import { recordPendingApply } from "./ApplyNudge";
import { getCategoryStyle } from "@/lib/categories";
import { inferDomain } from "@/lib/domains";
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
  matchScore,
  onSelect,
}: {
  opportunity: Opportunity;
  isSaved: boolean;
  applicationStatus?: ApplicationStatus;
  matchScore?: number;
  onSelect?: (opp: Opportunity) => void;
}) {
  const [hidden, setHidden] = React.useState(false);
  const router = useRouter();
  const cat = getCategoryStyle(opportunity.category);
  const domain = inferDomain(opportunity.tags, opportunity.title, opportunity.organization);
  const DomainIcon = domain.Icon;
  const deadline = formatDeadline(opportunity.deadline);
  const compensation = stripHtml(opportunity.compensation);
  const location = opportunity.is_remote
    ? "Remote"
    : opportunity.location || null;
  const apply = opportunity.apply_url;

  const openDetail = () => {
    if (onSelect) {
      onSelect(opportunity);
    } else {
      router.push(`/opportunity/${opportunity.id}`, { scroll: false });
    }
  };

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
        "group relative flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-[1.25rem] border border-white/5 dark:border-white/5 bg-card/50 backdrop-blur-xl shadow-sm outline-none transition-all duration-300",
        "focus-visible:ring-2 focus-visible:ring-primary/40",
        "hover:-translate-y-1 hover:border-primary/30 hover:shadow-elevated hover:bg-card/70",
      )}
    >
      {/* Header — title + org + deadline */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        {/* Logo or Domain Icon */}
        {opportunity.company?.logo_url ? (
          <img
            src={opportunity.company.logo_url}
            alt={`${opportunity.organization} logo`}
            className="mt-0.5 size-9 shrink-0 rounded-lg shadow-sm object-contain bg-white p-0.5"
            onError={(e) => {
              // Fallback to domain icon if logo fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        
        <div
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg shadow-sm",
            domain.bg,
            domain.text,
            opportunity.company?.logo_url ? "hidden" : "" // Hidden by default if logo exists, revealed on error
          )}
          title={domain.label}
        >
          <DomainIcon className="size-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base sm:text-[17px] font-bold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
            {opportunity.title}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-[11.5px] text-muted-foreground min-w-0">
            <span className="truncate font-medium uppercase tracking-[0.06em] text-foreground/75 min-w-0 shrink">
              {opportunity.organization}
            </span>
            {deadline && (
              <>
                <span className="text-muted-foreground/30 shrink-0">·</span>
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
          {/* Domain label chip */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                domain.bg,
                domain.text,
              )}
            >
              {domain.label}
            </span>
            {opportunity.company && opportunity.company.trust_score >= 60 && (
              <span 
                className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                title={`Verified Company (Trust Score: ${opportunity.company.trust_score})`}
              >
                <ShieldCheck className="size-3" />
                Verified
              </span>
            )}
            {opportunity.estimated_value_score != null && opportunity.estimated_value_score >= 80 && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-700 dark:bg-red-500/15 dark:text-red-300">
                🔥 High Value
              </span>
            )}
            {((opportunity as any).variants?.length > 0) && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                + {(opportunity as any).variants.length} Similar
              </span>
            )}
          </div>
        </div>

        {/* Match Ring */}
        {matchScore !== undefined && <MatchRing score={matchScore} />}
      </div>

      {/* Body — actions visible on mobile (no hover possible on touch),
          hover-swap pattern preserved on sm+ for the desktop experience. */}
      <div className="relative mt-auto border-t border-border/20">
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
            <span className="inline-flex items-center gap-1 max-w-[200px]" title={location}>
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{location}</span>
            </span>
          )}
          {compensation && (
            <span className="inline-flex items-center gap-1 font-medium text-foreground/85 max-w-[150px]" title={compensation}>
              <Wallet className="size-3 shrink-0 text-muted-foreground" />
              <span className="truncate">{compensation}</span>
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
            "flex flex-wrap items-center gap-1.5 px-3 py-3",
            // Desktop: layered over metadata, hover-revealed
            "sm:absolute sm:inset-0 sm:py-0 sm:flex-nowrap sm:opacity-0 sm:pointer-events-none sm:transition-opacity sm:duration-150",
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

function MatchRing({ score }: { score: number }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  // Score is 0-100, clamped just in case
  const safeScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;
  
  const color = safeScore >= 80 ? "text-emerald-500" : safeScore >= 60 ? "text-amber-500" : "text-muted-foreground/50";
  const bg = safeScore >= 80 ? "text-emerald-500/20" : safeScore >= 60 ? "text-amber-500/20" : "text-muted-foreground/20";

  return (
    <div className="relative flex items-center justify-center shrink-0 mt-0.5" title={`Match Score: ${Math.round(safeScore)}%`}>
      <svg className="size-[34px] transform -rotate-90">
        <circle
          cx="17"
          cy="17"
          r={radius}
          className={cn("stroke-current", bg)}
          strokeWidth="3"
          fill="transparent"
        />
        <circle
          cx="17"
          cy="17"
          r={radius}
          className={cn("stroke-current transition-all duration-1000 ease-out", color)}
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className={cn("absolute text-[9px] font-bold tracking-tighter", color)}>
        {Math.round(safeScore)}
      </span>
    </div>
  );
}
