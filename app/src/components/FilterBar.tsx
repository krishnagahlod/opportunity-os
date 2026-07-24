"use client";

import { useId } from "react";
import {
  Check,
  ChevronDown,
  Search,
  Wifi,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CATEGORY_META } from "@/lib/categories";
import type { OpportunityCategory } from "@/types/db";

export type DeadlineWindow = "any" | "week" | "month";
export type FreshnessWindow = "any" | "today" | "week";
export type SortMode = "relevance" | "deadline" | "newest" | "value";

export type FilterState = {
  q: string;
  categories: OpportunityCategory[];
  sources: string[];
  deadline: DeadlineWindow;
  freshness: FreshnessWindow;
  difficulty: string[];
  remote: boolean;
  paidOnly: boolean;
  sort: SortMode;
};

export const DEFAULT_FILTERS: FilterState = {
  q: "",
  categories: [],
  sources: [],
  deadline: "any",
  freshness: "any",
  difficulty: [],
  remote: false,
  paidOnly: false,
  sort: "relevance",
};

const DEADLINE_LABELS: Record<DeadlineWindow, string> = {
  any: "Any deadline",
  week: "Closing this week",
  month: "Closing this month",
};

const FRESHNESS_LABELS: Record<FreshnessWindow, string> = {
  any: "Any time",
  today: "Past 24 hours",
  week: "Past week",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  low: "Beginner Friendly",
  medium: "Intermediate",
  high: "Advanced",
};

const SORT_LABELS: Record<SortMode, string> = {
  relevance: "Best fit",
  deadline: "Closing soon",
  newest: "Newest",
  value: "Highest Value",
};

