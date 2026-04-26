import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { EmptyState } from "@/components/EmptyState";
import { KanbanBoard, type KanbanItem } from "./KanbanBoard";
import type { ApplicationStatus, Opportunity } from "@/types/db";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
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

  // Card columns only — skip `description`, `eligibility`, `source_url` etc.
  const CARD_COLUMNS =
    "id,title,organization,category,summary,tags,deadline,location,compensation,is_remote,apply_url,source_id,date_added,featured,status";

  const { data } = await supabase
    .from("applications")
    .select(
      `id, opportunity_id, status, updated_at, opportunities(${CARD_COLUMNS})`,
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const items: KanbanItem[] = (data ?? [])
    .map((row) => ({
      id: row.id as string,
      opportunity_id: row.opportunity_id as string,
      status: row.status as ApplicationStatus,
      updated_at: row.updated_at as string,
      opportunity: row.opportunities as unknown as Opportunity,
    }))
    .filter((row) => row.opportunity);

  return (
    <div className="min-h-screen">
      <NavBar email={user.email} isAdmin={profile.role === "admin"} />
      <main id="main" className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Applications
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {items.length === 0
                ? "Mark any opportunity as applied to start tracking it here."
                : `${items.length} in your tracker. Drag cards between columns to update status.`}
            </p>
          </div>
        </div>
        {items.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No applications yet"
            description={
              <>
                Hit{" "}
                <span className="font-medium text-foreground">Mark applied</span>{" "}
                on any feed card to start tracking your pipeline.
              </>
            }
            action={{ label: "Browse the feed", href: "/" }}
          />
        ) : (
          <KanbanBoard initial={items} />
        )}
      </main>
    </div>
  );
}
