import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatDistanceToNowStrict, isPast, parseISO } from "date-fns";
import { SaveButton } from "./SaveButton";
import { ApplyButton } from "./ApplyButton";
import { getCategoryStyle } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, Opportunity } from "@/types/db";

/**
 * Editorial single-row presentation of one opportunity.
 * 4–5 visual elements per row, one accent color, no card chrome.
 *
 * Used by the dashboard feed and the saved page in place of the boxy
 * card grid. Detail-rich fields (tags, prize, full description) live on
 * the detail page; this row is for scanning.
 */
export function OpportunityRow({
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
  const deadlineLine = formatDeadline(opportunity.deadline);
  const locationLine = opportunity.is_remote
    ? "Remote"
    : opportunity.location || null;

  const meta = [
    cat.label.toLowerCase(),
    locationLine?.toLowerCase(),
    deadlineLine?.text,
  ].filter(Boolean);

  return (
    <article className="group relative -mx-3 flex flex-col gap-1 rounded-lg px-3 py-3.5 transition-colors hover:bg-muted/30 sm:py-4">
      {/* Title row — colored dot · title · org (uppercase, right-aligned, desktop only) */}
      <div className="flex items-baseline gap-2.5">
        <span
          aria-hidden
          className={cn(
            "size-1.5 shrink-0 translate-y-[3px] rounded-full",
            cat.dotBg,
          )}
        />
        <h3 className="flex-1 text-[15px] font-medium leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
          {opportunity.title}
        </h3>
        <span className="hidden shrink-0 truncate text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80 sm:inline-block sm:max-w-[200px]">
          {opportunity.organization}
        </span>
      </div>

      {/* Metadata + actions row */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 pl-4">
        <p className="text-[12.5px] text-muted-foreground">
          {/* Org inline on mobile only — appears top-right on desktop */}
          <span className="font-semibold uppercase tracking-[0.06em] text-foreground/80 sm:hidden">
            {opportunity.organization}
          </span>
          {meta.length > 0 && (
            <>
              <span className="sm:hidden"> · </span>
              <span
                className={cn(
                  deadlineLine?.urgent &&
                    "[&>span:last-child]:text-amber-600 [&>span:last-child]:dark:text-amber-300",
                )}
              >
                {meta.map((m, i) => (
                  <span key={i}>
                    {i > 0 && (
                      <span className="text-muted-foreground/40"> · </span>
                    )}
                    <span>{m}</span>
                  </span>
                ))}
              </span>
            </>
          )}
        </p>

        <div className="flex shrink-0 items-center gap-0.5">
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
          {opportunity.apply_url && (
            <Link
              href={opportunity.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition hover:bg-primary/10"
            >
              Apply
              <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Why — quietly beneath, only when present */}
      {why && (
        <p className="ml-4 line-clamp-1 text-[11.5px] italic text-primary/70">
          {why}
        </p>
      )}
    </article>
  );
}

/* ============ helpers ============ */

function formatDeadline(
  deadline: string | null,
): { text: string; urgent: boolean } | null {
  if (!deadline) return { text: "rolling", urgent: false };
  const date = parseISO(deadline);
  if (isPast(date)) return { text: "closed", urgent: false };
  const distance = formatDistanceToNowStrict(date, { addSuffix: false });
  const days = (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return { text: `${distance} left`, urgent: days <= 7 };
}
