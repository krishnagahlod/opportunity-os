"use client";

import { Check, X, ShieldCheck, Zap } from "lucide-react";

export function FeatureComparisonSection() {
  const comparisons = [
    {
      feature: "Multi-Platform Coverage",
      traditional: "Single platform only (LinkedIn, Naukri, or Unstop)",
      opportunityOS: "50+ continuous networks (Greenhouse, Lever, Ashby, YC, HN, Devpost)",
    },
    {
      feature: "Resume-Matched Scoring",
      traditional: "Basic keyword match or none (1,000+ uncurated results)",
      opportunityOS: "0–100 Deep Semantic Match Scoring (Skill Fit, Value, Actionability)",
    },
    {
      feature: "Recruiter Contact Access",
      traditional: "HR portal black hole with 500+ unreviewed applicants",
      opportunityOS: "Hunter.io verified hiring manager & founder email addresses",
    },
    {
      feature: "Cold Email Generation",
      traditional: "Generic ChatGPT copy-paste templates",
      opportunityOS: "Project-tailored cold outreach highlighting your actual tech stack",
    },
    {
      feature: "Anti-Spam Feed Balance",
      traditional: "Flooded with 100 listings from a single mass-recruiter",
      opportunityOS: "Strict employer diversity limits (max 3 roles per company)",
    },
    {
      feature: "Campus Academic Tier",
      traditional: "No student domain perks",
      opportunityOS: "Instant auto-verification for @iitb.ac.in and partner colleges",
    },
    {
      feature: "Pricing Model",
      traditional: "Sneaky recurring credit card subscriptions",
      opportunityOS: "Transparent one-time career passes (₹299 for 30d, ₹799 for 90d)",
    },
  ];

  return (
    <section className="py-24 border-b border-zinc-200/80 bg-white">
      <div className="mx-auto max-w-5xl px-4 space-y-16">
        <div className="mx-auto max-w-2xl text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-700">
            <Zap className="size-3.5 text-blue-600" />
            <span>Why Opportunity OS Wins</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 leading-tight">
            Built for students who want unfair placement velocity.
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            See how Opportunity OS compares to traditional manual job hunting.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50/80 font-mono text-[11px] uppercase text-zinc-500">
              <tr>
                <th className="py-3.5 px-4 sm:px-6 font-bold text-zinc-900">Feature</th>
                <th className="py-3.5 px-4 sm:px-6 font-semibold">Traditional Portals</th>
                <th className="py-3.5 px-4 sm:px-6 font-bold text-blue-700 bg-blue-50/50">Opportunity OS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 font-medium">
              {comparisons.map((item) => (
                <tr key={item.feature} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="py-4 px-4 sm:px-6 font-bold text-zinc-900">{item.feature}</td>
                  <td className="py-4 px-4 sm:px-6 text-zinc-500 flex items-start gap-2">
                    <X className="size-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{item.traditional}</span>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-zinc-900 font-semibold bg-blue-50/30">
                    <div className="flex items-start gap-2">
                      <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item.opportunityOS}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
