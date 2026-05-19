import { redirect } from "next/navigation";
import { Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { OpportunityCard } from "@/components/OpportunityCard";
import { EmptyState } from "@/components/EmptyState";
import { SavedClosedSection } from "./SavedClosedSection";
import type { ApplicationStatus, Opportunity } from "@/types/db";

export const dynamic = "force-dynamic";

// Card columns only — skip `description`, `eligibility`, `source_url` etc.
const CARD_COLUMNS =
  "id,title,organization,category,summary,tags,deadline,location,compensation,is_remote,apply_url,source_id,date_added,featured,status,extraction_confidence";

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,onboarded")
    .eq("id", user.id)
    .single();
  if (!profile?.onboarded) redirect("/onboarding");

  const [savedRes, appsRes] = await Promise.all([
    supabase
      .from("saved_opportunities")
      .select(`opportunity_id, opportunities(${CARD_COLUMNS})`)
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false }),
    supabase
      .from("applications")
      .select("opportunity_id,status")
      .eq("user_id", user.id),
  ]);

  const allOpps: Opportunity[] = (savedRes.data ?? [])
    .map((row) => row.opportunities as unknown as Opportunity)
    .filter(Boolean);

  // Split active vs closed (expired/spam). Users want to track everything
  // they've saved, but closed roles shouldn't clutter the live workflow —
  // demoted to a collapsible section below the active grid.
  const activeOpps = allOpps.filter((o) => o.status === "active");
  const closedOpps = allOpps.filter((o) => o.status !== "active");

  const appliedMap = new Map<string, ApplicationStatus>(
    (appsRes.data ?? []).map((a) => [
      a.opportunity_id as string,
      a.status as ApplicationStatus,
    ]),
  );

  return (
    <div className="min-h-screen">
      <NavBar email={user.email} isAdmin={profile.role === "admin"} />
      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <header className="mb-6 flex items-baseline justify-between">
          <h1 className="text-lg font-semibold tracking-tight">Saved</h1>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {activeOpps.length}{" "}
            {activeOpps.length === 1 ? "opportunity" : "opportunities"}
            {closedOpps.length > 0 && (
              <span className="ml-1.5 text-muted-foreground/60">
                · {closedOpps.length} closed
              </span>
            )}
          </span>
        </header>

        {allOpps.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No saves yet"
            description={
              <>
                Hit <span className="font-medium text-foreground">Save</span> on
                any opportunity to bookmark it here.
              </>
            }
            action={{ label: "Browse the feed", href: "/" }}
          />
        ) : (
          <>
            {activeOpps.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeOpps.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    isSaved={true}
                    applicationStatus={appliedMap.get(opp.id)}
                  />
                ))}
              </div>
            ) : (
              // All saves are closed — gentle empty state for the active grid
              <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 px-6 py-8 text-center text-sm text-muted-foreground">
                All your saved opportunities have closed. Toggle the section
                below to revisit them, or{" "}
                <a href="/" className="font-medium text-primary hover:underline">
                  browse the feed
                </a>{" "}
                for new picks.
              </div>
            )}

            {closedOpps.length > 0 && (
              <SavedClosedSection
                closedOpps={closedOpps}
                appliedMap={Object.fromEntries(appliedMap.entries())}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
