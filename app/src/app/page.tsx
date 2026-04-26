import { redirect } from "next/navigation";
import { differenceInDays, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { OpportunityCard } from "@/components/OpportunityCard";
import { StatsStrip } from "@/components/StatsStrip";
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

  // Fetch a wide pool — we'll re-rank by per-user score below
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .eq("status", "active")
    .order("date_added", { ascending: false })
    .limit(80);

  const opps: Opportunity[] = (opportunities as Opportunity[] | null) ?? [];

  // Compute / fetch cached personalized scores for all opps in one batch
  const scoreMap = await refreshScores(profile as Profile, opps);

  // Sort purely by personalized score (desc)
  const ranked = [...opps].sort((a, b) => {
    const sa = scoreMap.get(a.id)?.score ?? 0;
    const sb = scoreMap.get(b.id)?.score ?? 0;
    return sb - sa;
  });
  const top = ranked.slice(0, 50);

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

  const closingSoon = top.filter((o) => {
    if (!o.deadline) return false;
    const d = differenceInDays(parseISO(o.deadline), new Date());
    return d >= 0 && d <= 7;
  }).length;
  const appliedCount = [...appliedMap.values()].filter((s) =>
    ["applied", "interviewing", "won"].includes(s),
  ).length;

  return (
    <div className="min-h-screen">
      <NavBar email={user.email} isAdmin={profile.role === "admin"} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60 bg-hero-radial dark:bg-hero-radial-dark">
        <div className="bg-grid-dots pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <p
            className="animate-fade-up text-sm font-medium text-muted-foreground"
            style={{ animationDelay: "0ms" }}
          >
            Welcome back, {firstName}
          </p>
          <h1
            className="animate-fade-up mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ animationDelay: "60ms" }}
          >
            Opportunities that{" "}
            <span className="text-gradient-brand">actually fit you</span>.
          </h1>
          <p
            className="animate-fade-up mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base"
            style={{ animationDelay: "120ms" }}
          >
            {top.length > 0
              ? `${top.length} live opportunities, ranked by personal fit. ${closingSoon} closing this week.`
              : "Your feed will fill in once your n8n workflow runs."}
          </p>

          <div
            className="animate-fade-up mt-8"
            style={{ animationDelay: "180ms" }}
          >
            <StatsStrip
              stats={[
                { label: "In your feed", value: top.length, icon: "feed" },
                {
                  label: "Closing ≤ 7 days",
                  value: closingSoon,
                  icon: "urgent",
                  tone: closingSoon > 0 ? "warn" : "default",
                },
                { label: "Saved", value: savedSet.size, icon: "saved" },
                { label: "Applied", value: appliedCount, icon: "applied" },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Feed */}
      <main className="mx-auto max-w-6xl px-4 py-10">
        {top.length === 0 ? (
          <EmptyFeed />
        ) : (
          <>
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold tracking-tight text-foreground/80">
                Top picks for you
              </h2>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
                Ranked by personalized score
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {top.map((opp, i) => {
                const s = scoreMap.get(opp.id);
                return (
                  <div
                    key={opp.id}
                    className="animate-fade-up"
                    style={{
                      animationDelay: `${Math.min(i, 11) * 40}ms`,
                    }}
                  >
                    <OpportunityCard
                      opportunity={opp}
                      isSaved={savedSet.has(opp.id)}
                      applicationStatus={appliedMap.get(opp.id)}
                      score={s?.score ?? null}
                      why={s?.why ?? null}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
      {/* Ghost rows behind the message — gives a "loading-like" feel instead of a flat empty box */}
      <div className="mask-bottom-fade pointer-events-none absolute inset-x-6 bottom-0 top-20 space-y-3 opacity-50">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-12 rounded-xl border border-border/60 bg-muted/40"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
      <div className="relative">
        <p className="text-base font-medium">Your feed is empty.</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Run an n8n workflow to ingest fresh opportunities, or trigger one
          manually from the n8n dashboard.
        </p>
      </div>
    </div>
  );
}
