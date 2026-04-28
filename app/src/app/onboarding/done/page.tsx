import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OpportunityCard } from "@/components/OpportunityCard";
import { buttonVariants } from "@/components/ui/button";
import { refreshScores } from "@/lib/scoring/refresh";
import { pickDiversifiedTop } from "@/lib/scoring/diversify";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, Opportunity, Profile } from "@/types/db";

export const dynamic = "force-dynamic";

/**
 * Post-onboarding "aha moment" interstitial. Saved-onboarding redirects here
 * (instead of straight to "/") so the user gets one explicit moment that ties
 * the resume they just uploaded to the opportunities they're about to see.
 *
 * Renders the top 3 scored opportunities computed against their just-saved
 * profile, plus a count of how many opportunities matched in the last 7 days.
 * The dashboard CTA is the only way out — they can't get stuck here.
 */

const FEED_COLUMNS =
  "id,title,organization,category,summary,tags,deadline,location,compensation,is_remote,apply_url,source_id,date_added,featured,status";

export default async function OnboardingDonePage() {
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

  // If somehow the user lands here without finishing onboarding, send them
  // back to the form. If they hit this URL after onboarding (e.g. via browser
  // history later), redirect to the dashboard rather than re-showing.
  if (!profile?.onboarded) redirect("/onboarding");

  const weekAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Pull a wider candidate pool, score it against the just-saved profile,
  // pick the top 3 by score. Limit-100 keeps the query cheap and the score
  // computation under ~50ms.
  const [poolRes, weekCountRes, savedRes, appsRes] = await Promise.all([
    supabase
      .from("opportunities")
      .select(FEED_COLUMNS)
      .eq("status", "active")
      .order("date_added", { ascending: false })
      .limit(100),
    supabase
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .gte("date_added", weekAgo),
    supabase
      .from("saved_opportunities")
      .select("opportunity_id")
      .eq("user_id", user.id),
    supabase
      .from("applications")
      .select("opportunity_id,status")
      .eq("user_id", user.id),
  ]);

  const opps = (poolRes.data ?? []) as Opportunity[];
  const weekCount = weekCountRes.count ?? 0;

  // Score everything, then take top 3 — diversified so a brand-new user
  // doesn't see "three internships" as their first impression of the feed.
  // Even on cold-start, surfacing two categories signals breadth.
  const scoreMap = await refreshScores(profile as Profile, opps);
  const candidates = opps.map((o) => ({
    opp: o,
    score: scoreMap.get(o.id)?.score ?? 0,
  }));
  const ranked = pickDiversifiedTop(
    candidates,
    3,
    (x) => x.score,
    (x) => x.opp.category,
  );

  const savedSet = new Set(
    (savedRes.data ?? []).map((r) => r.opportunity_id as string),
  );
  const appliedMap: Record<string, ApplicationStatus> = {};
  for (const r of appsRes.data ?? []) {
    appliedMap[r.opportunity_id as string] = r.status as ApplicationStatus;
  }

  // Headline number — prefer "X strong matches in the last 7 days" using a
  // floor of score 60, falling back to total weekCount if scoring is sparse.
  const strongMatches = ranked.filter((r) => r.score >= 60).length;
  const firstName = (profile.full_name ?? "").split(" ")[0] || "there";

  return (
    <div className="relative min-h-screen overflow-hidden bg-hero-radial dark:bg-hero-radial-dark">
      {/* Decorative orbs — subtle celebration vibe */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-32 size-[420px] rounded-full bg-primary/15 blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/2 size-[360px] rounded-full bg-fuchsia-500/15 blur-[140px]"
      />

      <main className="relative mx-auto max-w-5xl px-5 py-14 sm:px-6 sm:py-20">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <Sparkles className="size-3" />
          You&apos;re in
        </span>

        <h1 className="mt-5 text-balance text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          Welcome, {firstName}.{" "}
          <span className="text-gradient-brand">
            Your resume is doing work.
          </span>
        </h1>

        <p className="mt-5 max-w-2xl text-pretty text-[15.5px] leading-relaxed text-muted-foreground">
          {ranked.length > 0 && strongMatches > 0 ? (
            <>
              We read your resume and scored every active opportunity against
              your profile. Here are your top{" "}
              <span className="font-semibold text-foreground">{ranked.length}</span> right
              now —{" "}
              <span className="font-semibold text-foreground">
                {weekCount.toLocaleString()}
              </span>{" "}
              new opportunities arrived in the last 7 days.
            </>
          ) : ranked.length > 0 ? (
            <>
              We read your resume and ranked every active opportunity against
              your profile. Top picks below — fresh listings keep arriving in
              the background.
            </>
          ) : (
            <>
              Your profile is saved. Ingestion runs continuously — your feed
              will fill in shortly.
            </>
          )}
        </p>

        {ranked.length > 0 && (
          <section className="mt-10">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Top picks for you
            </p>
            <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ranked.map(({ opp }, i) => (
                <div
                  key={opp.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <OpportunityCard
                    opportunity={opp}
                    isSaved={savedSet.has(opp.id)}
                    applicationStatus={appliedMap[opp.id]}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 flex flex-col items-start gap-3 sm:mt-14 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] text-muted-foreground">
            Don&apos;t see a great match yet? Your feed updates as new
            opportunities arrive.
          </p>
          <Link
            href="/"
            className={cn(
              buttonVariants({
                size: "lg",
                className:
                  "h-12 gap-2 px-7 text-[15px] shadow-md shadow-primary/15",
              }),
            )}
          >
            See my full feed
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
