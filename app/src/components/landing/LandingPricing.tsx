"use client";

import Link from "next/link";
import { Check, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingPricing() {
  const plans = [
    {
      key: "pro_30d",
      name: "30-Day Sprint Pass",
      price: "₹299",
      period: "one-time payment",
      desc: "Perfect for active interview sprints and immediate off-campus discovery.",
      features: [
        "Unrestricted feed access (1,000+ listings)",
        "Resume-matched 0–100 scoring engine",
        "Company intelligence & Glassdoor ratings",
        "50 AI cold outreach emails / month",
        "Direct recruiter emails (Hunter.io)",
        "Up to 3 active device sessions",
      ],
      cta: "Get 30-Day Pass",
      popular: false,
    },
    {
      key: "pro_90d",
      name: "90-Day Semester Pass",
      price: "₹799",
      period: "one-time payment",
      desc: "The recommended choice for complete internship and placement preparation seasons.",
      features: [
        "Everything in 30-Day Pass",
        "Full semester coverage (3 months)",
        "Priority recruiter radar updates",
        "150 AI cold outreach drafts",
        "Telegram & Email instant closing alerts",
        "Save 15% vs monthly passes",
      ],
      cta: "Get 90-Day Pass",
      popular: true,
    },
    {
      key: "pro_365d",
      name: "1-Year Career Pass",
      price: "₹2,499",
      period: "one-time payment",
      desc: "Comprehensive coverage across on-campus, off-campus, and fellowship cycles.",
      features: [
        "Everything in 90-Day Pass",
        "Full 365 days of continuous discovery",
        "Unlimited feed & priority indexing",
        "600 AI cold outreach drafts",
        "VIP support & fast-track feature requests",
        "Maximum value for placement season",
      ],
      cta: "Get 1-Year Pass",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 border-b border-border/70 bg-background">
      <div className="mx-auto max-w-6xl px-4 space-y-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-primary">
            Transparent Career Passes
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            One-time passes. Zero recurring traps.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            No unexpected auto-debits. Pay once via UPI (GPay, PhonePe, Paytm, QR) or Debit/Credit Cards and enjoy complete peace of mind.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={cn(
                "relative rounded-2xl border p-7 flex flex-col justify-between transition-all",
                plan.popular
                  ? "border-primary bg-card shadow-xl ring-1 ring-primary/20"
                  : "border-border/80 bg-card/60 hover:border-border"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
                  Most Popular · Best Value
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">{plan.desc}</p>

                <div className="mt-6 flex items-baseline gap-1.5 border-b border-border/60 pb-6">
                  <span className="text-4xl font-extrabold font-mono tracking-tight text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    / {plan.period}
                  </span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-foreground/90 font-medium">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check className="size-4 text-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <Link href={`/login?next=/pricing`}>
                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className={cn(
                      "w-full font-bold text-xs h-11 shadow-xs",
                      plan.popular && "shadow-md"
                    )}
                  >
                    {plan.cta} <ArrowRight className="size-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-xl text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <ShieldCheck className="size-4 text-emerald-500" />
          <span>Secure checkout processed by Dodo Payments with 100% Indian UPI & Card support.</span>
        </div>
      </div>
    </section>
  );
}
