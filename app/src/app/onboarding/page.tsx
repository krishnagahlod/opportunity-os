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
      {/* Decorative gradient orbs — soft, behind everything else. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-32 size-[460px] rounded-full bg-primary/15 blur-[160px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-1/2 size-[400px] rounded-full bg-fuchsia-500/15 blur-[160px]"
      />

      <main className="relative mx-auto max-w-2xl px-5 pb-32 pt-10 sm:px-6 sm:pt-16">
        {/* Logo — small, top-left */}
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-sm">
            <Sparkles className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Opportunity <span className="text-muted-foreground">OS</span>
          </span>
        </div>

        {/* Hero — display typography, gradient accent on the noun */}
        <header className="mt-14 sm:mt-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            Set up your account · ~60 seconds
          </p>
          <h1 className="mt-3 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Tune your{" "}
            <span className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              opportunity feed
            </span>
            .
          </h1>
          <p className="mt-4 max-w-md text-pretty text-base text-muted-foreground">
            Tell us about yourself once. We&apos;ll surface only the
            opportunities you&apos;d actually click on.
          </p>
        </header>

        <div className="mt-10 sm:mt-14">
          <OnboardingForm
            userId={user.id}
            initialEmail={profile?.email ?? user.email ?? ""}
            initialName={profile?.full_name ?? ""}
          />
        </div>
      </main>
    </div>
  );
}
