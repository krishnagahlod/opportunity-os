import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";

export const metadata = {
  title: "Admin Analytics | Opportunity Finder",
};

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  // 1. Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  // 2. Fetch Data
  const { data: sourceStats } = await supabase
    .from("source_quality_stats")
    .select("*")
    .order("total_saves", { ascending: false });

  // 7-day ingestion stats
  const sevenDaysAgo = subDays(new Date(), 7).toISOString();
  const { data: logs } = await supabase
    .from("ingestion_logs")
    .select("source_id, items_found, items_inserted, error, created_at, status")
    .gte("created_at", sevenDaysAgo);

  // 3. Aggregate Data
  const sources: any[] = sourceStats || [];
  const logData: any[] = logs || [];

  // Group logs by source
  const ingestionBySource = logData.reduce((acc, log) => {
    if (!acc[log.source_id]) {
      acc[log.source_id] = { fetched: 0, inserted: 0, errors: 0, runs: 0 };
    }
    acc[log.source_id].runs += 1;
    acc[log.source_id].fetched += (log.items_found || 0);
    acc[log.source_id].inserted += (log.items_inserted || 0);
    if (log.status === 'error' || log.error) {
      acc[log.source_id].errors += 1;
    }
    return acc;
  }, {} as Record<string, { fetched: number; inserted: number; errors: number; runs: number }>);

  // Global totals
  const totalOpps = sources.reduce((sum: number, s: any) => sum + s.total_opps, 0);
  const totalSaves = sources.reduce((sum: number, s: any) => sum + s.total_saves, 0);
  const totalApplies = sources.reduce((sum: number, s: any) => sum + s.total_applies, 0);
  const totalDismisses = sources.reduce((sum: number, s: any) => sum + s.total_dismisses, 0);

  const totalFetched7d = Object.values(ingestionBySource).reduce((sum: number, s: any) => sum + s.fetched, 0);
  const totalInserted7d = Object.values(ingestionBySource).reduce((sum: number, s: any) => sum + s.inserted, 0);

  // Identify noisy sources (High insert volume, 0 saves)
  const noisySources = sources.filter(
    (s: any) => s.total_opps > 20 && s.total_saves === 0
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/admin"
          className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Source quality and pipeline metrics</p>
        </div>
      </div>

      {/* Global Pipeline Funnel */}
      <div className="mb-12">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Pipeline Overview (All Time)</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard title="Total Opps (Alive)" value={totalOpps} icon={<CheckCircle2 className="size-4 text-emerald-500" />} />
          <StatCard title="Saved" value={totalSaves} icon={<TrendingUp className="size-4 text-blue-500" />} />
          <StatCard title="Applied" value={totalApplies} icon={<TrendingUp className="size-4 text-indigo-500" />} />
          <StatCard title="Dismissed" value={totalDismisses} icon={<AlertTriangle className="size-4 text-orange-500" />} />
        </div>
      </div>

      <div className="mb-12">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Ingestion Last 7 Days</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
          <StatCard title="Total Fetched (Scraped)" value={totalFetched7d} />
          <StatCard title="Total Inserted (Passed Quality)" value={totalInserted7d} />
        </div>
      </div>

      {/* Noisy Sources Warning */}
      {noisySources.length > 0 && (
        <div className="mb-12 rounded-xl border border-destructive/20 bg-destructive/5 p-6">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert className="size-5 text-destructive" />
            <h2 className="text-lg font-semibold text-destructive">Noisy / Dead Sources</h2>
          </div>
          <p className="mb-4 text-sm text-destructive/80">
            These sources have injected high volumes of opportunities but generated 0 saves. Consider disabling or tuning their prompts.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {noisySources.map(s => (
              <div key={s.source_id} className="rounded-lg border border-destructive/20 bg-background/50 p-4">
                <p className="font-medium">{s.name}</p>
                <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                  <span>Inserted: {s.total_opps}</span>
                  <span className="text-destructive font-medium">Saves: {s.total_saves}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Source Leaderboard</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Source</th>
                  <th className="px-6 py-4 font-medium">Opps</th>
                  <th className="px-6 py-4 font-medium">Saves</th>
                  <th className="px-6 py-4 font-medium">Applies</th>
                  <th className="px-6 py-4 font-medium">Dismisses</th>
                  <th className="px-6 py-4 font-medium border-l border-border/50">7d Fetched</th>
                  <th className="px-6 py-4 font-medium">7d Inserted</th>
                  <th className="px-6 py-4 font-medium text-destructive">7d Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sources.map((s) => {
                  const stats = ingestionBySource[s.source_id] || { fetched: 0, inserted: 0, errors: 0, runs: 0 };
                  
                  // Highlight row if high value
                  const isHighValue = s.total_saves > 10;
                  
                  return (
                    <tr key={s.source_id} className={cn("transition-colors hover:bg-muted/50", isHighValue && "bg-blue-500/5")}>
                      <td className="px-6 py-4 font-medium">{s.name} {isHighValue && "🌟"}</td>
                      <td className="px-6 py-4 text-muted-foreground">{s.total_opps}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{s.total_saves}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{s.total_applies}</td>
                      <td className="px-6 py-4 text-muted-foreground">{s.total_dismisses}</td>
                      
                      <td className="px-6 py-4 text-muted-foreground border-l border-border/50">{stats.fetched}</td>
                      <td className="px-6 py-4 text-muted-foreground">{stats.inserted}</td>
                      <td className="px-6 py-4 font-medium text-destructive">{stats.errors > 0 ? stats.errors : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-muted-foreground">
        <p className="text-xs font-medium uppercase tracking-wider">{title}</p>
        {icon}
      </div>
      <p className="text-3xl font-bold tracking-tight">{value.toLocaleString()}</p>
    </div>
  );
}
