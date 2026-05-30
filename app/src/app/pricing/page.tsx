import { Check } from "lucide-react";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { createClient } from "@/lib/supabase/server";

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <NavBar email={user?.email} isAdmin={false} />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Upgrade your Career Intelligence
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Get instant alerts when your dream roles drop. Never miss an opportunity again.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {/* Free Tier */}
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-foreground">Free</h3>
            <p className="mt-2 text-sm text-muted-foreground">For casual hunting</p>
            <div className="mt-4 flex items-baseline text-4xl font-bold text-foreground">
              $0
              <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
            </div>
            <ul className="mt-8 space-y-3">
              <PricingFeature text="Full opportunity feed" />
              <PricingFeature text="AI Resume matching" />
              <PricingFeature text="Daily or Weekly digests" />
              <PricingFeature text="Standard opportunity insights" />
            </ul>
            <Link
              href="/"
              className="mt-8 block w-full rounded-md border border-border bg-background py-2 text-center text-sm font-medium hover:bg-muted"
            >
              Current Plan
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="rounded-2xl border-2 border-primary bg-card p-8 shadow-lg relative">
            <div className="absolute -top-4 right-8 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              Most Popular
            </div>
            <h3 className="text-xl font-semibold text-foreground">Pro</h3>
            <p className="mt-2 text-sm text-muted-foreground">For active job seekers</p>
            <div className="mt-4 flex items-baseline text-4xl font-bold text-foreground">
              $9
              <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
            </div>
            <ul className="mt-8 space-y-3">
              <PricingFeature text="Everything in Free" />
              <PricingFeature text="Premium Target Alerts (Instant)" />
              <PricingFeature text="AI 'Action Plan' strategies" />
              <PricingFeature text="Early access to new postings" />
            </ul>
            <button
              className="mt-8 block w-full rounded-md bg-primary py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function PricingFeature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <Check className="size-4 text-primary" />
      <span className="text-sm text-foreground">{text}</span>
    </li>
  );
}
