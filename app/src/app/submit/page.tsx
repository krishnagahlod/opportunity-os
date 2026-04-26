import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { SubmitForm } from "./SubmitForm";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
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

  return (
    <div className="min-h-screen">
      <NavBar email={user.email} isAdmin={profile.role === "admin"} />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
            Submit an opportunity
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Spotted something worth sharing?
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submitted opportunities go to an admin review queue. Once approved
            they appear in everyone&apos;s feed.
          </p>
        </header>
        <SubmitForm />
      </main>
    </div>
  );
}
