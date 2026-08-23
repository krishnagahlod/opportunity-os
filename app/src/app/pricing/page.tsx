import { NavBar } from "@/components/NavBar";
import { createClient } from "@/lib/supabase/server";
import { getUserEntitlement } from "@/lib/auth/entitlements";
import { PricingClient } from "./PricingClient";

export const metadata = {
  title: "Pricing & Career Passes | Opportunity OS",
  description: "Fixed-duration Pro passes for ambitious students & job seekers.",
};

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let entitlement = null;
  let isAdmin = false;

  if (user) {
    entitlement = await getUserEntitlement(user.id);
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
  }

  return (
    <div className="min-h-screen">
      <NavBar email={user?.email} isAdmin={isAdmin} />
      <PricingClient
        entitlement={entitlement}
        userEmail={user?.email}
        isLoggedIn={!!user}
      />
    </div>
  );
}
