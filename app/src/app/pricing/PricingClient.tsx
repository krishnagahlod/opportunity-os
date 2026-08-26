"use client";

import { useState } from "react";
import { Check, Sparkles, ShieldCheck, Zap, ArrowRight, Loader2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/paywall/UpgradeModal";
import { cn } from "@/lib/utils";
import type { UserEntitlementState } from "@/types/db";
import Link from "next/link";

export function PricingClient({
  entitlement,
  userEmail,
  isLoggedIn,
}: {
  entitlement: UserEntitlementState | null;
  userEmail?: string | null;
  isLoggedIn: boolean;
}) {
  const [selectedDuration, setSelectedDuration] = useState<"pro_30d" | "pro_90d" | "pro_365d">("pro_90d");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const isPro = entitlement?.isPro || false;
  const isIITB = entitlement?.isIITB || false;

  const tiers = [
    {
      key: "pro_30d" as const,
      name: "30-Day Launch Pass",
      price: "₹299",
      period: "for 1 month",
      desc: "Perfect for active interview preparation and immediate opportunity matching.",
      popular: false,
    },
    {
      key: "pro_90d" as const,
      name: "90-Day Career Pass",
      price: "₹799",
      period: "for 3 months",
      desc: "Our most popular pass covering full recruitment seasons and summer internship cycles.",
      popular: true,
      badge: "MOST POPULAR",
    },
    {
      key: "pro_365d" as const,
      name: "1-Year Unlimited Pass",
      price: "₹2,499",
      period: "for 1 full year",
      desc: "Year-round priority intelligence, fellowship matching, and continuous outreach.",
      popular: false,
      badge: "BEST VALUE",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          <Zap className="size-3 text-primary fill-primary" /> Transparent Career Passes
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Supercharge your placement velocity.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
          Access the full database of 1,000+ opportunities, direct hiring manager contact info, and AI cold outreach generators with fixed-duration passes.
        </p>
      </div>

      {/* IIT Bombay Partner Banner */}
      {isIITB && (
        <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <GraduationCap className="size-6" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">IIT Bombay Partner Access Active</h3>
              <p className="text-xs text-muted-foreground">
                Your verified @iitb.ac.in account has full access to premium features at zero cost.
              </p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="border-emerald-500/40 hover:bg-emerald-500/20">
              Go to Feed
            </Button>
          </Link>
        </div>
      )}

      {/* Free vs Pro Comparison */}
      <div className="mt-16 grid gap-8 lg:grid-cols-3">
        {/* Free Plan */}
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground">Free Tier</h3>
            <p className="mt-1 text-xs text-muted-foreground">For casual hunting and discovery</p>
            <div className="mt-6 flex items-baseline text-4xl font-extrabold text-foreground">
              ₹0
              <span className="ml-1.5 text-xs font-medium text-muted-foreground">Forever</span>
            </div>

            <ul className="mt-8 space-y-3.5 text-xs text-foreground/90">
              <FeatureItem text="Top 25 curated feed opportunities" />
              <FeatureItem text="10 live database searches / day" />
              <FeatureItem text="2 AI cold email drafts / month" />
              <FeatureItem text="Standard daily email digest" />
              <FeatureItem text="Application tracker & saving" />
              <FeatureItem text="Masked contact emails" muted />
              <FeatureItem text="Deep company intelligence & trust scores" muted />
              <FeatureItem text="AI action plan interview prep" muted />
            </ul>
          </div>

          <div className="mt-8">
            <Button variant="outline" disabled={!isLoggedIn || (!isPro && !isIITB)} className="w-full">
              {!isLoggedIn ? "Get Started Free" : isPro || isIITB ? "Base Tier" : "Current Plan"}
            </Button>
          </div>
        </div>

        {/* Pro Passes (2 cards or highlighted selector) */}
        {tiers.slice(0, 2).map((tier) => (
          <div
            key={tier.key}
            className={cn(
              "relative rounded-3xl border bg-card p-8 shadow-lg flex flex-col justify-between transition-all",
              tier.popular
                ? "border-primary ring-2 ring-primary/20 shadow-primary/5"
                : "border-border"
            )}
          >
            {tier.badge && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
                {tier.badge}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                <Sparkles className="size-5 text-primary" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{tier.desc}</p>
              
              <div className="mt-6 flex items-baseline text-4xl font-extrabold text-foreground">
                {tier.price}
                <span className="ml-1.5 text-xs font-medium text-muted-foreground">{tier.period}</span>
              </div>

              <ul className="mt-8 space-y-3.5 text-xs text-foreground/90">
                <FeatureItem text="Full 1,000+ unrestricted opportunity feed" highlight />
                <FeatureItem text="Unlimited live database searches & filters" highlight />
                <FeatureItem text="Verified hiring manager emails & leads" highlight />
                <FeatureItem text="50 AI cold email outreach drafts / month" highlight />
                <FeatureItem text="Deep Company Intelligence & Trust Scores" highlight />
                <FeatureItem text="AI Action Plan application strategy" highlight />
                <FeatureItem text="Priority instant Telegram & email alerts" highlight />
                <FeatureItem text="3 simultaneous active device sessions" highlight />
              </ul>
            </div>

            <div className="mt-8">
              {isLoggedIn ? (
                <Button
                  onClick={() => {
                    setSelectedDuration(tier.key);
                    setUpgradeModalOpen(true);
                  }}
                  className="w-full font-semibold gap-2 shadow-md"
                >
                  {isPro ? "Extend Pass" : "Upgrade to Pro"} <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Link href="/login?next=/pricing">
                  <Button className="w-full font-semibold">Sign in to Upgrade</Button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Annual Pass Feature Banner */}
      <div className="mt-12 rounded-3xl border border-border bg-card/60 p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
            BEST VALUE FOR 2026/2027 CYCLES
          </span>
          <h3 className="text-xl font-bold text-foreground">1-Year Unlimited Career Pass (₹2,499)</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Covers 365 days of all internships, hackathons, fellowships, and full-time hiring waves + 100 AI drafts/mo. Only ₹208/month.
          </p>
        </div>
        {isLoggedIn ? (
          <Button
            onClick={() => {
              setSelectedDuration("pro_365d");
              setUpgradeModalOpen(true);
            }}
            variant="default"
            className="shrink-0 gap-2"
          >
            Get Annual Pass <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Link href="/login?next=/pricing">
            <Button className="shrink-0">Sign in to Get Annual Pass</Button>
          </Link>
        )}
      </div>

      {/* Safety Guarantee */}
      <div className="mt-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
        <ShieldCheck className="size-4 text-emerald-500" />
        <span>One-time fixed payment. No recurring credit card auto-debits. 100% secure payment via Dodo Payments (UPI & Cards).</span>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        userEmail={userEmail}
      />
    </div>
  );
}

function FeatureItem({ text, muted, highlight }: { text: string; muted?: boolean; highlight?: boolean }) {
  return (
    <li className={cn("flex items-start gap-2.5", muted && "text-muted-foreground/60 line-through")}>
      <Check className={cn("size-3.5 shrink-0 mt-0.5", highlight ? "text-primary font-bold" : muted ? "text-muted-foreground/40" : "text-emerald-500")} />
      <span className={cn(highlight && "font-medium text-foreground")}>{text}</span>
    </li>
  );
}
