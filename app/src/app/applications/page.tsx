import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, Opportunity } from "@/types/db";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  saved: {
    label: "Saved",
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  },
  applied: {
    label: "Applied",
    className:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  },
  interviewing: {
    label: "Interviewing",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  },
  won: {
    label: "Won",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
};

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
    .select("id, status, updated_at, opportunities(*)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const rows = (data ?? []).map((row) => ({
    id: row.id as string,
    status: row.status as ApplicationStatus,
    updated_at: row.updated_at as string,
    opportunity: row.opportunities as unknown as Opportunity,
  }));

  return (
    <div className="min-h-screen">
      <NavBar email={user.email} isAdmin={profile.role === "admin"} />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Applications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} in your tracker. Drag-and-drop Kanban view in Phase 5.
          </p>
        </div>
        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/70">
            <table className="w-full text-sm">
              <thead className="border-b border-border/70 bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Opportunity</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((row) => {
                  const style = STATUS_STYLE[row.status];
                  return (
                    <tr
                      key={row.id}
                      className="transition hover:bg-muted/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-medium">
                          {row.opportunity?.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.opportunity?.organization}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                            style.className,
                          )}
                        >
                          {style.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        {new Date(row.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
        <Star className="size-5" />
      </div>
      <p className="mt-4 text-base font-medium">No applications yet</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
        Hit <span className="font-medium text-foreground">Mark applied</span>{" "}
        on any card to start tracking your pipeline.
      </p>
    </div>
  );
}