export function FilterBar({
  state,
  setState,
  availableCategories,
  availableSources,
  totalCount,
  filteredCount,
}: {
  state: FilterState;
  setState: (next: FilterState) => void;
  availableCategories: OpportunityCategory[];
  availableSources: string[];
  totalCount: number;
  filteredCount: number;
}) {
  const searchId = useId();
  const hasActive =
    state.q.length > 0 ||
    state.categories.length > 0 ||
    state.sources.length > 0 ||
    state.deadline !== "any" ||
    state.remote;

  function patch(p: Partial<FilterState>) {
    setState({ ...state, ...p });
  }

  function toggleCategory(cat: OpportunityCategory) {
    const next = state.categories.includes(cat)
      ? state.categories.filter((c) => c !== cat)
      : [...state.categories, cat];
    patch({ categories: next });
  }

  function toggleSource(src: string) {
    const next = state.sources.includes(src)
      ? state.sources.filter((s) => s !== src)
      : [...state.sources, src];
    patch({ sources: next });
  }

  function toggleDifficulty(diff: string) {
    const next = state.difficulty.includes(diff)
      ? state.difficulty.filter((d) => d !== diff)
      : [...state.difficulty, diff];
    patch({ difficulty: next });
  }

  function clearAll() {
    setState(DEFAULT_FILTERS);
  }

  return (
    <div className="sticky top-[84px] z-30 mx-auto w-full max-w-4xl animate-float-in mb-8">
      <div className="flex flex-col sm:flex-row items-center gap-2 rounded-[2rem] border border-white/10 dark:border-white/5 bg-background/50 p-2 shadow-elevated backdrop-blur-3xl">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-[300px] shrink-0">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground/50" />
          <Input
            id={searchId}
            type="search"
            value={state.q}
            onChange={(e) => patch({ q: e.target.value })}
            placeholder="Search opportunities..."
            className="h-10 w-full rounded-full border-transparent bg-foreground/5 pl-10 pr-10 text-[14px] shadow-none transition focus-visible:border-primary/50 focus-visible:bg-foreground/10 focus-visible:ring-0"
            aria-label="Search opportunities"
          />
          {state.q && (
            <button
              type="button"
              onClick={() => patch({ q: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-foreground/50 transition hover:bg-foreground/10 hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filter row — pill-style buttons */}
        <div className="flex w-full flex-1 flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar sm:flex-nowrap">
        {/* Category multi-select */}
        <FilterDropdown
          label="Category"
          activeCount={state.categories.length}
          render={() =>
            availableCategories.map((cat) => {
              const meta = CATEGORY_META[cat];
              const Icon = meta?.Icon;
              const checked = state.categories.includes(cat);
              return (
                <DropdownMenuItem
                  key={cat}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleCategory(cat);
                  }}
                  closeOnClick={false}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">
                    {Icon && <Icon className="size-3.5 opacity-70" />}
                    {meta?.label ?? cat}
                  </span>
                  {checked && <Check className="size-3.5 text-primary" />}
                </DropdownMenuItem>
              );
            })
          }
        />

        {/* Source multi-select */}
        <FilterDropdown
          label="Source"
          activeCount={state.sources.length}
          render={() =>
            availableSources.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                No sources yet
              </p>
            ) : (
              availableSources.map((src) => {
                const checked = state.sources.includes(src);
                return (
                  <DropdownMenuItem
                    key={src}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleSource(src);
                    }}
                    closeOnClick={false}
                    className="justify-between"
                  >
                    <span className="truncate pr-2">{src}</span>
                    {checked && <Check className="size-3.5 text-primary" />}
                  </DropdownMenuItem>
                );
              })
            )
          }
        />

        {/* Deadline single-select */}
        <FilterDropdown
          label="Deadline"
          activeLabel={
            state.deadline !== "any" ? DEADLINE_LABELS[state.deadline] : undefined
          }
          render={() =>
            (Object.keys(DEADLINE_LABELS) as DeadlineWindow[]).map((d) => (
              <DropdownMenuItem
                key={d}
                onClick={() => patch({ deadline: d })}
                className="justify-between"
              >
                {DEADLINE_LABELS[d]}
                {state.deadline === d && (
                  <Check className="size-3.5 text-primary" />
                )}
              </DropdownMenuItem>
            ))
          }
        />

        {/* Remote toggle */}
        <Button
          type="button"
          variant={state.remote ? "default" : "outline"}
          size="sm"
          onClick={() => patch({ remote: !state.remote })}
          aria-pressed={state.remote}
          className="gap-1.5 shrink-0"
        >
          <Wifi className="size-3.5" />
          Remote
        </Button>

        {/* Paid toggle */}
        <Button
          type="button"
          variant={state.paidOnly ? "default" : "outline"}
          size="sm"
          onClick={() => patch({ paidOnly: !state.paidOnly })}
          aria-pressed={state.paidOnly}
          className="gap-1.5 shrink-0"
        >
          <span>$</span>
          Paid
        </Button>

        {/* Difficulty multi-select */}
        <FilterDropdown
          label="Difficulty"
          activeCount={state.difficulty.length}
          render={() =>
            Object.keys(DIFFICULTY_LABELS).map((diff) => {
              const checked = state.difficulty.includes(diff);
              return (
                <DropdownMenuItem
                  key={diff}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDifficulty(diff);
                  }}
                  closeOnClick={false}
                  className="justify-between"
                >
                  <span>{DIFFICULTY_LABELS[diff]}</span>
                  {checked && <Check className="size-3.5 text-primary" />}
                </DropdownMenuItem>
              );
            })
          }
        />

        {/* Freshness single-select */}
        <FilterDropdown
          label="Posted"
          activeLabel={
            state.freshness !== "any" ? FRESHNESS_LABELS[state.freshness] : undefined
          }
          render={() =>
            (Object.keys(FRESHNESS_LABELS) as FreshnessWindow[]).map((f) => (
              <DropdownMenuItem
                key={f}
                onClick={() => patch({ freshness: f })}
                className="justify-between"
              >
                {FRESHNESS_LABELS[f]}
                {state.freshness === f && (
                  <Check className="size-3.5 text-primary" />
                )}
              </DropdownMenuItem>
            ))
          }
        />

        {/* Spacer pushes sort to far right on desktop */}
        <div className="hidden flex-1 sm:block" />

        {/* Sort */}
        <FilterDropdown
          label="Sort"
          activeLabel={SORT_LABELS[state.sort]}
          alwaysShowLabel
          render={() =>
            (Object.keys(SORT_LABELS) as SortMode[]).map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => patch({ sort: s })}
                className="justify-between"
              >
                {SORT_LABELS[s]}
                {state.sort === s && <Check className="size-3.5 text-primary" />}
              </DropdownMenuItem>
            ))
          }
        />
        </div>
      </div>

      {/* Active chips + clear */}
      {hasActive && (
        <div className="mx-2 flex flex-wrap items-center gap-1.5 rounded-b-2xl border border-t-0 border-white/10 dark:border-white/5 bg-background/50 p-2 shadow-elevated backdrop-blur-3xl">
          {state.categories.map((cat) => (
            <Chip
              key={`cat-${cat}`}
              label={CATEGORY_META[cat]?.label ?? cat}
              type="Category"
              onRemove={() => toggleCategory(cat)}
            />
          ))}
          {state.sources.map((src) => (
            <Chip
              key={`src-${src}`}
              label={src}
              type="Source"
              onRemove={() => toggleSource(src)}
            />
          ))}
          {state.deadline !== "any" && (
            <Chip
              label={DEADLINE_LABELS[state.deadline]}
              type="Deadline"
              onRemove={() => patch({ deadline: "any" })}
            />
          )}
          {state.freshness !== "any" && (
            <Chip
              label={FRESHNESS_LABELS[state.freshness]}
              type="Posted"
              onRemove={() => patch({ freshness: "any" })}
            />
          )}
          {state.difficulty.map((diff) => (
            <Chip
              key={`diff-${diff}`}
              label={DIFFICULTY_LABELS[diff]}
              type="Difficulty"
              onRemove={() => toggleDifficulty(diff)}
            />
          ))}
          {state.remote && (
            <Chip
              label="Remote only"
              type="Mode"
              onRemove={() => patch({ remote: false })}
            />
          )}
          {state.paidOnly && (
            <Chip
              label="Paid only"
              type="Comp"
              onRemove={() => patch({ paidOnly: false })}
            />
          )}
          <div className="ml-auto flex items-center gap-3 pl-2 pr-4 text-xs font-medium text-foreground/60 shrink-0">
            <span className="hidden sm:inline">
              <span className="text-foreground">{filteredCount}</span>{" "}
              {filteredCount === 1 ? "match" : "matches"}
            </span>
            
            {hasActive && (
              <button
                onClick={clearAll}
                className="text-muted-foreground transition hover:text-foreground flex items-center gap-1"
                aria-label="Clear all filters"
              >
                <X className="size-3" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>
      )}
      </div>
  );
}

