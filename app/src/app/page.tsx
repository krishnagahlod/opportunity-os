import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { FilteredFeed } from "@/components/FilteredFeed";
import { EmptyState } from "@/components/EmptyState";
import { refreshScores } from "@/lib/scoring/refresh";
import type { ApplicationStatus, Opportunity, Profile } from "@/types/db";
import { Landing } from "./Landing";

export const dynamic = "force-dynamic";

// Columns the feed UI actually consumes. Skips long-text fields
// (`description`, `eligibility`, `source_url`, etc.) which would otherwise
// add hundreds of KB to the RSC payload for a 120-row pool.
const FEED_COLUMNS =
  "id,title,organization,category,summary,tags,deadline,location,compensation,is_remote,apply_url,source_id,date_added,featured,status";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Logged-out visitors see the marketing landing.
  if (!user) return <Landing />;

  // Profile is needed before we can decide onboarding gating, so it's serial.
  // Everything after the onboarding check is independent and runs in parallel.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile?.onboarded) redirect("/onboarding");

  // Parallel batch — these 3 queries don't depend on each other.
  const [oppsRes, savedRes, appsRes] = await Promise.all([
    supabase
      .from("opportunities")
      .select(FEED_COLUMNS)
      .eq("status", "active")
      // Hide low-confidence extractions (< 0.5) from the dashboard — they
      // go to the admin Needs-review queue. NULL kept (pre-Phase-2.5 rows).
      .or("extraction_confidence.is.null,extraction_confidence.gte.0.5")
      .order("date_added", { ascending: false })
      .limit(5000), // Bypass implicit 500 row max_rows config in Supabase
    supabase
      .from("saved_opportunities")
      .select("opportunity_id")
      .eq("user_id", user.id),
    supabase
      .from("applications")
      .select("opportunity_id,status")
      .eq("user_id", user.id),
  ]);

  const opps: Opportunity[] = (oppsRes.data as Opportunity[] | null) ?? [];

  // Two more parallel queries that need `opps` before they can run:
  //   - sources: only the ids we actually have in this pool
  //   - scores: refreshScores reads the score cache and computes any misses
  const sourceIds = Array.from(
    new Set(opps.map((o) => o.source_id).filter((x): x is string => !!x)),
  );

  const [scoreMapInternal, sourcesRes] = await Promise.all([
    refreshScores(profile as Profile, opps),
    sourceIds.length > 0
      ? supabase.from("sources").select("id,name").in("id", sourceIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

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

  const savedSet = new Set(
    (savedRes.data ?? []).map((s) => s.opportunity_id as string),
  );

  const appliedMap = new Map<string, ApplicationStatus>(
    (appsRes.data ?? []).map((a) => [
      a.opportunity_id as string,
      a.status as ApplicationStatus,
    ]),
  );

  // Convert server-side Map/Set into plain JSON-serializable shapes
  // so the client component receives them through the boundary.
  const scoreMapPlain: Record<string, { 
    score: number; 
    why: string | null;
    fitScore?: number;
    valueScore?: number;
    actionabilityScore?: number;
  }> = {};
  for (const [id, s] of scoreMapInternal.entries()) {
    scoreMapPlain[id] = { 
      score: s.score, 
      why: s.why,
      fitScore: s.fitScore,
      valueScore: s.valueScore,
      actionabilityScore: s.actionabilityScore
    };
  }
  const appliedMapPlain: Record<string, ApplicationStatus> = {};
  for (const [id, status] of appliedMap.entries()) {
    appliedMapPlain[id] = status;
  }

  return (
    <div className="min-h-screen">
      <NavBar email={user.email} isAdmin={profile.role === "admin"} />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-hero-radial dark:bg-hero-radial-dark pt-16 pb-12 sm:pt-24 sm:pb-16 animate-fade-up">
        <div className="absolute inset-0 bg-grid-dots opacity-30 mask-bottom-fade"></div>
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Discover Your Next <span className="text-gradient-brand">Breakthrough</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Curated opportunities for builders and creators. Apply faster, track smarter, and land the role you deserve.
          </p>
          
          {/* Live Counter (Social Proof) */}
          <div className="mt-8 flex justify-center items-center gap-2 text-sm font-medium text-muted-foreground animate-slide-up-fade" style={{ animationDelay: '150ms' }}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
            </span>
            <span>{opps.length}+ Active Opportunities</span>
          </div>
        </div>
      </section>

      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        {opps.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Your feed is empty"
            description="Once an ingestion workflow runs, ranked opportunities will appear here. You can also add one manually."
            action={{ label: "Submit one", href: "/submit" }}
            decorative
          />
        ) : (
          <FilteredFeed
            opportunities={opps}
            scoreMap={scoreMapPlain}
            savedSet={Array.from(savedSet)}
            appliedMap={appliedMapPlain}
            sourceMap={sourceMap}
          />
        )}
      </main>
    </div>
  );
}
