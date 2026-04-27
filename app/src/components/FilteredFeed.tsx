"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
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

type SearchPayload = {
  opportunities: Opportunity[];
  scoreMap: Record<string, { score: number; why: string | null }>;
  matchMap: Record<string, string[]>;
  sourceMap: Record<string, string>;
  savedSet: string[];
  appliedMap: Record<string, ApplicationStatus>;
};

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

  /* ===== Server-side full-text search =================================
   * When state.q has at least 2 chars we hit /api/search (debounced) which
   * runs a Postgres tsvector query against the WHOLE opportunities table.
   * The result replaces the in-memory pool below; other filters (category,
   * source, etc.) still apply on top. The dashboard's pre-rendered 120-row
   * pool stays as the "browse" view for empty-search.
   * ==================================================================== */
  const [debouncedQ, setDebouncedQ] = useState(state.q);
  const [searchPayload, setSearchPayload] = useState<SearchPayload | null>(null);
  const [searchPending, setSearchPending] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Debounce typed input so we don't fire a request on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(state.q), 250);
    return () => clearTimeout(timer);
  }, [state.q]);

  // Fetch search results when the debounced query crosses the 2-char threshold.
  // AbortController cancels in-flight requests on rapid retyping.
  useEffect(() => {
    const q = debouncedQ.trim();
    if (q.length < 2) {
      setSearchPayload(null);
      setSearchPending(false);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    setSearchPending(true);
    setSearchError(null);
    fetch(`/api/search?q=${encodeURIComponent(q)}`, {
      signal: controller.signal,
    })
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(`Search failed (${r.status})`)),
      )
      .then((data: SearchPayload) => {
        setSearchPayload(data);
        setSearchPending(false);
      })
      .catch((e: Error) => {
        if (e.name === "AbortError") return;
        setSearchError(e.message);
        setSearchPending(false);
      });

    return () => controller.abort();
  }, [debouncedQ]);

  const inSearchMode = debouncedQ.trim().length >= 2;

  // When in search mode we use the API payload as the source of truth.
  // Outside search mode the server-rendered props are authoritative.
  const sourcePool: Opportunity[] =
    inSearchMode && searchPayload ? searchPayload.opportunities : opportunities;

  const effectiveScoreMap = useMemo(() => {
    if (inSearchMode && searchPayload) return searchPayload.scoreMap;
    return scoreMap;
  }, [inSearchMode, searchPayload, scoreMap]);

  const effectiveMatchMap = useMemo(() => {
    if (inSearchMode && searchPayload) return searchPayload.matchMap;
    return matchMap;
  }, [inSearchMode, searchPayload, matchMap]);

  const effectiveSourceMap = useMemo(() => {
    if (!inSearchMode || !searchPayload) return sourceMap;
    return { ...sourceMap, ...searchPayload.sourceMap };
  }, [inSearchMode, searchPayload, sourceMap]);

  const effectiveSavedSet = useMemo(() => {
    const base = new Set(savedSet);
    if (inSearchMode && searchPayload) {
      for (const id of searchPayload.savedSet) base.add(id);
    }
    return base;
  }, [savedSet, inSearchMode, searchPayload]);

  const effectiveAppliedMap = useMemo(() => {
    if (!inSearchMode || !searchPayload) return appliedMap;
    return { ...appliedMap, ...searchPayload.appliedMap };
  }, [appliedMap, inSearchMode, searchPayload]);

  // Available facet values are derived from the unfiltered pool — keep the
  // dropdowns stable across search input so the UI doesn't flicker.
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

  // ===== local filter + sort over the active pool =====
  const filtered = useMemo(() => {
    const catSet = new Set(state.categories);
    const srcSet = new Set(state.sources);
    const now = Date.now();
    const localQ = inSearchMode ? "" : state.q.trim().toLowerCase();

    return sourcePool.filter((o) => {
      if (catSet.size > 0 && !catSet.has(o.category)) return false;

      if (srcSet.size > 0) {
        const name = effectiveSourceMap[o.id];
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

      // Browse-mode: substring match over title/org/summary/tags.
      // Search-mode: server already filtered with stemming + word-boundary,
      // so we skip the local q filter (otherwise "interns" wouldn't match
      // "internship" results from the server).
      if (localQ) {
        const hay = [
          o.title,
          o.organization,
          o.summary ?? "",
          (o.tags ?? []).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(localQ)) return false;
      }

      return true;
    });
  }, [sourcePool, state, effectiveSourceMap, inSearchMode]);

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
        arr.sort(byScoreDesc(effectiveScoreMap));
        break;
    }
    return arr;
  }, [filtered, state.sort, effectiveScoreMap]);

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

  // The total-count badge in FilterBar should reflect what the user is
  // searching across — the server-fed pool in browse, or the search-result
  // candidate set in search mode.
  const totalCount = inSearchMode
    ? searchPayload?.opportunities.length ?? 0
    : opportunities.length;

  return (
    <div className="space-y-6">
      <FilterBar
        state={state}
        setState={setState}
        availableCategories={availableCategories}
        availableSources={availableSources}
        totalCount={totalCount}
        filteredCount={sorted.length}
      />

      {!hasActiveFilter ? (
        <div className="space-y-10">
          <FeaturedRow
            opportunities={opportunities}
            scoreMap={scoreMap}
            savedSet={effectiveSavedSet}
            appliedMap={appliedMap}
            matchMap={matchMap}
          />
          <CategoryStacks
            opportunities={opportunities}
            onPick={onPickCategory}
          />
        </div>
      ) : searchPending && !searchPayload ? (
        <SearchSpinner query={debouncedQ} />
      ) : searchError ? (
        <SearchError message={searchError} />
      ) : sorted.length === 0 ? (
        <NoResults
          inSearchMode={inSearchMode}
          query={debouncedQ}
          onClear={() => setState(DEFAULT_FILTERS)}
        />
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
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight">
              {searchPending && (
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              )}
              {inSearchMode
                ? `${sorted.length} match${sorted.length === 1 ? "" : "es"} for "${debouncedQ}"`
                : singleCategoryLabel
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
                  isSaved={effectiveSavedSet.has(opp.id)}
                  applicationStatus={effectiveAppliedMap[opp.id]}
                  matchedTerms={effectiveMatchMap[opp.id]}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SearchSpinner({ query }: { query: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-card/40 px-6 py-10 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      Searching for &ldquo;{query}&rdquo;…
    </div>
  );
}

function SearchError({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      Search failed: {message}
    </div>
  );
}

function NoResults({
  inSearchMode,
  query,
  onClear,
}: {
  inSearchMode: boolean;
  query: string;
  onClear: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-10 text-center">
      <p className="text-sm font-medium">
        {inSearchMode
          ? `No opportunities match "${query}".`
          : "No opportunities match these filters."}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {inSearchMode
          ? "Try a broader phrase or clear the filters below."
          : "Try widening the deadline window or clearing categories."}
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
