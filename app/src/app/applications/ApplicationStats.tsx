import { Activity, Send, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/types/db";

type Item = {
  status: ApplicationStatus;
  updated_at: string;
};

/**
 * KPI strip above the kanban. Computes everything from data the page already
 * has — no extra DB hit. Surfaces info that's *not* visible from glancing at
 * the kanban (totals, time-windowed counts, response rate) so the strip
 * earns its space.
 *
 *   - Active pipeline = saved + applied + interviewing (not-yet-decided)
 *   - This month = touched in the last 30 days (proxy for engagement velocity)
 *   - Wins = won (the goal — celebratory accent)
 *   - Response rate = (interviewing + rejected + won) / (applied + above)
 *     Hidden until the user has at least 5 applied items so it isn't noisy
 *     on tiny samples.
 */
export function ApplicationStats({ items }: { items: Item[] }) {
  const stats = computeStats(items);

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        label="Active pipeline"
        value={stats.active}
        hint="saved · applied · interviewing"
        icon={<Activity className="size-3.5" />}
      />
      <StatCard
        label="This month"
        value={stats.thisMonth}
        hint="updated in last 30 days"
        icon={<Send className="size-3.5" />}
      />
      <StatCard
        label="Wins"
        value={stats.wins}
        hint="offers received"
        icon={<Trophy className="size-3.5" />}
        accent="emerald"
      />
      {stats.responseRate !== null ? (
        <StatCard
          label="Response rate"
          value={`${stats.responseRate}%`}
          hint={`${stats.responseTotal} of ${stats.appliedTotal} applied`}
          icon={<Sparkles className="size-3.5" />}
          accent="primary"
        />
      ) : (
        <StatCard
          label="Total tracked"
          value={stats.total}
          hint="across all stages"
          icon={<Sparkles className="size-3.5" />}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  hint: string;
  icon: React.ReactNode;
  accent?: "emerald" | "primary";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 shadow-card transition",
        "card-hover-lift",
        accent === "emerald" && "border-emerald-500/30 bg-emerald-500/[0.04]",
        accent === "primary" && "border-primary/30 bg-primary/[0.04]",
        !accent && "border-border/70",
      )}
    >
      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        <span
          className={cn(
            "inline-flex size-5 items-center justify-center rounded-md bg-muted text-muted-foreground",
            accent === "emerald" &&
              "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
            accent === "primary" && "bg-primary/15 text-primary",
          )}
        >
          {icon}
        </span>
        {label}
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl",
          accent === "emerald" && "text-emerald-700 dark:text-emerald-300",
          accent === "primary" && "text-primary",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground/80">{hint}</p>
    </div>
  );
}

function computeStats(items: Item[]) {
  const byStatus: Record<ApplicationStatus, number> = {
    saved: 0,
    applied: 0,
    interviewing: 0,
    rejected: 0,
    won: 0,
  };
  for (const i of items) {
    byStatus[i.status] = (byStatus[i.status] ?? 0) + 1;
  }

  const active = byStatus.saved + byStatus.applied + byStatus.interviewing;
  const wins = byStatus.won;

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const thisMonth = items.filter(
    (i) => new Date(i.updated_at).getTime() > thirtyDaysAgo,
  ).length;

  // Response rate: of all post-apply items, how many got any response
  // (interview / rejection / offer). "applied" status = sent but no response yet.
  const appliedTotal =
    byStatus.applied + byStatus.interviewing + byStatus.rejected + byStatus.won;
  const responseTotal = byStatus.interviewing + byStatus.rejected + byStatus.won;
  const responseRate =
    appliedTotal >= 5
      ? Math.round((100 * responseTotal) / appliedTotal)
      : null;

  return {
    total: items.length,
    active,
    wins,
    thisMonth,
    appliedTotal,
    responseTotal,
    responseRate,
  };
}
