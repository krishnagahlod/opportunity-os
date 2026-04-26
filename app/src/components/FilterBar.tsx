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
export type SortMode = "relevance" | "deadline" | "newest";

export type FilterState = {
  q: string;
  categories: OpportunityCategory[];
  sources: string[];
  deadline: DeadlineWindow;
  remote: boolean;
  sort: SortMode;
};

export const DEFAULT_FILTERS: FilterState = {
  q: "",
  categories: [],
  sources: [],
  deadline: "any",
  remote: false,
  sort: "relevance",
};

const DEADLINE_LABELS: Record<DeadlineWindow, string> = {
  any: "Any deadline",
  week: "Closing this week",
  month: "Closing this month",
};

const SORT_LABELS: Record<SortMode, string> = {
  relevance: "Best fit",
  deadline: "Closing soon",
  newest: "Newest",
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

  function clearAll() {
    setState(DEFAULT_FILTERS);
  }

  return (
    <div className="space-y-2.5">
      {/* Main control row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={searchId}
            type="search"
            value={state.q}
            onChange={(e) => patch({ q: e.target.value })}
            placeholder="Search title, org, tag…"
            className="h-8 pl-8 text-sm"
            aria-label="Search opportunities"
          />
          {state.q && (
            <button
              type="button"
              onClick={() => patch({ q: "" })}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

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
          className="gap-1.5"
        >
          <Wifi className="size-3.5" />
          Remote
        </Button>

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

      {/* Active chips + clear */}
      {hasActive && (
        <div className="flex flex-wrap items-center gap-1.5">
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
          {state.remote && (
            <Chip
              label="Remote only"
              type="Mode"
              onRemove={() => patch({ remote: false })}
            />
          )}
          {state.q && (
            <Chip
              label={`"${state.q}"`}
              type="Search"
              onRemove={() => patch({ q: "" })}
            />
          )}
          <button
            type="button"
            onClick={clearAll}
            className="ml-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Clear all
          </button>
          <span
            className="ml-auto text-[11px] tabular-nums text-muted-foreground/70"
            aria-live="polite"
          >
            {filteredCount} / {totalCount}
          </span>
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
