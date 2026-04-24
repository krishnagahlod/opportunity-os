import Link from "next/link";
import { ArrowUpRight, Clock, MapPin } from "lucide-react";
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

  // urgency color
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
}: {
  opportunity: Opportunity;
  isSaved: boolean;
  applicationStatus?: ApplicationStatus;
}) {
  const cat = getCategoryStyle(opportunity.category);
  const Icon = cat.Icon;
  const summary = opportunity.summary ?? opportunity.description ?? "";
  const tags = (opportunity.tags ?? []).slice(0, 3);

  return (
    <Card className="card-hover-lift group relative flex h-full flex-col gap-0 overflow-hidden border-border/70">
      {opportunity.featured && (
        <span className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-indigo-500/15 to-fuchsia-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
          Featured
        </span>
      )}

      <CardHeader className="gap-3 pb-3">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              cat.chipBg,
              cat.chipText,
            )}
          >
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-wider",
                cat.badgeText,
              )}
            >
              {cat.label}
            </p>
            <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug">
              {opportunity.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-foreground/70">
            {orgInitials(opportunity.organization)}
          </span>
          <span className="font-medium text-foreground/80">
            {opportunity.organization}
          </span>
          {opportunity.location && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                {opportunity.is_remote ? "Remote" : opportunity.location}
              </span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pb-3">
        {summary && (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {summary}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <DeadlineLabel deadline={opportunity.deadline} />
          {opportunity.compensation && (
            <span className="text-xs font-medium text-foreground/80">
              {opportunity.compensation}
            </span>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="mt-auto flex items-center gap-2 border-t border-border/60 bg-muted/30 px-4 py-3">
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
                className: "ml-auto gap-1",
              }),
            )}
          >
            Apply
            <ArrowUpRight className="size-3.5" />
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
