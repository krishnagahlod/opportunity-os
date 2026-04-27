"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { OpportunityCard } from "@/components/OpportunityCard";
import { CategoryStacks } from "@/components/CategoryStacks";
import { FeaturedRow } from "@/components/FeaturedRow";
import { CATEGORY_META } from "@/lib/categories";
import {
  DEFAULT_FILTERS,
  FilterBar,
  type FilterState,
  type SortMode,
} from "@/components/FilterBar";
import { CATEGORIES } from "@/lib/ai/prompts";
import type {
  ApplicationStatus,
  Opportunity,
  OpportunityCategory,
} from "@/types/db";

export function FilteredFeed({
  opportunities,
  scoreMap,
  savedSet,
  appliedMap,
  sourceMap,
  matchMap,
}: {
  opportunities: Opportunity[];
  // Plain object for client-side serialization friendliness.
  scoreMap: Record<string, { score: number; why: string | null }>;
  savedSet: string[];
  appliedMap: Record<string, ApplicationStatus>;
  // opportunity_id -> source_name
  sourceMap: Record<string, string>;
  // opportunity_id -> matched user terms (e.g. ["React", "SQL"]). Optional
  // entries are absent when no terms match.
  matchMap: Record<string, string[]>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Hydrate state from URL on first render and on browser nav.
  const [state, setStateInternal] = useState<FilterState>(() =>
    parseFilters(searchParams),
  );

  // Re-sync if user clicks back/forward.
  useEffect(() => {
    setStateInternal(parseFilters(searchParams));
    // We intentionally only listen to the searchParams identity changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Wrap setState so any change writes to URL too.
  const setState = useCallback(
    (next: FilterState) => {
      setStateInternal(next);
      const qs = serializeFilters(next);
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [router],
  );

  // Defer the search query for snappier typing.
  const deferredQ = useDeferredValue(state.q);

  // Available facet values are derived from the current opp pool, not hardcoded.
  // This way the source dropdown only shows sources we actually have data from.
  const availableCategories = useMemo<OpportunityCategory[]>(() => {
    const seen = new Set<string>();
    for (const o of opportunities) seen.add(o.category);
    return CATEGORIES.filter((c) => seen.has(c));
  }, [opportunities]);

  const availableSources = useMemo(() => {
    const seen = new Set<string>();
    for (const o of opportunities) {
      const name = sourceMap[o.id];
      if (name) seen.add(name);
    }
    return Array.from(seen).sort();
  }, [opportunities, sourceMap]);

  // ===== filter + sort =====
  const filtered = useMemo(() => {
    const q = deferredQ.trim().toLowerCase();
    const catSet = new Set(state.categories);
    const srcSet = new Set(state.sources);
    const now = Date.now();

    return opportunities.filter((o) => {
      if (catSet.size > 0 && !catSet.has(o.category)) return false;

      if (srcSet.size > 0) {
        const name = sourceMap[o.id];
        if (!name || !srcSet.has(name)) return false;
      }

      if (state.remote && !o.is_remote) return false;

      if (state.deadline !== "any") {
        if (!o.deadline) return false;
        const days = differenceInDays(parseISO(o.deadline), now);
        if (days < 0) return false;
        if (state.deadline === "week" && days > 7) return false;
        if (state.deadline === "month" && days > 30) return false;
      }

      if (q) {
        const hay = [
          o.title,
          o.organization,
          o.summary ?? "",
          (o.tags ?? []).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [opportunities, deferredQ, state, sourceMap]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (state.sort) {
      case "deadline":
        arr.sort(byDeadlineAsc);
        break;
      case "newest":
        arr.sort(byDateAddedDesc);
        break;
      case "relevance":
      default:
        arr.sort(byScoreDesc(scoreMap));
        break;
    }
    return arr;
  }, [filtered, state.sort, scoreMap]);

  const savedSetMemo = useMemo(() => new Set(savedSet), [savedSet]);

  // Show category stacks as the entry view when no filter / search is active.
  // The moment any filter narrows the pool, switch to expandable cards.
  const hasActiveFilter =
    state.q.trim().length > 0 ||
    state.categories.length > 0 ||
    state.sources.length > 0 ||
    state.deadline !== "any" ||
    state.remote;

  // Stack click → set the chosen category as the only category filter.
  const onPickCategory = useCallback(
    (cat: OpportunityCategory) => {
      setState({ ...state, categories: [cat] });
    },
    [setState, state],
  );

  // When viewing a single category, name it for the section header
  const singleCategoryLabel =
    state.categories.length === 1
      ? CATEGORY_META[state.categories[0]]?.label
      : null;

  return (
    <div className="space-y-6">
      <FilterBar
        state={state}
        setState={setState}
        availableCategories={availableCategories}
        availableSources={availableSources}
        totalCount={opportunities.length}
        filteredCount={sorted.length}
      />

      {!hasActiveFilter ? (
        <div className="space-y-10">
          <FeaturedRow
            opportunities={opportunities}
            scoreMap={scoreMap}
            savedSet={savedSetMemo}
            appliedMap={appliedMap}
            matchMap={matchMap}
          />
          <CategoryStacks
            opportunities={opportunities}
            onPick={onPickCategory}
          />
        </div>
      ) : sorted.length === 0 ? (
        <NoResults onClear={() => setState(DEFAULT_FILTERS)} />
      ) : (
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setState(DEFAULT_FILTERS)}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              All categories
            </button>
            <h2 className="text-sm font-semibold tracking-tight">
              {singleCategoryLabel
                ? `${singleCategoryLabel} (${sorted.length})`
                : `${sorted.length} matching`}
            </h2>
          </div>
          <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((opp, i) => (
              <div
                key={opp.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 11) * 30}ms` }}
              >
                <OpportunityCard
                  opportunity={opp}
                  isSaved={savedSetMemo.has(opp.id)}
                  applicationStatus={appliedMap[opp.id]}
                  matchedTerms={matchMap[opp.id]}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-10 text-center">
      <p className="text-sm font-medium">No opportunities match these filters.</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Try widening the deadline window or clearing categories.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-4 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
      >
        Clear all filters
      </button>
    </div>
  );
}

/* ============ URL <-> state ============ */

function parseFilters(sp: URLSearchParams | ReturnType<typeof useSearchParams>): FilterState {
  const get = (k: string) => sp.get?.(k) ?? null;
  const cat = (get("cat") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as OpportunityCategory[];
  const src = (get("src") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const deadline = (get("deadline") ?? "any") as FilterState["deadline"];
  const sort = (get("sort") ?? "relevance") as SortMode;
  return {
    q: get("q") ?? "",
    categories: cat.filter((c) => (CATEGORIES as readonly string[]).includes(c)),
    sources: src,
    deadline:
      deadline === "week" || deadline === "month" ? deadline : "any",
    remote: get("remote") === "1",
    sort: sort === "deadline" || sort === "newest" ? sort : "relevance",
  };
}

function serializeFilters(s: FilterState): string {
  const p = new URLSearchParams();
  if (s.q) p.set("q", s.q);
  if (s.categories.length) p.set("cat", s.categories.join(","));
  if (s.sources.length) p.set("src", s.sources.join(","));
  if (s.deadline !== "any") p.set("deadline", s.deadline);
  if (s.remote) p.set("remote", "1");
  if (s.sort !== "relevance") p.set("sort", s.sort);
  return p.toString();
}

/* ============ Sort comparators ============ */

function byScoreDesc(
  scoreMap: Record<string, { score: number; why: string | null }>,
) {
  return (a: Opportunity, b: Opportunity) =>
    (scoreMap[b.id]?.score ?? 0) - (scoreMap[a.id]?.score ?? 0);
}

function byDeadlineAsc(a: Opportunity, b: Opportunity) {
  // Items without deadlines sort to the end.
  const ta = a.deadline ? parseISO(a.deadline).getTime() : Infinity;
  const tb = b.deadline ? parseISO(b.deadline).getTime() : Infinity;
  return ta - tb;
}

function byDateAddedDesc(a: Opportunity, b: Opportunity) {
  return parseISO(b.date_added).getTime() - parseISO(a.date_added).getTime();
}
