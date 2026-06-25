"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, TrendingUp, ShieldAlert, Activity, BarChart2 } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import type { Opportunity } from "@/types/db";

import { MissingSkillChip } from "./MissingSkillChip";

function ProgressBar({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-muted-foreground uppercase tracking-wider">{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
        <div
          className={cn("h-full rounded-full transition-all duration-1000", colorClass)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function EnrichmentInsights({ opportunity, missingSkills = [] }: { opportunity: Opportunity, missingSkills?: string[] }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [isEnriching, setIsEnriching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const hasInsights = opportunity.effort_score !== null && opportunity.effort_score !== undefined;

  const handleEnrich = async () => {
    setIsEnriching(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunity_id: opportunity.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to analyze opportunity");
      }

      startTransition(() => {
        router.refresh(); // Trigger server-side re-render to get the new fields
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <div className="space-y-6 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <Sparkles className="size-4.5 text-primary" />
        <h3 className="text-sm font-semibold tracking-tight">Decision Intelligence</h3>
      </div>

      {/* Missing Skills Section */}
      {missingSkills.length > 0 && (
        <div className="rounded-lg bg-muted/30 p-4 border border-border/40">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Missing Requirements
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {missingSkills.map((t) => (
              <MissingSkillChip key={t} skill={t} />
            ))}
          </div>
        </div>
      )}

      {/* Unlock Button if not enriched */}
      {!hasInsights && (
        <div className="rounded-xl border border-dashed border-border/70 bg-card/30 p-6 text-center">
          <Activity className="mx-auto mb-3 size-6 text-muted-foreground/60" />
          <h3 className="mb-1 text-sm font-semibold tracking-tight">Unlock Effort & Red Flags</h3>
          <p className="mb-4 text-xs text-muted-foreground max-w-[280px] mx-auto">
            Use AI to estimate application effort, competition intensity, and identify potential red flags.
          </p>
          <Button
            onClick={handleEnrich}
            disabled={isEnriching || isPending}
            variant="outline"
            size="sm"
            className="rounded-full bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
          >
            {(isEnriching || isPending) && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            Analyze Opportunity
          </Button>
          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
        </div>
      )}

      {/* Deep Factors if enriched */}
      {hasInsights && (
        <div className="grid gap-6 sm:grid-cols-2 mt-4">
          <ProgressBar
            label="Application Effort"
            value={opportunity.effort_score || 0}
            colorClass={
              (opportunity.effort_score || 0) > 70 ? "bg-amber-500" : "bg-emerald-500"
            }
          />
          <ProgressBar
            label="Competition Intensity"
            value={opportunity.competition_intensity || 0}
            colorClass={
              (opportunity.competition_intensity || 0) > 80 ? "bg-red-500" : "bg-emerald-500"
            }
          />
          <ProgressBar
            label="Career Upside"
            value={opportunity.upside_score || 0}
            colorClass="bg-blue-500"
          />
          <ProgressBar
            label="Legitimacy Score"
            value={opportunity.legitimacy_score || 0}
            colorClass="bg-indigo-500"
          />
        </div>
      )}

      {hasInsights && opportunity.action_plan && (
        <div className="mt-4 rounded-lg bg-muted/30 p-4 border border-border/40">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Activity className="size-3.5" /> Action Plan
          </h4>
          <p className="text-sm leading-relaxed text-foreground/80">{opportunity.action_plan}</p>
        </div>
      )}

      {hasInsights && opportunity.red_flags && opportunity.red_flags.length > 0 && (
        <div className="mt-2 rounded-lg bg-destructive/5 p-4 border border-destructive/10">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-destructive flex items-center gap-1.5">
            <ShieldAlert className="size-3.5" /> Potential Red Flags
          </h4>
          <ul className="list-disc pl-4 space-y-1 text-sm text-destructive/80">
            {opportunity.red_flags.map((flag, idx) => (
              <li key={idx}>{flag}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
