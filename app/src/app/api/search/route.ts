import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeScore } from "@/lib/scoring/score";
import type {
  ApplicationStatus,
  Opportunity,
  Profile,
} from "@/types/db";

export const runtime = "nodejs";

/*
 * Server-side search across the entire opportunities table.
 *
 * Implementation note: this used to use a Postgres tsvector + GIN index
 * with a prefix to_tsquery for stemming + word-boundary matching. That had
 * two problems for our scale:
 *   1) PostgREST URL-encoding of `:*` / `&` in raw to_tsquery values is
 *      finicky and produced 500s on multi-token input.
 *   2) Required migration 0006 to be applied; if it wasn't, every search
 *      500'd silently.
 * For a few-thousand-row table, plain ILIKE substring matching is plenty
 * fast (and Postgres can use a btree-gin / pg_trgm index later if it ever
 * stops being fast). Each user-typed token must appear in at least one of
 * title / organization / summary; multi-token queries AND across tokens.
 *
 * Auth: cookie session (same as the page itself). Returns 401 if signed out.
 */

const FEED_COLUMNS =
  "id,title,organization,category,summary,tags,deadline,location,compensation,is_remote,apply_url,source_id,date_added,featured,status,extraction_confidence,description";

// Server fetches a wide candidate pool ordered by date_added; client then
// sorts by personalized score (default "relevance" sort in FilteredFeed)
// and the user only sees the grid render the top items. Bumped from 50 to
// 150 because at 50 the most-relevant matches were getting cut off in
// favour of merely-recent ones — score-based ranking only works if the
// pool we hand it is wide enough.
const MAX_RESULTS = 150;

type SearchPayload = {
  opportunities: Opportunity[];
  scoreMap: Record<string, { score: number; why: string | null }>;
  sourceMap: Record<string, string>;
  savedSet: string[];
  appliedMap: Record<string, ApplicationStatus>;
};

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    if (q.length < 2) return NextResponse.json(emptyPayload());

    const tokens = buildSearchTokens(q);
    if (tokens.length === 0) return NextResponse.json(emptyPayload());

    // Enforce server-side search quota (10 searches/day on Free tier)
    const { checkAndConsumeQuota } = await import("@/lib/auth/entitlements");
    const quotaResult = await checkAndConsumeQuota(user.id, "search_query", 1);
    if (!quotaResult.allowed) {
      return NextResponse.json(
        {
          error: "Daily search limit reached (10 searches/day on Free tier). Upgrade to Pro or use an @iitb.ac.in account for unlimited searches.",
          code: "QUOTA_EXCEEDED",
          upgradeRequired: true,
          remaining: 0,
        },
        { status: 403 }
      );
    }

    // Build query: each token AND-chains a 3-column OR group via .or().
    // Hard quality gate at the DB level: exclude low-confidence extractions
    // (< 0.5) from search results. They go to the admin Needs-review queue
    // instead. NULLs are kept (pre-Phase-2.5 rows weren't scored).
    let queryBuilder = supabase
      .from("opportunities")
      .select(FEED_COLUMNS)
      .eq("status", "active")
      .or("extraction_confidence.is.null,extraction_confidence.gte.0.5");

    for (const token of tokens) {
      // PostgREST ILIKE in `or` filter strings uses `*` as the wildcard
      // (rather than SQL's `%`). Tokens are pre-cleaned to a-z0-9 so we
      // don't need to escape commas/parens that would break the OR string.
      queryBuilder = queryBuilder.or(
        [
          `title.ilike.*${token}*`,
          `organization.ilike.*${token}*`,
          `summary.ilike.*${token}*`,
        ].join(","),
      );
    }

    const [profileRes, oppsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      queryBuilder
        .order("date_added", { ascending: false })
        .limit(MAX_RESULTS),
    ]);

    if (oppsRes.error) {
      console.error("[search] supabase error:", oppsRes.error);
      return NextResponse.json(
        { error: `Search failed: ${oppsRes.error.message}` },
        { status: 500 },
      );
    }

    const profile = profileRes.data as Profile | null;
    const opps = (oppsRes.data ?? []) as Opportunity[];

    if (!profile || opps.length === 0) {
      return NextResponse.json({
        ...emptyPayload(),
        opportunities: opps,
      });
    }

    const oppIds = opps.map((o) => o.id);
    const sourceIds = Array.from(
      new Set(opps.map((o) => o.source_id).filter((x): x is string => !!x)),
    );

    const [savedRes, appsRes, sourcesRes, feedbackRes] = await Promise.all([
      supabase
        .from("saved_opportunities")
        .select("opportunity_id")
        .eq("user_id", user.id)
        .in("opportunity_id", oppIds),
      supabase
        .from("applications")
        .select("opportunity_id,status")
        .eq("user_id", user.id)
        .in("opportunity_id", oppIds),
      sourceIds.length > 0
        ? supabase.from("sources").select("id,name").in("id", sourceIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      supabase
        .from("opportunity_feedback")
        .select("opportunity_id")
        .eq("user_id", user.id)
        .eq("feedback", "not_interested")
        .in("opportunity_id", oppIds),
    ]);

    const savedSet = (savedRes.data ?? []).map(
      (r) => r.opportunity_id as string,
    );
    const appliedMap: Record<string, ApplicationStatus> = {};
    for (const r of appsRes.data ?? []) {
      appliedMap[r.opportunity_id as string] = r.status as ApplicationStatus;
    }

    const sourceById = new Map<string, string>();
    for (const s of (sourcesRes.data ?? []) as { id: string; name: string }[]) {
      sourceById.set(s.id, s.name);
    }
    const sourceMap: Record<string, string> = {};
    for (const o of opps) {
      if (o.source_id) {
        const name = sourceById.get(o.source_id);
        if (name) sourceMap[o.id] = name;
      }
    }

    const scoreMap: Record<string, { score: number; why: string | null }> = {};
    for (const o of opps) {
      const s = computeScore(profile, o);
      scoreMap[o.id] = { score: s.score, why: s.why };
    }

    const dismissedSet = new Set((feedbackRes.data ?? []).map(f => f.opportunity_id as string));

    // Strip `description` before returning — the cards don't render it.
    // Also filter out any dismissed opportunities.
    const lean: Opportunity[] = opps
      .filter((o) => !dismissedSet.has(o.id))
      .map((o) => ({
        ...o,
        description: null,
      }));

    const payload: SearchPayload = {
      opportunities: lean,
      scoreMap,
      sourceMap,
      savedSet,
      appliedMap,
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, max-age=5",
      },
    });
  } catch (e) {
    // Catch-all so we don't return a bare unhandled-error 500 — surface
    // the message in the JSON body so the client can show it to the user.
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[search] uncaught:", e);
    return NextResponse.json(
      { error: `Search crashed: ${msg}` },
      { status: 500 },
    );
  }
}

function emptyPayload(): SearchPayload {
  return {
    opportunities: [],
    scoreMap: {},
    sourceMap: {},
    savedSet: [],
    appliedMap: {},
  };
}

/**
 * Whitespace-split the user's query and clean each token to a-z0-9 only.
 * Drops any token shorter than 2 chars (avoids matching every row on
 * single-letter junk). Keeps it strict so user input can't break PostgREST's
 * `or` filter string parser via commas, parentheses, or `*`.
 */
function buildSearchTokens(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}
