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
      period: "one-time pass",
      desc: "Ideal for immediate off-campus discovery and active interview application sprints.",
      features: [
        "Full feed access across 1,200+ listings",
        "Resume-matched 0–100 scoring engine",
        "Company intelligence & Glassdoor ratings",
        "50 AI cold outreach drafts / month",
        "Hunter.io verified recruiter radar",
        "Up to 3 active device sessions",
      ],
      cta: "Get 30-Day Pass",
      popular: false,
    },
    {
      key: "pro_90d",
      name: "90-Day Semester Pass",
      price: "₹799",
      period: "one-time pass",
      desc: "The recommended choice for complete internship and placement season preparation.",
      features: [
        "Everything in 30-Day Pass",
        "Full semester coverage (90 days)",
        "Priority recruiter radar indexing",
        "150 AI cold outreach drafts",
        "Telegram & Email closing alerts",
        "Save 15% vs monthly passes",
      ],
      cta: "Get 90-Day Pass",
      popular: true,
    },
    {
      key: "pro_365d",
      name: "1-Year Career Pass",
      price: "₹2,499",
      period: "one-time pass",
      desc: "Comprehensive coverage across on-campus, off-campus, and fellowship cycles.",
      features: [
        "Everything in 90-Day Pass",
        "Full 365 days of continuous discovery",
        "Unlimited feed & priority indexing",
        "600 AI cold outreach drafts",
        "VIP support & fast-track feature requests",
        "Maximum value for placement year",
      ],
      cta: "Get 1-Year Pass",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 border-b border-zinc-200/80 bg-zinc-50/50">
      <div className="mx-auto max-w-6xl px-4 space-y-16">
        <div className="mx-auto max-w-2xl text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-700 shadow-2xs">
            <Zap className="size-3.5 text-blue-600 fill-blue-600" />
            <span>Transparent Career Passes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 leading-tight">
            One-time passes. Zero recurring traps.
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            No unexpected monthly auto-debits. Pay once via UPI (GPay, PhonePe, Paytm, QR) or Debit/Credit Cards and enjoy full uninterrupted access.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={cn(
                "relative rounded-2xl border p-7 flex flex-col justify-between transition-all bg-white",
                plan.popular
                  ? "border-zinc-900 shadow-lg ring-1 ring-zinc-900/10"
                  : "border-zinc-200/80 hover:border-zinc-300 shadow-sm"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-3 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-white shadow-xs">
                  Most Popular · Best Value
                </div>
              )}

              <div>
                <h3 className="text-base font-bold text-zinc-900">{plan.name}</h3>
                <p className="text-xs text-zinc-500 mt-1 min-h-[32px] leading-relaxed">{plan.desc}</p>

                <div className="mt-5 flex items-baseline gap-1.5 border-b border-zinc-100 pb-5">
                  <span className="text-3xl font-extrabold font-mono tracking-tight text-zinc-900">
                    {plan.price}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    / {plan.period}
                  </span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-zinc-700 font-medium">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
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
                      "w-full font-bold text-xs h-10 shadow-xs",
                      plan.popular ? "bg-zinc-900 hover:bg-zinc-800 text-white" : "border-zinc-300 text-zinc-900 hover:bg-zinc-50"
                    )}
                  >
                    {plan.cta} <ArrowRight className="size-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-xl text-center text-xs text-zinc-500 flex items-center justify-center gap-2 font-mono">
          <ShieldCheck className="size-4 text-emerald-600" />
          <span>Processed securely via Dodo Payments with 100% Indian UPI & Card support.</span>
        </div>
      </div>
    </section>
  );
}
