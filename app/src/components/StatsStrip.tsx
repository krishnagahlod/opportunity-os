import { Bookmark, Briefcase, Clock4, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Stat = {
  label: string;
  value: number | string;
  icon: "feed" | "urgent" | "saved" | "applied";
  tone?: "default" | "warn";
};

const ICONS = {
  feed: Briefcase,
  urgent: Clock4,
  saved: Bookmark,
  applied: Star,
};

const ICON_TINTS = {
  feed: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300",
  urgent: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300",
  saved: "bg-rose-500/10 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300",
  applied: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300",
};

export function StatsStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => {
        const Icon = ICONS[s.icon];
        return (
          <div
            key={s.label}
            className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-md"
          >
            {/* Subtle gradient wash for depth */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/30" />

            <div className="relative flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                {s.label}
              </p>
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg",
                  ICON_TINTS[s.icon],
                )}
              >
                <Icon className="size-3.5" />
              </span>
            </div>
            <p
              className={cn(
                "relative mt-3 text-[28px] font-semibold leading-none tabular-nums tracking-tight",
                s.tone === "warn" && "text-amber-600 dark:text-amber-300",
              )}
            >
              {s.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
