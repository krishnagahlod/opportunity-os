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
 * Server-side full-text search across the entire opportunities table.
 *
 * Today's in-memory filter on the dashboard pool (120 most recent rows)
 * misses everything older. This route uses the `search_tsv` GIN index added
 * in migration 0006 to query the whole table — typically returns in <100ms
 * even on a few thousand rows.
 *
 * Why prefix tsquery (`Ac:*`) and not websearch_to_tsquery:
 *   websearch_to_tsquery only matches whole stemmed tokens. So "Ac" would
 *   produce an empty / non-matching tsquery against tokens like "account",
 *   "acquisition" — and the user gets zero results despite the obvious
 *   intent. Prefix tsquery (`Ac:*`) matches both. We strip non-alphanumerics
 *   before building the query so user input can't break to_tsquery's parser.
 *
 * Auth: cookie session (same as the page itself). Returns 401 if signed out.
 */

const FEED_COLUMNS =
  "id,title,organization,category,summary,tags,deadline,location,compensation,is_remote,apply_url,source_id,date_added,featured,status,extraction_confidence,description";

const MAX_RESULTS = 50;

type SearchPayload = {
  opportunities: Opportunity[];
  scoreMap: Record<string, { score: number; why: string | null }>;
  sourceMap: Record<string, string>;
  savedSet: string[];
  appliedMap: Record<string, ApplicationStatus>;
};

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json(emptyPayload());

  const tsquery = buildPrefixTsQuery(q);
  if (!tsquery) return NextResponse.json(emptyPayload());

  const [profileRes, oppsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("opportunities")
      .select(FEED_COLUMNS)
      .eq("status", "active")
      // `fts(english)` operator → search_tsv @@ to_tsquery('english', ...).
      // to_tsquery is the only flavour that honours `:*` prefix syntax.
      .filter("search_tsv", "fts(english)", tsquery)
      .order("date_added", { ascending: false })
      .limit(MAX_RESULTS),
  ]);

  if (oppsRes.error) {
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

  // Fan-out the supporting lookups in parallel.
  const oppIds = opps.map((o) => o.id);
  const sourceIds = Array.from(
    new Set(opps.map((o) => o.source_id).filter((x): x is string => !!x)),
  );

  const [savedRes, appsRes, sourcesRes] = await Promise.all([
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
  ]);

  const savedSet = (savedRes.data ?? []).map((r) => r.opportunity_id as string);
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

  // Score is pure JS — no DB / AI roundtrip. Compute inline so the search
  // response has the same shape the dashboard already consumes.
  const scoreMap: Record<string, { score: number; why: string | null }> = {};
  for (const o of opps) {
    const s = computeScore(profile, o);
    scoreMap[o.id] = { score: s.score, why: s.why };
  }

  // Strip `description` before returning — the cards don't render it and the
  // dashboard query already trims it. Keeps payload tight.
  const lean: Opportunity[] = opps.map((o) => ({
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
 * Convert raw user input into a prefix-aware tsquery string safe to feed into
 * to_tsquery(). Each whitespace-separated token gets `:*` so partial words
 * match (e.g. "Ac" → "Account", "Acquisition"). Non-alphanumerics are
 * stripped because to_tsquery's parser treats `&|!():` as operators and
 * untrusted input would break it.
 *
 * Returns null when nothing meaningful remains after stripping.
 */
function buildPrefixTsQuery(input: string): string | null {
  const tokens = input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);
  if (tokens.length === 0) return null;
  return tokens.map((t) => `${t}:*`).join(" & ");
}
