import { redirect } from "next/navigation";
import { Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { OpportunityRow } from "@/components/OpportunityRow";
import { EmptyState } from "@/components/EmptyState";
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
      <main id="main" className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <header className="mb-5 flex items-baseline justify-between">
          <h1 className="text-lg font-semibold tracking-tight">Saved</h1>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {opps.length}
          </span>
        </header>
        {opps.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No saves yet"
            description={
              <>
                Hit <span className="font-medium text-foreground">Save</span> on
                any row in your feed to bookmark it here.
              </>
            }
            action={{ label: "Browse the feed", href: "/" }}
          />
        ) : (
          <ul className="divide-y divide-border/40">
            {opps.map((opp) => (
              <li key={opp.id}>
                <OpportunityRow
                  opportunity={opp}
                  isSaved={true}
                  applicationStatus={appliedMap.get(opp.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
