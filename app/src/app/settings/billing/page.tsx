import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { getUserEntitlement } from "@/lib/auth/entitlements";
import { getUserActiveSessions } from "@/lib/auth/sessions";
import { BillingClient } from "./BillingClient";
import type { PaymentTransaction, Profile } from "@/types/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Billing & Subscription | Opportunity OS",
  description: "Manage your active subscription, passes, and device sessions.",
};

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/settings/billing");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarded) redirect("/onboarding");

  const [entitlement, sessions, { data: transactions }] = await Promise.all([
    getUserEntitlement(user.id),
    getUserActiveSessions(user.id),
    supabase
      .from("payment_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="min-h-screen">
      <NavBar email={user.email} isAdmin={profile.role === "admin"} />
      <main id="main" className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/settings"
            className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Billing & Subscription
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Review your active pass, quota consumption, and authorized device sessions.
            </p>
          </div>
        </div>

        <BillingClient
          entitlement={entitlement}
          sessions={sessions}
          transactions={(transactions as PaymentTransaction[]) || []}
          userEmail={user.email}
        />
      </main>
    </div>
  );
}
