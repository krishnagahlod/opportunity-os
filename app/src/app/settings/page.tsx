import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { SettingsForm } from "./SettingsForm";
import { CalendarSection } from "./CalendarSection";
import type { Profile } from "@/types/db";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
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
  if (!profile?.onboarded) redirect("/onboarding");

  // Build the absolute base URL for the calendar feed. Prefer the configured
  // public URL (set in Vercel); fall back to deriving from the request host
  // so this works in dev too.
  const appUrl = await resolveAppUrl();

  return (
    <div className="min-h-screen">
      <NavBar email={user.email} isAdmin={profile.role === "admin"} />
      <main id="main" className="mx-auto max-w-2xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit your profile and notification preferences. Changes to interests
            or skills automatically refresh your personalized feed scores on the
            next page load.
          </p>
        </header>
        <SettingsForm profile={profile as Profile} />
        <div className="mt-10">
          <CalendarSection
            initialToken={(profile as Profile).calendar_token ?? null}
            appUrl={appUrl}
          />
        </div>
      </main>
    </div>
  );
}

async function resolveAppUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
