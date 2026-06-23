"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_META, getCategoryStyle } from "@/lib/categories";
import type { Opportunity, OpportunityCategory } from "@/types/db";

type Stack = {
  category: OpportunityCategory;
  count: number;
};

/**
 * Entry view for the dashboard: opportunities grouped into category "stacks".
 * Each stack is rendered as a deck (3 layered cards) and clicking it filters
 * the feed to that category.
 *
 * Empty categories are hidden — the grid only shows what we have data for.
 */
export function CategoryStacks({
  opportunities,
  onPick,
}: {
  opportunities: Opportunity[];
  onPick: (cat: OpportunityCategory) => void;
}) {
  const stacks = buildStacks(opportunities);
  if (stacks.length === 0) return null;

  return (
    <div>
      <header className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight">
          Browse by category
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {opportunities.length} opportunities across {stacks.length}{" "}
          {stacks.length === 1 ? "category" : "categories"}.
        </p>
      </header>
      <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stacks.map((s) => (
          <CategoryStack key={s.category} stack={s} onPick={onPick} />
        ))}
      </div>
    </div>
  );
}

function CategoryStack({
  stack,
  onPick,
}: {
  stack: Stack;
  onPick: (cat: OpportunityCategory) => void;
}) {
  const cat = getCategoryStyle(stack.category);
  const Icon = cat.Icon;

  return (
    <button
      type="button"
      onClick={() => onPick(stack.category)}
      className="group relative block w-full text-left"
      aria-label={`Open ${cat.label} — ${stack.count} opportunities`}
    >
      {/* Decoration: two stacked cards behind, suggesting a deck */}
      <div
        aria-hidden
        className="absolute inset-0 translate-x-[6px] translate-y-[6px] rounded-2xl border border-border/60 bg-card/40 transition-transform group-hover:translate-x-[8px] group-hover:translate-y-[8px]"
      />
      <div
        aria-hidden
        className="absolute inset-0 translate-x-[3px] translate-y-[3px] rounded-2xl border border-border/70 bg-card/70 transition-transform group-hover:translate-x-[4px] group-hover:translate-y-[4px]"
      />

      {/* Top card — fixed-height to keep the row visually consistent */}
      <div className="relative flex h-full min-h-[170px] flex-col rounded-2xl border border-border bg-card px-5 py-5 shadow-card transition-all group-hover:-translate-y-0.5 group-hover:shadow-elevated">
        <div className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-xl",
              cat.chipBg,
              cat.chipText,
            )}
          >
            <Icon className="size-5" />
          </span>
          <ArrowRight
            aria-hidden
            className="size-4 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-foreground"
          />
        </div>

        <h3 className="mt-5 text-[15.5px] font-semibold tracking-tight">
          {cat.label}
        </h3>

        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="text-[28px] font-semibold leading-none tabular-nums tracking-tight">
            {stack.count}
          </span>
          <span className="text-[11.5px] text-muted-foreground">
            {stack.count === 1 ? "opportunity" : "opportunities"}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ============ helpers ============ */

const PRIORITY: OpportunityCategory[] = [
  "freebie",
  "certification",
  "internship",
  "fulltime",
  "case_competition",
  "hackathon",
  "fellowship",
  "scholarship",
  "remote_gig",
  "conference",
  "workshop",
  "bootcamp",
  "networking",
  "campus_ambassador",
  "other",
];

function buildStacks(opps: Opportunity[]): Stack[] {
  const counts = new Map<OpportunityCategory, number>();
  for (const o of opps) {
    if (!o.category || !(o.category in CATEGORY_META)) continue;
    const c = o.category as OpportunityCategory;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }

  const stacks: Stack[] = [];
  for (const cat of PRIORITY) {
    const count = counts.get(cat) ?? 0;
    // Always render freebie and certification for easy visibility
    if (count === 0 && cat !== "freebie" && cat !== "certification") continue;
    stacks.push({ category: cat, count });
  }
  return stacks;
}
