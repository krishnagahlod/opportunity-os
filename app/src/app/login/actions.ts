"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getAppUrl() {
  const headersList = await headers();
  // Get host (includes port, e.g. localhost:3000 or opportunity-os.vercel.app)
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function signInWithGoogle(next?: string) {
  const supabase = await createClient();
  const appUrl = await getAppUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(next ?? "/")}`,
    },
  });

  if (error || !data?.url) {
    redirect(
      `/login?error=${encodeURIComponent(error?.message ?? "Google sign-in failed")}`,
    );
  }

  // Supabase returns the Google consent URL — bounce the browser there.
  redirect(data.url);
}

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const next = String(formData.get("next") ?? "/");

  if (!email) {
    redirect(`/login?error=${encodeURIComponent("Email is required")}`);
  }

  const supabase = await createClient();
  const appUrl = await getAppUrl();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/login?message=${encodeURIComponent("Check your email for the sign-in link.")}`,
  );
}
