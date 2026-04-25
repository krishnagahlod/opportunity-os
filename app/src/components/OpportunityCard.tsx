import Link from "next/link";
import { ArrowUpRight, Clock, MapPin, Sparkles } from "lucide-react";
import { formatDistanceToNowStrict, isPast, parseISO } from "date-fns";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { SaveButton } from "./SaveButton";
import { ApplyButton } from "./ApplyButton";
import { getCategoryStyle, orgInitials } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, Opportunity } from "@/types/db";

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 ring-emerald-500/20 dark:from-emerald-500/10 dark:to-emerald-500/20 dark:text-emerald-300"
      : score >= 60
        ? "bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-700 ring-indigo-500/20 dark:from-indigo-500/10 dark:to-indigo-500/20 dark:text-indigo-300"
        : score >= 40
          ? "bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 ring-amber-500/20 dark:from-amber-500/10 dark:to-amber-500/20 dark:text-amber-300"
          : "bg-muted text-muted-foreground ring-border";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums shadow-sm ring-1 ring-inset",
        tone,
      )}
      title={`Personal fit: ${score}/100`}
    >
      <Sparkles className="size-2.5" />
      {score}
    </span>
  );
}

function DeadlineLabel({ deadline }: { deadline: string | null }) {
  if (!deadline) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="size-3" /> Rolling
      </span>
    );
  }
  const date = parseISO(deadline);
  const past = isPast(date);
  const distance = formatDistanceToNowStrict(date, { addSuffix: false });

  if (past) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
        <Clock className="size-3" /> Closed
      </span>
    );
  }

  const days = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  const urgent = days <= 7;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
        urgent
          ? "text-amber-600 dark:text-amber-300"
          : "text-muted-foreground",
      )}
    >
      <Clock className="size-3" />
      {distance} left
    </span>
  );
}

export function OpportunityCard({
  opportunity,
  isSaved,
  applicationStatus,
  score = null,
  why = null,
}: {
  opportunity: Opportunity;
  isSaved: boolean;
  applicationStatus?: ApplicationStatus;
  score?: number | null;
  why?: string | null;
}) {
  const cat = getCategoryStyle(opportunity.category);
  const Icon = cat.Icon;
  const summary = opportunity.summary ?? opportunity.description ?? "";
  const tags = (opportunity.tags ?? []).slice(0, 3);
  const lowConfidence =
    opportunity.extraction_confidence !== null &&
    opportunity.extraction_confidence !== undefined &&
    opportunity.extraction_confidence < 0.7;

  return (
    <Card className="card-hover-lift group relative flex h-full flex-col gap-0 overflow-hidden border-border/70 bg-card">
      {/* Top accent — only for low-confidence as a quality signal */}
      {lowConfidence && <div className="h-0.5 w-full bg-amber-400/70" />}

      {lowConfidence && (
        <div className="px-4 pt-3">
          <span
            className="rounded-full bg-amber-100/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
            title={`AI confidence: ${Math.round((opportunity.extraction_confidence ?? 0) * 100)}%`}
          >
            Low confidence
          </span>
        </div>
      )}

      <CardHeader className="gap-4 pb-3 pt-5">
        <div className="flex items-start gap-3.5">
          <span
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.04]",
              cat.chipBg,
              cat.chipText,
            )}
          >
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p
                className={cn(
                  "text-[10.5px] font-semibold uppercase tracking-[0.08em]",
                  cat.badgeText,
                )}
              >
                {cat.label}
              </p>
              {score !== null && <ScoreBadge score={score} />}
            </div>
            <h3 className="mt-1.5 line-clamp-2 text-[16px] font-semibold leading-[1.3] tracking-tight text-foreground">
              {opportunity.title}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground/85">
            <span className="inline-flex size-[18px] items-center justify-center rounded-full bg-muted text-[8.5px] font-bold text-foreground/70">
              {orgInitials(opportunity.organization)}
            </span>
            {opportunity.organization}
          </span>
          {opportunity.location && (
            <>
              <span aria-hidden className="text-muted-foreground/40">
                ·
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                {opportunity.is_remote ? "Remote" : opportunity.location}
              </span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pb-3">
        {why && (
          <p className="rounded-md border-l-2 border-primary/40 bg-primary/[0.03] py-1.5 pl-2.5 pr-2 text-[11.5px] font-medium leading-snug text-primary/90 dark:bg-primary/[0.06]">
            {why}
          </p>
        )}
        {summary && (
          <p className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
            {summary}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          <DeadlineLabel deadline={opportunity.deadline} />
          {opportunity.compensation && (
            <>
              <span aria-hidden className="text-muted-foreground/40">
                ·
              </span>
              <span className="font-medium text-foreground/85">
                {opportunity.compensation}
              </span>
            </>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-md border border-border/50 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="mt-auto flex items-center gap-1.5 border-t border-border/60 bg-muted/20 px-3 py-2.5">
        <SaveButton opportunityId={opportunity.id} isSaved={isSaved} />
        <ApplyButton
          opportunityId={opportunity.id}
          currentStatus={applicationStatus}
        />
        {opportunity.apply_url && (
          <Link
            href={opportunity.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({
                variant: "default",
                size: "sm",
                className:
                  "ml-auto gap-1 shadow-sm transition-shadow hover:shadow-md",
              }),
            )}
          >
            Apply
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
