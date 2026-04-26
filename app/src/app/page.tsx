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
      .order("date_added", { ascending: false })
      .limit(120),
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
  const scoreMapPlain: Record<string, { score: number; why: string | null }> = {};
  for (const [id, s] of scoreMapInternal.entries()) {
    scoreMapPlain[id] = { score: s.score, why: s.why };
  }
  const appliedMapPlain: Record<string, ApplicationStatus> = {};
  for (const [id, status] of appliedMap.entries()) {
    appliedMapPlain[id] = status;
  }

  return (
    <div className="min-h-screen">
      <NavBar email={user.email} isAdmin={profile.role === "admin"} />

      {/* No hero strip — straight into filter + list. The page IS the feed. */}
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
