"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { OpportunityCard } from "@/components/OpportunityCard";
import { OpportunityDrawer } from "@/components/OpportunityDrawer";
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
import {
  DASHBOARD_SCORE_FLOOR,
  isFeedEligible,
} from "@/lib/scoring/eligibility";
import { cn } from "@/lib/utils";
import type {
  ApplicationStatus,
  Opportunity,
  OpportunityCategory,
} from "@/types/db";

type SearchPayload = {
  opportunities: Opportunity[];
  scoreMap: Record<string, { 
    score: number; 
    why: string | null;
    fitScore?: number;
    valueScore?: number;
    actionabilityScore?: number;
  }>;
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
}: {
  opportunities: Opportunity[];
  // Plain object for client-side serialization friendliness.
  scoreMap: Record<string, { 
    score: number; 
    why: string | null;
    fitScore?: number;
    valueScore?: number;
    actionabilityScore?: number;
  }>;
  savedSet: string[];
  appliedMap: Record<string, ApplicationStatus>;
  // opportunity_id -> source_name
  sourceMap: Record<string, string>;
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

  // Track selected opportunity for the client-side side-panel drawer.
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

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
      .then(async (r) => {
        if (!r.ok) {
          // Try to surface the server's actual error message — much more
          // useful than "(500)" for diagnosing what went wrong.
          let detail = "";
          try {
            const body = (await r.json()) as { error?: string };
            if (body?.error) detail = `: ${body.error}`;
          } catch {
            // body wasn't JSON; ignore
          }
          throw new Error(`Search failed (${r.status})${detail}`);
        }
        return r.json() as Promise<SearchPayload>;
      })
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

  // Session-level toggle to reveal sub-floor-score rows when the user is
  // curious. Default off — the floor keeps low-fit noise out of the
  // browse view. Search mode bypasses the floor entirely (user typed a
  // specific query; they want every match).
  const [showLowFit, setShowLowFit] = useState(false);

  // Client-side pagination to prevent freezing the UI when there are hundreds of rows.
  const [visibleCount, setVisibleCount] = useState(100);

  // Reset pagination when filters change so we don't start midway down the new list.
  useEffect(() => {
    setVisibleCount(100);
  }, [state, inSearchMode]);

  // ===== local filter + sort over the active pool =====
  const filtered = useMemo(() => {
    const catSet = new Set(state.categories);
    const srcSet = new Set(state.sources);
    const now = Date.now();
    const localQ = inSearchMode ? "" : state.q.trim().toLowerCase();

    return sourcePool.filter((o) => {
      // Quality gate — confidence floor applies on every surface, including
      // search. Hidden rows still exist in the DB; admin sees them in the
      // Needs-review queue at /admin.
      if (!isFeedEligible(o)) return false;

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

      // Score floor — browse view only. Skip in search mode and when user
      // opts in via the "show low-fit" toggle below the grid.
      if (!inSearchMode && !showLowFit) {
        const score = effectiveScoreMap[o.id]?.score ?? 0;
        if (score < DASHBOARD_SCORE_FLOOR) return false;
      }

      return true;
    });
  }, [
    sourcePool,
    state,
    effectiveSourceMap,
    effectiveScoreMap,
    inSearchMode,
    showLowFit,
  ]);

  // How many rows are hidden purely by the score floor? Drives the toggle
  // label so the user knows whether clicking "show low-fit" will reveal
  // anything new.
  const hiddenLowFitCount = useMemo(() => {
    if (inSearchMode || showLowFit) return 0;
    return sourcePool.filter((o) => {
      if (!isFeedEligible(o)) return false; // confidence-hidden, don't count
      const score = effectiveScoreMap[o.id]?.score ?? 0;
      return score < DASHBOARD_SCORE_FLOOR;
    }).length;
  }, [sourcePool, inSearchMode, showLowFit, effectiveScoreMap]);

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

  // In search mode the server returns up to 150 candidates so the client has
  // enough to rank by personal-fit score. Render only the top 50 — the rest
  // are tail-end matches the user almost never wants to scroll to.
  const SEARCH_DISPLAY_LIMIT = 50;
  const displayed = sorted.slice(0, inSearchMode ? SEARCH_DISPLAY_LIMIT : visibleCount);

  // Smart Grouping for Relevance and Newest sorts
  const groups = useMemo(() => {
    if (state.sort === "relevance") {
      return [
        {
          id: "top",
          label: "Top Matches",
          icon: "✨",
          description: "Best fit for your profile, skills, and goals",
          tone: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
          items: displayed.filter((o) => (effectiveScoreMap[o.id]?.score ?? 0) >= 80),
        },
        {
          id: "good",
          label: "Good Fit",
          icon: "👍",
          description: "Strong matches worth exploring",
          tone: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
          items: displayed.filter((o) => {
            const s = effectiveScoreMap[o.id]?.score ?? 0;
            return s >= 60 && s < 80;
          }),
        },
        {
          id: "explore",
          label: "Explore",
          icon: "🔍",
          description: "Broaden your horizons — less obvious, but could surprise you",
          tone: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
          items: displayed.filter((o) => (effectiveScoreMap[o.id]?.score ?? 0) < 60),
        },
      ].filter((g) => g.items.length > 0);
    } else if (state.sort === "newest") {
      const now = Date.now();
      return [
        {
          id: "today",
          label: "Fresh Today",
          icon: "🔥",
          description: "Just added — be among the first to apply",
          tone: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
          items: displayed.filter((o) => differenceInDays(now, parseISO(o.date_added)) <= 1),
        },
        {
          id: "week",
          label: "This Week",
          icon: "📅",
          description: "Added in the last 7 days",
          tone: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
          items: displayed.filter((o) => {
            const d = differenceInDays(now, parseISO(o.date_added));
            return d > 1 && d <= 7;
          }),
        },
        {
          id: "older",
          label: "Older",
          icon: "🕰️",
          description: "Still active — many still accepting applications",
          tone: "bg-muted text-muted-foreground",
          items: displayed.filter((o) => differenceInDays(now, parseISO(o.date_added)) > 7),
        },
      ].filter((g) => g.items.length > 0);
    } else {
      return [{ id: "all", label: "", icon: "", description: "", tone: "", items: displayed }];
    }
  }, [displayed, state.sort, effectiveScoreMap]);

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
            onSelect={setSelectedOpp}
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
                ? sorted.length > SEARCH_DISPLAY_LIMIT
                  ? `Top ${SEARCH_DISPLAY_LIMIT} of ${sorted.length} matches for "${debouncedQ}" · ranked by best fit`
                  : `${sorted.length} match${sorted.length === 1 ? "" : "es"} for "${debouncedQ}"`
                : singleCategoryLabel
                  ? `${singleCategoryLabel} (${sorted.length})`
                  : `${sorted.length} matching`}
            </h2>
          </div>
          
          <div className="space-y-8">
            {groups.map((group, gi) => (
              <div key={group.id}>
                {group.label && (
                  <>
                    {gi > 0 && (
                      <hr className="mb-6 border-border/40" />
                    )}
                    <div className="mb-4 flex items-center gap-3">
                      <span className={cn("flex size-8 items-center justify-center rounded-lg text-sm", group.tone)}>
                        {group.icon}
                      </span>
                      <div>
                        <h3 className="text-[14px] font-semibold tracking-tight text-foreground">
                          {group.label}
                          <span className="ml-2 text-[12px] font-normal text-muted-foreground">
                            ({group.items.length})
                          </span>
                        </h3>
                        {group.description && (
                          <p className="text-[11.5px] text-muted-foreground/80">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((opp, i) => (
                    <div
                      key={opp.id}
                      className="animate-fade-up min-w-0"
                      style={{ animationDelay: `${Math.min(i, 11) * 30}ms` }}
                    >
                      <OpportunityCard
                        opportunity={opp}
                        isSaved={effectiveSavedSet.has(opp.id)}
                        applicationStatus={effectiveAppliedMap[opp.id]}
                        matchScore={scoreMap[opp.id]?.score}
                        onSelect={setSelectedOpp}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {hiddenLowFitCount > 0 && !showLowFit && !inSearchMode && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setShowLowFit(true)}
                className="rounded-full border border-border/60 bg-background px-4 py-1.5 text-[12px] font-medium text-muted-foreground transition hover:border-border hover:text-foreground"
              >
                Show {hiddenLowFitCount} low-fit {hiddenLowFitCount === 1 ? "result" : "results"}
              </button>
            </div>
          )}
          {showLowFit && !inSearchMode && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setShowLowFit(false)}
                className="rounded-full border border-border/60 bg-background px-4 py-1.5 text-[12px] font-medium text-muted-foreground transition hover:border-border hover:text-foreground"
              >
                Hide low-fit results
              </button>
            </div>
          )}

          {!inSearchMode && visibleCount < sorted.length && (
            <div className="mt-12 flex justify-center border-t border-border/40 pt-6">
              <button
                type="button"
                onClick={() => setVisibleCount((v) => v + 100)}
                className="rounded-full border border-border bg-card px-6 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Load {Math.min(100, sorted.length - visibleCount)} more
              </button>
            </div>
          )}
        </section>
      )}

      {selectedOpp && (
        <OpportunityDrawer
          opportunity={selectedOpp}
          isSaved={effectiveSavedSet.has(selectedOpp.id)}
          applicationStatus={effectiveAppliedMap[selectedOpp.id]}
          score={effectiveScoreMap[selectedOpp.id]?.score ?? 0}
          why={effectiveScoreMap[selectedOpp.id]?.why ?? null}
          fitScore={effectiveScoreMap[selectedOpp.id]?.fitScore}
          valueScore={effectiveScoreMap[selectedOpp.id]?.valueScore}
          actionabilityScore={effectiveScoreMap[selectedOpp.id]?.actionabilityScore}
          sourceName={effectiveSourceMap[selectedOpp.id]}
          onClose={() => setSelectedOpp(null)}
        />
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
  scoreMap: Record<string, { 
    score: number; 
    why: string | null;
    fitScore?: number;
    valueScore?: number;
    actionabilityScore?: number;
  }>,
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
