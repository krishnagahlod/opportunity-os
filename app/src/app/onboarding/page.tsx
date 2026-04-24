import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.onboarded) redirect("/");

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome to Opportunity OS</h1>
          <p className="mt-2 text-muted-foreground">
            Tell us about yourself so we can surface the opportunities that
            actually matter to you. You can update this any time in settings.
          </p>
        </div>
        <OnboardingForm
          initialEmail={profile?.email ?? user.email ?? ""}
          initialName={profile?.full_name ?? ""}
        />
      </div>
    </div>
  );
}
