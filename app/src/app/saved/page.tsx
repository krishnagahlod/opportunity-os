import { redirect } from "next/navigation";
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
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Saved</h1>
        <p className="mt-1 mb-8 text-muted-foreground">
          {opps.length} saved {opps.length === 1 ? "opportunity" : "opportunities"}.
        </p>
        {opps.length === 0 ? (
          <div className="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            Nothing saved yet. Tap <span className="font-medium">Save</span> on
            any card in your feed to bookmark it here.
          </div>
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
