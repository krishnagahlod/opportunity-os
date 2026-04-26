import { Clock } from "lucide-react";
import { formatDistanceToNowStrict, isPast, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Standard deadline label for cards. Shows:
 *   • Closed (past) — destructive
 *   • ≤7d remaining — amber
 *   • >7d remaining — muted
 *   • no deadline — "Rolling"
 */
export function DeadlineLabel({ deadline }: { deadline: string | null }) {
  if (!deadline) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="size-3" /> Rolling
      </span>
    );
  }

  const date = parseISO(deadline);
  if (isPast(date)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
        <Clock className="size-3" /> Closed
      </span>
    );
  }

  const distance = formatDistanceToNowStrict(date, { addSuffix: false });
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

/**
 * Compact dot variant for dense surfaces (Kanban cards, list rows).
 * Only renders when deadline is in the future and within 30d.
 */
export function UrgencyDot({ deadline }: { deadline: string | null }) {
  if (!deadline) return null;
  const date = parseISO(deadline);
  if (isPast(date)) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold tabular-nums text-destructive">
        <span className="size-1.5 rounded-full bg-destructive" />
        Closed
      </span>
    );
  }
  const days = Math.max(
    0,
    Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
  if (days > 30) return null;
  const urgent = days <= 7;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold tabular-nums",
        urgent
          ? "text-amber-600 dark:text-amber-300"
          : "text-muted-foreground",
      )}
      title={`${days} days until deadline`}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          urgent ? "bg-amber-500" : "bg-muted-foreground/40",
        )}
      />
      {days}d left
    </span>
  );
}
