import { redirect } from "next/navigation";
import { differenceInDays, parseISO } from "date-fns";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { FilteredFeed } from "@/components/FilteredFeed";
import { StatsStrip } from "@/components/StatsStrip";
import { EmptyState } from "@/components/EmptyState";
import { refreshScores } from "@/lib/scoring/refresh";
import type { ApplicationStatus, Opportunity, Profile } from "@/types/db";
import { Landing } from "./Landing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Logged-out visitors see the marketing landing.
  if (!user) return <Landing />;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile?.onboarded) redirect("/onboarding");

  // Fetch a wide pool — client-side filtering re-ranks below.
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .eq("status", "active")
    .order("date_added", { ascending: false })
    .limit(120);

  const opps: Opportunity[] = (opportunities as Opportunity[] | null) ?? [];

  // Compute / fetch cached personalized scores for all opps in one batch
  const scoreMapInternal = await refreshScores(profile as Profile, opps);

  // Sources lookup so the filter UI can show "Greenhouse: Anthropic", etc.
  // Build opp_id -> source_name in one query, no JOIN needed.
  const sourceIds = Array.from(
    new Set(opps.map((o) => o.source_id).filter((x): x is string => !!x)),
  );
  const sourceById = new Map<string, string>();
  if (sourceIds.length > 0) {
    const { data: sources } = await supabase
      .from("sources")
      .select("id,name")
      .in("id", sourceIds);
    for (const s of (sources ?? []) as { id: string; name: string }[]) {
      sourceById.set(s.id, s.name);
    }
  }
  const sourceMap: Record<string, string> = {};
  for (const o of opps) {
    if (o.source_id) {
      const name = sourceById.get(o.source_id);
      if (name) sourceMap[o.id] = name;
    }
  }

  // Hero stats use the unfiltered pool — they describe what we have, not what's shown.
  const closingSoon = opps.filter((o) => {
    if (!o.deadline) return false;
    const d = differenceInDays(parseISO(o.deadline), new Date());
    return d >= 0 && d <= 7;
  }).length;

  const { data: savedRows } = await supabase
    .from("saved_opportunities")
    .select("opportunity_id")
    .eq("user_id", user.id);
  const savedSet = new Set(
    (savedRows ?? []).map((s) => s.opportunity_id as string),
  );

  const { data: applicationRows } = await supabase
    .from("applications")
    .select("opportunity_id,status")
    .eq("user_id", user.id);
  const appliedMap = new Map<string, ApplicationStatus>(
    (applicationRows ?? []).map((a) => [
      a.opportunity_id as string,
      a.status as ApplicationStatus,
    ]),
  );

  const firstName = (profile.full_name ?? "").split(" ")[0] || "there";
  const appliedCount = [...appliedMap.values()].filter((s) =>
    ["applied", "interviewing", "won"].includes(s),
  ).length;

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

      {/* Slim header strip — greeting + compact stats inline */}
      <section className="border-b border-border/60 bg-card/30">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <p className="text-sm font-semibold tracking-tight">
              Welcome back, {firstName}
            </p>
            <p className="text-xs text-muted-foreground">
              {opps.length > 0
                ? `${opps.length} live · ranked by personal fit`
                : "Your feed will fill in once ingestion runs"}
            </p>
          </div>
          {opps.length > 0 && (
            <StatsStrip
              variant="compact"
              stats={[
                { label: "live", value: opps.length, icon: "feed" },
                {
                  label: "closing ≤7d",
                  value: closingSoon,
                  icon: "urgent",
                  tone: closingSoon > 0 ? "warn" : "default",
                },
                { label: "saved", value: savedSet.size, icon: "saved" },
                { label: "applied", value: appliedCount, icon: "applied" },
              ]}
            />
          )}
        </div>
      </section>

      {/* Feed */}
      <main id="main" className="mx-auto max-w-6xl px-4 py-8">
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
