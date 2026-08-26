import { redirect } from "next/navigation";
import { Zap, GraduationCap, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";
import Link from "next/link";

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

  const isIITB = user.email?.toLowerCase().endsWith("@iitb.ac.in") || profile?.email?.toLowerCase().endsWith("@iitb.ac.in");

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-zinc-900 selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* Top Navbar */}
      <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-sm text-zinc-900 tracking-tight">
            <span className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 text-white font-mono text-xs shadow-2xs">
              <Zap className="size-4 fill-current" />
            </span>
            <span>Opportunity OS</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Step 1 of 1 · Profile Initialization</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        {/* IIT Bombay Verified Banner */}
        {isIITB && (
          <div className="mb-8 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 sm:p-5 flex items-center gap-3.5 shadow-xs text-left">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0 shadow-2xs">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900 uppercase font-mono">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                <span>IIT Bombay Academic Partner Access Verified</span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                Your @iitb.ac.in account is automatically unlocked with full Pro Career Pass access at zero cost.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="text-left space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-mono font-semibold text-zinc-700 shadow-2xs">
            <Zap className="size-3 text-blue-600 fill-blue-600" />
            <span>Profile & Preference Calibration</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl leading-tight">
            Tune your opportunity feed.
          </h1>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-lg">
            Upload your resume or select your core interests once. Our AI scoring engine will continuously rank 1,000+ live openings against your exact profile.
          </p>
        </header>

        {/* Form Container */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
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
