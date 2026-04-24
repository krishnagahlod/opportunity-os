import { redirect } from "next/navigation";
import { differenceInDays, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { OpportunityCard } from "@/components/OpportunityCard";
import { StatsStrip } from "@/components/StatsStrip";
import type { ApplicationStatus, Opportunity } from "@/types/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile?.onboarded) redirect("/onboarding");

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .eq("status", "active")
    .order("featured", { ascending: false })
    .order("deadline", { ascending: true, nullsFirst: false })
    .limit(50);

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

  const opps: Opportunity[] = (opportunities as Opportunity[] | null) ?? [];
  const firstName = (profile.full_name ?? "").split(" ")[0] || "there";

  const closingSoon = opps.filter((o) => {
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
      <section className="border-b border-border/60 bg-hero-radial dark:bg-hero-radial-dark">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <p className="text-sm font-medium text-muted-foreground">
            Welcome back, {firstName}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Opportunities that{" "}
            <span className="text-gradient-brand">actually fit you</span>.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {opps.length > 0
              ? `${opps.length} live opportunities in your feed, sorted by urgency. ${closingSoon} closing this week.`
              : "Your feed will fill in once ingestion runs — or apply the seed SQL for starter data."}
          </p>

          <div className="mt-8">
            <StatsStrip
              stats={[
                { label: "In your feed", value: opps.length, icon: "feed" },
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
        {opps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-card/50 p-12 text-center">
            <p className="text-base font-medium">Your feed is empty.</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Run <code className="rounded bg-muted px-1.5 py-0.5 text-xs">supabase/seed_opportunities.sql</code> to load 18 starter opportunities,
              or wait for n8n ingestion to populate the feed (Phase 2).
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold tracking-tight text-foreground/80">
                Top picks for you
              </h2>
              <p className="text-xs text-muted-foreground">
                Sorted by deadline
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {opps.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  isSaved={savedSet.has(opp.id)}
                  applicationStatus={appliedMap.get(opp.id)}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
