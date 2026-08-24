"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Sparkles,
  ShieldCheck,
  CreditCard,
  Laptop,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LogOut,
  Calendar,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/paywall/UpgradeModal";
import type { PaymentTransaction, UserEntitlementState, UserSession } from "@/types/db";
import { format } from "date-fns";

export function BillingClient({
  entitlement,
  sessions,
  transactions,
  userEmail,
}: {
  entitlement: UserEntitlementState;
  sessions: UserSession[];
  transactions: PaymentTransaction[];
  userEmail?: string | null;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [sessionList, setSessionList] = useState<UserSession[]>(sessions);
  const [revoking, setRevoking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const status = searchParams.get("status");
    const paymentId = searchParams.get("payment_id");

    if (status === "success" || paymentId) {
      setPaymentSuccess(true);
      setMsg("🎉 Payment successful! Your Opportunity OS Pro pass is active.");
      // Clean query params from URL
      router.replace("/settings/billing");
    }
  }, [searchParams, router]);

  async function handleRevokeOthers() {
    setRevoking(true);
    setMsg(null);
    try {
      const res = await fetch("/api/account/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke_others" }),
      });
      if (res.ok) {
        setMsg("All other device sessions have been successfully signed out.");
        // Refresh local session state
        const sessionRes = await fetch("/api/account/sessions");
        if (sessionRes.ok) {
          const data = await sessionRes.json();
          setSessionList(data.sessions || []);
        }
      }
    } catch (e: any) {
      setMsg("Failed to revoke sessions: " + e.message);
    } finally {
      setRevoking(false);
    }
  }

  const isPro = entitlement.isPro;
  const isIITB = entitlement.isIITB;

  return (
    <div className="space-y-8 animate-fade-up">
      {/* 1. Plan Overview Card */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Sparkles className="size-3.5" />
                {entitlement.displayName}
              </span>
              {isPro && (
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Active
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {isPro
                ? "Opportunity OS Pro Member"
                : isIITB
                ? "IIT Bombay Verified Partner Access"
                : "Free Explorer Tier"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              {isPro
                ? `You have unrestricted access to all 1,000+ opportunities, direct hiring manager contact info, and AI cold outreach drafts.`
                : isIITB
                ? `Your verified @iitb.ac.in account enjoys full platform capabilities with fair-use limits.`
                : `You are on the free tier with 25 visible opportunities and 10 searches/day.`}
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:items-end gap-2">
            {entitlement.expiresAt && (
              <div className="text-left sm:text-right">
                <span className="text-xs text-muted-foreground">Expires On</span>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="size-4 text-primary" />
                  {format(new Date(entitlement.expiresAt), "dd MMM yyyy")}
                </p>
                {entitlement.daysRemaining !== null && (
                  <span className="text-xs text-primary font-medium">
                    ({entitlement.daysRemaining} days remaining)
                  </span>
                )}
              </div>
            )}

            <Button
              onClick={() => setUpgradeModalOpen(true)}
              className="mt-2 font-semibold shadow-sm gap-1.5"
            >
              {isPro ? "Extend Pro Pass" : "Upgrade to Pro"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Usage Quotas & Limits */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Zap className="size-4 text-primary" /> Feature Usage This Period
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Daily Searches */}
          <div className="rounded-xl border border-border/60 bg-background/50 p-4">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-semibold text-foreground">Daily Searches</span>
              <span className="text-muted-foreground">
                {entitlement.limits.search_query?.limitValue === -1
                  ? "Unlimited"
                  : `${entitlement.usage.search_query || 0} / ${entitlement.limits.search_query?.limitValue || 10}`}
              </span>
            </div>
            {entitlement.limits.search_query?.limitValue !== -1 && (
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      ((entitlement.usage.search_query || 0) /
                        (entitlement.limits.search_query?.limitValue || 10)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            )}
          </div>

          {/* Monthly AI Cold Outreach */}
          <div className="rounded-xl border border-border/60 bg-background/50 p-4">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-semibold text-foreground">Monthly AI Cold Outreach Drafts</span>
              <span className="text-muted-foreground">
                {entitlement.limits.ai_cold_outreach?.limitValue === -1
                  ? "Unlimited"
                  : `${entitlement.usage.ai_cold_outreach || 0} / ${entitlement.limits.ai_cold_outreach?.limitValue || 2}`}
              </span>
            </div>
            {entitlement.limits.ai_cold_outreach?.limitValue !== -1 && (
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      ((entitlement.usage.ai_cold_outreach || 0) /
                        (entitlement.limits.ai_cold_outreach?.limitValue || 2)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Device Sessions & Anti-Sharing */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Laptop className="size-4 text-primary" /> Active Device Sessions
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              You can use your account across up to 3 active devices simultaneously.
            </p>
          </div>
          {sessionList.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeOthers}
              disabled={revoking}
              className="text-xs gap-1.5"
            >
              <LogOut className="size-3.5" />
              Sign out all other devices
            </Button>
          )}
        </div>

        {msg && (
          <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400">
            {msg}
          </div>
        )}

        <div className="divide-y divide-border/50 rounded-xl border border-border/60 bg-background/50 overflow-hidden">
          {sessionList.map((s) => (
            <div key={s.id} className="p-4 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                {/mobile|iphone|android/i.test(s.device_name || "") ? (
                  <Smartphone className="size-5 text-muted-foreground shrink-0" />
                ) : (
                  <Laptop className="size-5 text-muted-foreground shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-foreground">{s.device_name || "Web Browser"}</p>
                  <p className="text-muted-foreground text-[11px]">
                    Last active: {format(new Date(s.last_seen_at), "dd MMM yyyy, hh:mm a")}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500">
                <CheckCircle2 className="size-3" /> Active
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Payment History */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <CreditCard className="size-4 text-primary" /> Payment History
        </h3>
        {transactions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No transactions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 font-semibold">Date</th>
                  <th className="py-2.5 font-semibold">Plan</th>
                  <th className="py-2.5 font-semibold">Amount</th>
                  <th className="py-2.5 font-semibold">Reference</th>
                  <th className="py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {transactions.map((t) => (
                  <tr key={t.id} className="text-foreground">
                    <td className="py-3 text-muted-foreground">
                      {format(new Date(t.created_at), "dd MMM yyyy")}
                    </td>
                    <td className="py-3 font-medium uppercase">{t.plan_key.replace("pro_", "Pro ")}</td>
                    <td className="py-3 font-semibold">₹{(t.amount / 100).toFixed(0)}</td>
                    <td className="py-3 font-mono text-[11px] text-muted-foreground">
                      {t.provider_order_id}
                    </td>
                    <td className="py-3">
                      {t.status === "paid" ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                          Paid
                        </span>
                      ) : t.status === "created" || t.status === "pending" ? (
                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                          Initiated (Unpaid)
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-destructive">
                          {t.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        userEmail={userEmail}
      />
    </div>
  );
}
