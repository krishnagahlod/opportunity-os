import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NavBar } from "@/components/NavBar";
import { AdminUsersClient } from "./AdminUsersClient";
import Link from "next/link";
import { ArrowLeft, Users, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "User Management | Admin | Opportunity OS",
  description: "Inspect user access, entitlements, active sessions, and manual overrides.",
};

export default async function AdminUsersPage() {
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

  // Fetch users and active entitlements
  const [{ data: profiles }, { data: entitlements }] = await Promise.all([
    adminSupabase
      .from("profiles")
      .select("id, email, full_name, college, role, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    adminSupabase
      .from("entitlements")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false }),
  ]);

  const activeEntitlementByUser = new Map<string, any>();
  if (entitlements) {
    for (const ent of entitlements) {
      if (!activeEntitlementByUser.has(ent.user_id)) {
        activeEntitlementByUser.set(ent.user_id, ent);
      }
    }
  }

  const userList = (profiles || []).map((p) => ({
    ...p,
    activeEntitlement: activeEntitlementByUser.get(p.id) || null,
  }));

  return (
    <div className="min-h-screen">
      <NavBar email={user.email} isAdmin={true} />
      <main id="main" className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Users className="size-6 text-primary" /> User Directory & Access Control
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Inspect accounts, manage Pro passes, review IIT Bombay auto-verification, and reset sessions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin/subscriptions">
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <CreditCard className="size-3.5" /> Subscriptions & Revenue
              </Button>
            </Link>
          </div>
        </div>

        <AdminUsersClient users={userList} />
      </main>
    </div>
  );
}
