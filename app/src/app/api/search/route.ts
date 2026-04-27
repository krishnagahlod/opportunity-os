import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeScore, findMatchedTerms } from "@/lib/scoring/score";
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
 * Returns results plus the per-card supporting maps the client renders
 * (scoreMap, matchMap, sourceMap) so search results visually look identical
 * to the browse view. Computing scores on the request path is cheap because
 * computeScore() is pure JS — no AI call.
 *
 * Auth: cookie session (same as the page itself). Returns 401 if signed out.
 */

const FEED_COLUMNS =
  "id,title,organization,category,summary,tags,deadline,location,compensation,is_remote,apply_url,source_id,date_added,featured,status,extraction_confidence,description";

const MAX_RESULTS = 50;

type SearchPayload = {
  opportunities: Opportunity[];
  scoreMap: Record<string, { score: number; why: string | null }>;
  matchMap: Record<string, string[]>;
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
  if (q.length < 2) {
    // Don't run a search for trivial input; client should not have called us
    // with this anyway, but fail soft instead of hammering the index.
    return NextResponse.json(emptyPayload());
  }

  const [profileRes, oppsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("opportunities")
      .select(FEED_COLUMNS)
      .eq("status", "active")
      .textSearch("search_tsv", q, { config: "english", type: "websearch" })
      .order("date_added", { ascending: false })
      .limit(MAX_RESULTS),
  ]);

  const profile = profileRes.data as Profile | null;
  const opps = (oppsRes.data ?? []) as Opportunity[];

  if (!profile || opps.length === 0) {
    return NextResponse.json({
      ...emptyPayload(),
      opportunities: opps,
    });
  }

  // Fan-out the supporting lookups in parallel: the saved/applied state for
  // these specific results, and the source-name lookup.
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

  // Score + match are pure JS — no DB / AI roundtrip. Compute inline so the
  // search response has the same shape the dashboard already consumes.
  const scoreMap: Record<string, { score: number; why: string | null }> = {};
  const matchMap: Record<string, string[]> = {};
  for (const o of opps) {
    const s = computeScore(profile, o);
    scoreMap[o.id] = { score: s.score, why: s.why };
    const matches = findMatchedTerms(profile, o);
    if (matches.length > 0) matchMap[o.id] = matches;
  }

  // Strip `description` before returning — the cards don't render it and the
  // dashboard query already trims it. Keep payload tight.
  const lean: Opportunity[] = opps.map((o) => ({
    ...o,
    description: null,
  }));

  const payload: SearchPayload = {
    opportunities: lean,
    scoreMap,
    matchMap,
    sourceMap,
    savedSet,
    appliedMap,
  };

  return NextResponse.json(payload, {
    headers: {
      // Per-user, very short — search is interactive but a 5s window absorbs
      // double-renders on Strict Mode + back/forward nav.
      "Cache-Control": "private, max-age=5",
    },
  });
}

function emptyPayload(): SearchPayload {
  return {
    opportunities: [],
    scoreMap: {},
    matchMap: {},
    sourceMap: {},
    savedSet: [],
    appliedMap: {},
  };
}
