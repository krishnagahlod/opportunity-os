import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NavBar } from "@/components/NavBar";
import Link from "next/link";
import { ArrowLeft, CreditCard, Sparkles, TrendingUp, Users, GraduationCap, Clock, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Subscriptions & Revenue | Admin | Opportunity OS",
  description: "Monitor paid conversion, transaction ledger, and admin audit events.",
};

export default async function AdminSubscriptionsPage() {
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

  const adminSupabase = createAdminClient();

  // Fetch subscriptions, transactions, and audit logs
  const [
    { data: transactions },
    { data: entitlements },
    { data: auditLogs },
  ] = await Promise.all([
    adminSupabase
      .from("payment_transactions")
      .select("*, user:profiles(email, full_name)")
      .order("created_at", { ascending: false })
      .limit(50),
    adminSupabase
      .from("entitlements")
      .select("*")
      .eq("status", "active"),
    adminSupabase
      .from("admin_audit_logs")
      .select("*, admin:profiles!admin_audit_logs_admin_user_id_fkey(email), target:profiles!admin_audit_logs_target_user_id_fkey(email)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const activeList = entitlements || [];
  const paidTransactions = (transactions || []).filter((t) => t.status === "paid");
  const totalRevenuePaise = paidTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);

  const activeProCount = activeList.filter((e) => e.plan_key.startsWith("pro_") || e.plan_key === "lifetime").length;
  const activeIITBCount = activeList.filter((e) => e.plan_key === "iitb_free").length;
  const activeFreeCount = activeList.filter((e) => e.plan_key === "free").length;

  return (
    <div className="min-h-screen">
      <NavBar email={user.email} isAdmin={true} />
      <main id="main" className="mx-auto max-w-6xl px-4 py-10 space-y-8 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <CreditCard className="size-6 text-primary" /> Subscriptions & Revenue
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Real-time transaction ledger, Pro subscription metrics, and admin audit trail.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin/users">
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <Users className="size-3.5" /> User Directory
              </Button>
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
              <TrendingUp className="size-4 text-emerald-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">
              ₹{(totalRevenuePaise / 100).toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">{paidTransactions.length} successful transactions</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Pro Passes</span>
              <Sparkles className="size-4 text-primary" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{activeProCount}</p>
            <p className="text-[11px] text-primary font-medium mt-1">Paid subscribers & grants</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">IITB Verified</span>
              <GraduationCap className="size-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{activeIITBCount}</p>
            <p className="text-[11px] text-muted-foreground mt-1">@iitb.ac.in academic tier</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Free Explorers</span>
              <Users className="size-4 text-muted-foreground" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{activeFreeCount}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Base tier user base</p>
          </div>
        </div>

        {/* Transactions Ledger */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <CreditCard className="size-4 text-primary" /> Payment Transactions
          </h3>
          {transactions && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border text-muted-foreground uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 font-semibold">Date</th>
                    <th className="py-2.5 font-semibold">User</th>
                    <th className="py-2.5 font-semibold">Plan</th>
                    <th className="py-2.5 font-semibold">Amount</th>
                    <th className="py-2.5 font-semibold">Order ID</th>
                    <th className="py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {transactions.map((t: any) => (
                    <tr key={t.id} className="text-foreground hover:bg-muted/20">
                      <td className="py-3 text-muted-foreground">
                        {format(new Date(t.created_at), "dd MMM yyyy, hh:mm a")}
                      </td>
                      <td className="py-3 font-medium">
                        {t.user?.email || t.user_id}
                      </td>
                      <td className="py-3 uppercase font-semibold text-primary">
                        {t.plan_key.replace("pro_", "Pro ")}
                      </td>
                      <td className="py-3 font-bold">
                        ₹{(t.amount / 100).toFixed(0)}
                      </td>
                      <td className="py-3 font-mono text-[11px] text-muted-foreground">
                        {t.provider_order_id}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            t.status === "paid"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : t.status === "failed"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No payments recorded yet.</p>
          )}
        </div>

        {/* Admin Audit Trail */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" /> Admin Audit Log
          </h3>
          {auditLogs && auditLogs.length > 0 ? (
            <div className="divide-y divide-border/50 text-xs">
              {auditLogs.map((log: any) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-foreground uppercase text-[11px] mr-2">
                      {log.action.replace("_", " ")}:
                    </span>
                    <span className="text-muted-foreground">
                      Target: <strong className="text-foreground">{log.target?.email || log.target_user_id || "System"}</strong>
                    </span>
                    {log.reason && <p className="text-[11px] text-muted-foreground/80 mt-0.5">Reason: {log.reason}</p>}
                  </div>
                  <div className="text-[11px] text-muted-foreground shrink-0">
                    {format(new Date(log.created_at), "dd MMM yyyy, hh:mm a")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No admin actions recorded yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}
