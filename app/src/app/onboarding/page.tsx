import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
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
    <div className="relative min-h-screen overflow-hidden bg-hero-radial dark:bg-hero-radial-dark">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-sm">
            <Sparkles className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Opportunity <span className="text-muted-foreground">OS</span>
          </span>
        </div>
        <div className="mt-8">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            Step 1 of 1 · Takes 90 seconds
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Let&apos;s tune your feed.
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            A few quick details so we only surface opportunities you actually
            care about. You can change these any time in settings.
          </p>
        </div>
        <div className="mt-10">
          <OnboardingForm
            userId={user.id}
            initialEmail={profile?.email ?? user.email ?? ""}
            initialName={profile?.full_name ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
