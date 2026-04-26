import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
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

  const { data } = await supabase
    .from("applications")
    .select("id, opportunity_id, status, updated_at, opportunities(*)")
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
      <main className="mx-auto max-w-7xl px-4 py-10">
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
        {items.length === 0 ? <EmptyState /> : <KanbanBoard initial={items} />}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border/80 bg-card/50 p-12 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
        <Star className="size-5" />
      </div>
      <p className="mt-4 text-base font-medium">No applications yet</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
        Hit <span className="font-medium text-foreground">Mark applied</span>{" "}
        on any feed card to start tracking your pipeline.
      </p>
    </div>
  );
}
