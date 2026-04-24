import { redirect } from "next/navigation";
import { Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { OpportunityCard } from "@/components/OpportunityCard";
import type { ApplicationStatus, Opportunity } from "@/types/db";

export const dynamic = "force-dynamic";

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

  const { data } = await supabase
    .from("saved_opportunities")
    .select("opportunity_id, opportunities(*)")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false });

  const opps: Opportunity[] = (data ?? [])
    .map((row) => row.opportunities as unknown as Opportunity)
    .filter(Boolean);

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

  return (
    <div className="min-h-screen">
      <NavBar email={user.email} isAdmin={profile.role === "admin"} />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Saved
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {opps.length} bookmarked {opps.length === 1 ? "opportunity" : "opportunities"}.
            </p>
          </div>
        </div>
        {opps.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border/80 bg-card/50 p-12 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
        <Bookmark className="size-5" />
      </div>
      <p className="mt-4 text-base font-medium">No saves yet</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
        Hit <span className="font-medium text-foreground">Save</span> on any
        card in your feed to bookmark it here.
      </p>
    </div>
  );
}
