import { redirect } from "next/navigation";
import { Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { OpportunityCard } from "@/components/OpportunityCard";
import { EmptyState } from "@/components/EmptyState";
import type { ApplicationStatus, Opportunity } from "@/types/db";

export const dynamic = "force-dynamic";

// Card columns only — skip `description`, `eligibility`, `source_url` etc.
const CARD_COLUMNS =
  "id,title,organization,category,summary,tags,deadline,location,compensation,is_remote,apply_url,source_id,date_added,featured,status";

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

  const opps: Opportunity[] = (savedRes.data ?? [])
    .map((row) => row.opportunities as unknown as Opportunity)
    .filter(Boolean);

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
            {opps.length}{" "}
            {opps.length === 1 ? "opportunity" : "opportunities"}
          </span>
        </header>
        {opps.length === 0 ? (
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {opps.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                isSaved={true}
                applicationStatus={appliedMap.get(opp.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
