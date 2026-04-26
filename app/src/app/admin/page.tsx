import { redirect } from "next/navigation";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { Activity, AlertTriangle, Database, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NavBar } from "@/components/NavBar";
import { cn } from "@/lib/utils";
import {
  setOpportunityStatus,
  toggleFeatured,
  toggleSourceEnabled,
} from "./actions";
import { AdminActionButton } from "./AdminActionButton";

export const dynamic = "force-dynamic";

type LogStatus =
  | "extracted"
  | "upserted"
  | "skipped_duplicate"
  | "skipped_filtered"
  | "failed";

const STATUS_TONE: Record<LogStatus, string> = {
  extracted:
    "bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300",
  upserted:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
  skipped_duplicate:
    "bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300",
  skipped_filtered:
    "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
  failed:
    "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const admin = createAdminClient();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Run everything in parallel
  const [
    sourcesRes,
    logsRes,
    oppsRes,
    last24LogsRes,
    activeOppsRes,
    last24OppsRes,
    lowConfRes,
  ] = await Promise.all([
    admin
      .from("sources")
      .select("*")
      .order("created_at", { ascending: true }),
    admin
      .from("ingestion_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("opportunities")
      .select("*")
      .order("date_added", { ascending: false })
      .limit(50),
    admin
      .from("ingestion_logs")
      .select("status")
      .gte("created_at", since24h),
    admin
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    admin
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .gte("date_added", since24h),
    admin
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .lt("extraction_confidence", 0.7),
  ]);

  const sources = sourcesRes.data ?? [];
  const logs = logsRes.data ?? [];
  const opps = oppsRes.data ?? [];
  const last24Logs = last24LogsRes.data ?? [];

  // Compute success rate (upserted / total terminal-state attempts)
  const terminalStates = last24Logs.filter((l) =>
    ["upserted", "failed"].includes(l.status as string),
  );
  const successRate =
    terminalStates.length > 0
      ? Math.round(
          (terminalStates.filter((l) => l.status === "upserted").length /
            terminalStates.length) *
            100,
        )
      : null;

  return (
    <div className="min-h-screen">
      <NavBar email={user.email} isAdmin />
      <main id="main" className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Pipeline overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live source health, recent ingestion activity, and opportunity
            controls.
          </p>
        </header>

        {/* KPIs */}
        <section className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi
            label="Active opportunities"
            value={activeOppsRes.count ?? 0}
            icon={<Database className="size-4" />}
            tint="bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300"
          />
          <Kpi
            label="Added last 24h"
            value={last24OppsRes.count ?? 0}
            icon={<Activity className="size-4" />}
            tint="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300"
          />
          <Kpi
            label="24h success rate"
            value={successRate === null ? "–" : `${successRate}%`}
            icon={<Flame className="size-4" />}
            tint={cn(
              "bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300",
              successRate !== null &&
                successRate < 70 &&
                "bg-rose-500/10 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300",
            )}
          />
          <Kpi
            label="Low-confidence opps"
            value={lowConfRes.count ?? 0}
            icon={<AlertTriangle className="size-4" />}
            tint="bg-rose-500/10 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300"
          />
        </section>

        {/* Sources */}
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Sources</h2>
          <div className="overflow-hidden rounded-2xl border border-border/70">
            <table className="w-full text-sm">
              <thead className="border-b border-border/70 bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th>Name</Th>
                  <Th>Kind</Th>
                  <Th>Last run</Th>
                  <Th>Last status</Th>
                  <Th>Last error</Th>
                  <Th className="text-right">Enabled</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sources.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-xs text-muted-foreground">
                      No sources yet.
                    </td>
                  </tr>
                ) : (
                  sources.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/20">
                      <Td>
                        <span className="font-medium">{s.name}</span>
                      </Td>
                      <Td>
                        <Pill>{s.kind}</Pill>
                      </Td>
                      <Td className="tabular-nums text-muted-foreground">
                        {s.last_run_at ? relTime(s.last_run_at) : "Never"}
                      </Td>
                      <Td>
                        {s.last_status ? (
                          <Pill
                            className={cn(
                              s.last_status === "ok"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "bg-rose-500/10 text-rose-700 dark:text-rose-300",
                            )}
                          >
                            {s.last_status}
                          </Pill>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">
                            –
                          </span>
                        )}
                      </Td>
                      <Td className="max-w-xs truncate text-xs text-muted-foreground">
                        {s.last_error ?? ""}
                      </Td>
                      <Td className="text-right">
                        <AdminActionButton
                          label={s.enabled ? "Enabled" : "Disabled"}
                          active={s.enabled}
                          onAction={async () => {
                            "use server";
                            return toggleSourceEnabled(s.id, !s.enabled);
                          }}
                        />
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent logs */}
        <section className="mb-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold tracking-tight">
              Recent ingestion activity
            </h2>
            <p className="text-[11px] text-muted-foreground/70">Last 50 events</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/70">
            <table className="w-full text-sm">
              <thead className="border-b border-border/70 bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th>When</Th>
                  <Th>Status</Th>
                  <Th>Source</Th>
                  <Th>Provider</Th>
                  <Th>Tokens</Th>
                  <Th>Duration</Th>
                  <Th>Reason / URL</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-xs text-muted-foreground">
                      No ingestion activity yet — run an n8n workflow to populate.
                    </td>
                  </tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.id} className="hover:bg-muted/20">
                      <Td className="whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                        {relTime(l.created_at)}
                      </Td>
                      <Td>
                        <Pill className={STATUS_TONE[l.status as LogStatus]}>
                          {l.status}
                        </Pill>
                      </Td>
                      <Td className="text-xs">{l.source_name ?? "–"}</Td>
                      <Td className="text-xs text-muted-foreground">
                        {l.provider ?? ""}
                      </Td>
                      <Td className="text-xs tabular-nums text-muted-foreground">
                        {l.tokens_used ?? ""}
                      </Td>
                      <Td className="text-xs tabular-nums text-muted-foreground">
                        {l.duration_ms ? `${l.duration_ms}ms` : ""}
                      </Td>
                      <Td className="max-w-md truncate text-xs text-muted-foreground">
                        {l.reason ?? l.source_url ?? ""}
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Opportunities */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold tracking-tight">
              Opportunities
            </h2>
            <p className="text-[11px] text-muted-foreground/70">
              Last 50 by date added
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/70">
            <table className="w-full text-sm">
              <thead className="border-b border-border/70 bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th>Title</Th>
                  <Th>Org</Th>
                  <Th>Category</Th>
                  <Th>Confidence</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {opps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-xs text-muted-foreground">
                      No opportunities yet.
                    </td>
                  </tr>
                ) : (
                  opps.map((o) => {
                    const conf = o.extraction_confidence;
                    return (
                      <tr key={o.id} className="hover:bg-muted/20">
                        <Td className="max-w-sm">
                          <div className="line-clamp-1 text-[13px] font-medium">
                            {o.title}
                          </div>
                          {o.apply_url && (
                            <a
                              href={o.apply_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10.5px] text-primary hover:underline"
                            >
                              Open
                            </a>
                          )}
                        </Td>
                        <Td className="text-xs">{o.organization}</Td>
                        <Td>
                          <Pill>{o.category}</Pill>
                        </Td>
                        <Td className="text-xs tabular-nums">
                          {conf === null || conf === undefined ? (
                            <span className="text-muted-foreground/60">–</span>
                          ) : (
                            <span
                              className={cn(
                                conf < 0.7 && "text-amber-600 dark:text-amber-300",
                              )}
                            >
                              {Math.round(conf * 100)}%
                            </span>
                          )}
                        </Td>
                        <Td>
                          <Pill
                            className={cn(
                              o.status === "active" &&
                                "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                              o.status === "spam" &&
                                "bg-rose-500/10 text-rose-700 dark:text-rose-300",
                              o.status === "expired" &&
                                "bg-slate-500/10 text-slate-600 dark:text-slate-300",
                              o.status === "pending" &&
                                "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                            )}
                          >
                            {o.status}
                          </Pill>
                        </Td>
                        <Td>
                          <div className="flex items-center justify-end gap-1.5">
                            <AdminActionButton
                              label={o.featured ? "Featured" : "Feature"}
                              active={o.featured}
                              onAction={async () => {
                                "use server";
                                return toggleFeatured(o.id, !o.featured);
                              }}
                            />
                            {o.status !== "spam" ? (
                              <AdminActionButton
                                label="Spam"
                                variant="danger"
                                onAction={async () => {
                                  "use server";
                                  return setOpportunityStatus(o.id, "spam");
                                }}
                              />
                            ) : (
                              <AdminActionButton
                                label="Restore"
                                onAction={async () => {
                                  "use server";
                                  return setOpportunityStatus(o.id, "active");
                                }}
                              />
                            )}
                          </div>
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  tint,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tint: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-lg",
            tint,
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-[26px] font-semibold leading-none tabular-nums tracking-tight">
        {value}
      </p>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={cn("px-4 py-3 font-medium", className)}>{children}</th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}

function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

function relTime(iso: string): string {
  try {
    return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true });
  } catch {
    return "—";
  }
}