/* ============ Internals ============ */

function FilterDropdown({
  label,
  activeCount,
  activeLabel,
  alwaysShowLabel,
  render,
}: {
  label: string;
  activeCount?: number;
  activeLabel?: string;
  alwaysShowLabel?: boolean;
  render: () => React.ReactNode;
}) {
  const isActive = (activeCount ?? 0) > 0 || !!activeLabel;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={isActive ? "secondary" : "outline"}
            size="sm"
            className="gap-1.5"
          >
            <span>{label}</span>
            {activeCount && activeCount > 0 ? (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {activeCount}
              </span>
            ) : alwaysShowLabel && activeLabel ? (
              <span className="text-muted-foreground">· {activeLabel}</span>
            ) : null}
            <ChevronDown className="size-3 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="min-w-[180px] max-h-[320px]">
        {render()}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Chip({
  label,
  type,
  onRemove,
}: {
  label: string;
  type: string;
  onRemove: () => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[1px] rounded-md text-[11px] font-medium",
        "animate-in fade-in slide-in-from-left-1 duration-150",
      )}
    >
      <span className="rounded-l-md bg-muted px-1.5 py-1 text-muted-foreground">
        {type}
      </span>
      <span className="bg-muted px-1.5 py-1 text-foreground/85">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${type} filter ${label}`}
        className="rounded-r-md bg-muted px-1.5 py-1 text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
      >
        <X className="size-2.5" />
      </button>
    </span>
  );
}
