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

export function StatsStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => {
        const Icon = ICONS[s.icon];
        return (
          <div
            key={s.label}
            className="group relative overflow-hidden rounded-xl border border-border/70 bg-card px-4 py-3 transition hover:border-border"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                {s.label}
              </p>
              <Icon
                className={cn(
                  "size-4",
                  s.tone === "warn"
                    ? "text-amber-500"
                    : "text-muted-foreground/60",
                )}
              />
            </div>
            <p
              className={cn(
                "mt-2 text-2xl font-semibold tabular-nums tracking-tight",
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
