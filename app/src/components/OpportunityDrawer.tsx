"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  Clock,
  MapPin,
  Sparkles,
  Tag,
  Wallet,
  Activity,
  TrendingUp,
  ShieldAlert,
  CheckCircle,
} from "lucide-react";
import {
  format,
  formatDistanceToNowStrict,
  isPast,
  parseISO,
} from "date-fns";
import { SaveButton } from "@/components/SaveButton";
import { ApplyButton } from "@/components/ApplyButton";
import { ExternalApplyLink } from "@/components/ApplyNudge";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { Drawer } from "@/components/Drawer";
import { getCategoryStyle, orgInitials } from "@/lib/categories";
import { inferDomain } from "@/lib/domains";
import { cn, stripHtml } from "@/lib/utils";
import type { ApplicationStatus, Opportunity } from "@/types/db";

/**
 * Client-side opportunity detail drawer. Renders instantly from in-memory data
 * passed directly from the feed — no server roundtrip.
 */
export function OpportunityDrawer({
  opportunity: opp,
  isSaved,
  applicationStatus,
  score,
  why,
  fitScore,
  valueScore,
  actionabilityScore,
  sourceName,
  onClose,
}: {
  opportunity: Opportunity;
  isSaved: boolean;
  applicationStatus?: ApplicationStatus;
  score: number;
  why: string | null;
  fitScore?: number;
  valueScore?: number;
  actionabilityScore?: number;
  sourceName?: string;
  onClose: () => void;
}) {
  const cat = getCategoryStyle(opp.category);
  const domain = inferDomain(opp.tags, opp.title, opp.organization);
  const DomainIcon = domain.Icon;
  const description = stripHtml(opp.description);
  const summary = stripHtml(opp.summary);
  const compensation = stripHtml(opp.compensation);
  const eligibility = stripHtml(opp.eligibility);
  const location = opp.is_remote ? "Remote" : opp.location;
  const deadlineDate = opp.deadline ? parseISO(opp.deadline) : null;
  const deadlineRel = deadlineDate
    ? isPast(deadlineDate)
      ? "Closed"
      : `${formatDistanceToNowStrict(deadlineDate)} left`
    : "Rolling";
  const deadlineUrgent =
    deadlineDate &&
    !isPast(deadlineDate) &&
    (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 7;
  const isExpired = opp.status === "expired";

  return (
    <Drawer onClose={onClose}>
      <div className="px-5 pb-8 sm:px-6">
        {/* Category + Domain badge */}
        <header>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]">
            <span
              aria-hidden
              className={cn("size-1.5 rounded-full", cat.dotBg)}
            />
            <span className={cat.badgeText}>{cat.label}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                domain.bg,
                domain.text,
              )}
            >
              <DomainIcon className="size-3" />
              {domain.label}
            </span>
            {isExpired && (
              <span className="ml-2 rounded-md bg-slate-500/10 px-2 py-0.5 text-[10px] tracking-normal text-muted-foreground">
                Closed
              </span>
            )}
          </div>

          <h1 className="mt-2 pr-2 text-xl font-semibold tracking-tight text-foreground">
            {opp.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 text-[14px] text-foreground/85">
              <span
                aria-hidden
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full",
                  cat.chipBg,
                  cat.chipText,
                )}
              >
                <Building2 className="size-3.5" />
              </span>
              <span className="font-medium">{opp.organization}</span>
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                {orgInitials(opp.organization)}
              </span>
            </div>
            <ScoreBadge score={score} />
          </div>
        </header>

        {/* Action bar */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <SaveButton opportunityId={opp.id} isSaved={isSaved} />
          <ApplyButton
            opportunityId={opp.id}
            currentStatus={applicationStatus}
          />
          {opp.apply_url && (
            <ExternalApplyLink
              href={opp.apply_url}
              opp={{
                id: opp.id,
                title: opp.title,
                organization: opp.organization,
              }}
              className="ml-auto inline-flex items-center justify-center"
            >
              Apply
              <ArrowUpRight className="size-4" />
            </ExternalApplyLink>
          )}
        </div>

        {/* Score Breakdown */}
        {(fitScore != null || valueScore != null || actionabilityScore != null) && (
          <div className="mt-8 mb-2">
            <ScoreBreakdown 
              fitScore={fitScore ?? 0}
              valueScore={valueScore ?? 0}
              actionabilityScore={actionabilityScore ?? 0}
            />
          </div>
        )}

        {/* Quick facts */}
        <section className="mt-6 grid gap-2 grid-cols-2">
          <Fact
            icon={<Clock className="size-3.5" />}
            label="Deadline"
            value={
              <span
                className={cn(
                  deadlineUrgent && "text-amber-600 dark:text-amber-300",
                  isPast(deadlineDate ?? new Date()) &&
                    deadlineDate &&
                    "text-destructive",
                )}
              >
                {deadlineDate ? format(deadlineDate, "EEE, MMM d") : "Rolling"}
                {deadlineDate && (
                  <span className="ml-1 text-[10px] text-muted-foreground/80">
                    ({deadlineRel})
                  </span>
                )}
              </span>
            }
          />
          {location && (
            <Fact
              icon={<MapPin className="size-3.5" />}
              label="Location"
              value={location}
            />
          )}
          {compensation && (
            <Fact
              icon={<Wallet className="size-3.5" />}
              label="Compensation"
              value={compensation}
            />
          )}
          {sourceName && (
            <Fact
              icon={<Sparkles className="size-3.5" />}
              label="Source"
              value={sourceName}
            />
          )}
          {opp.upside_score != null && (
            <Fact
              icon={<TrendingUp className="size-3.5" />}
              label="Career Upside"
              value={`${opp.upside_score}/100`}
            />
          )}
          {opp.effort_score != null && (
            <Fact
              icon={<Activity className="size-3.5" />}
              label="Effort"
              value={`${opp.effort_score}/100`}
            />
          )}
        </section>

        {/* Decision Intelligence Teaser */}
        <section className="mt-8">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sparkles className="size-4 text-primary" />
                  Decision Intelligence
                </h3>
                <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
                  Unlock your exact missing skills, AI-generated action plan, and hidden red flags for this opportunity.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-background/60 px-2 py-1.5 text-[11px] font-medium text-foreground backdrop-blur-sm">
                <Activity className="size-3" /> Effort Prediction
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-background/60 px-2 py-1.5 text-[11px] font-medium text-foreground backdrop-blur-sm">
                <CheckCircle className="size-3" /> Missing Skills
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-background/60 px-2 py-1.5 text-[11px] font-medium text-foreground backdrop-blur-sm">
                <ShieldAlert className="size-3" /> Red Flags
              </span>
            </div>
            <Link
              href={`/opportunity/${opp.id}`}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[14px] font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
            >
              Unlock Decision Intelligence
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </section>

        {/* Why for you */}
        {why && (
          <section className="mt-6">
            <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
              Why this is for you
            </h2>
            <div className="rounded-xl border-l-2 border-primary/50 bg-primary/[0.04] px-4 py-3 dark:bg-primary/[0.06]">
              <p className="text-[13.5px] italic leading-relaxed text-primary/90">
                {why}
              </p>
            </div>
          </section>
        )}

        {/* Intelligence */}
        {(opp.action_plan || (opp.red_flags && opp.red_flags.length > 0)) && (
          <section className="mt-6">
            <h2 className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
              <Sparkles className="size-3" />
              Intelligence
            </h2>
            <div className="rounded-xl border border-border/60 bg-card/40 p-3.5 space-y-3">
              {opp.red_flags && opp.red_flags.length > 0 && (
                <div>
                  <h3 className="mb-1 flex items-center gap-1.5 text-[12px] font-medium text-destructive">
                    <ShieldAlert className="size-3.5" />
                    Red Flags
                  </h3>
                  <ul className="space-y-0.5 text-[13px] text-muted-foreground">
                    {opp.red_flags.map((flag) => (
                      <li key={flag} className="flex gap-2">
                        <span className="text-destructive/50">•</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {opp.action_plan && (
                <div>
                  <h3 className="mb-1 flex items-center gap-1.5 text-[12px] font-medium text-foreground">
                    <CheckCircle className="size-3.5 text-emerald-500" />
                    Action Plan
                  </h3>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    {opp.action_plan}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Summary */}
        {summary && summary.length > 0 && summary !== description && (
          <section className="mt-6">
            <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
              Summary
            </h2>
            <p className="text-[13.5px] leading-relaxed text-foreground/85">
              {summary}
            </p>
          </section>
        )}

        {/* Description */}
        {description && (
          <section className="mt-6">
            <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
              Details
            </h2>
            <div className="space-y-2.5 text-[13.5px] leading-relaxed text-foreground/85">
              {description.split(/\n\s*\n/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>
        )}

        {/* Eligibility */}
        {eligibility && (
          <section className="mt-6">
            <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
              Eligibility
            </h2>
            <p className="text-[13.5px] leading-relaxed text-foreground/85">
              {eligibility}
            </p>
          </section>
        )}

        {/* Tags */}
        {opp.tags && opp.tags.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
              <Tag className="size-3" />
              Tags
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {opp.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-border/60 bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {t}
                </span>
              ))}
              {opp.eligibility_tags?.map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-600 dark:text-blue-400"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-8 border-t border-border/40 pt-4 text-[11.5px] text-muted-foreground/80">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Added{" "}
              {formatDistanceToNowStrict(parseISO(opp.date_added), {
                addSuffix: true,
              })}
            </span>
          </div>
          {opp.source_url && (
            <Link
              href={opp.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-muted-foreground transition hover:text-foreground"
            >
              View source
              <ArrowUpRight className="size-3" />
            </Link>
          )}
        </footer>
      </div>
    </Drawer>
  );
}

/* ============ Internals ============ */

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
      : score >= 60
        ? "bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300"
        : score >= 40
          ? "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300"
          : "bg-muted text-muted-foreground ring-border";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold tabular-nums ring-1 ring-inset",
        tone,
      )}
      title={`Personal fit: ${score}/100`}
    >
      <Sparkles className="size-3" />
      {score}/100
    </span>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-card/40 px-3 py-2.5">
      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
          {label}
        </p>
        <p className="mt-0.5 text-[13px] font-medium text-foreground/90">
          {value}
        </p>
      </div>
    </div>
  );
}
