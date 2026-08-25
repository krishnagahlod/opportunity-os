"use client";

import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export function LiveSourcesStrip() {
  const sourcesRow1 = [
    { name: "Greenhouse API", type: "Enterprise ATS", status: "Active 24/7" },
    { name: "Lever ATS", type: "Top Tech Careers", status: "Active 24/7" },
    { name: "Y Combinator Jobs", type: "YC Startups", status: "Realtime" },
    { name: "Ashby HQ", type: "High-Growth SaaS", status: "Active 24/7" },
    { name: "Hacker News (Who's Hiring)", type: "Direct Founder Posts", status: "Monthly Sync" },
    { name: "Devpost Hackathons", type: "Global Competitions", status: "Hourly Sync" },
    { name: "Workday Enterprise", type: "Fortune 500", status: "Active 24/7" },
    { name: "Internshala Direct", type: "Pan-India Internships", status: "Hourly Sync" },
    { name: "Unstop Competitions", type: "Case Comps & PPIs", status: "Hourly Sync" },
  ];

  const sourcesRow2 = [
    { name: "Wellfound (AngelList)", type: "Early Stage Startups", status: "Active 24/7" },
    { name: "MLH Hackathons", type: "Official Student Leagues", status: "Hourly Sync" },
    { name: "Breezy HR", type: "Seed & Series A", status: "Active 24/7" },
    { name: "SmartRecruiters", type: "Global Enterprises", status: "Active 24/7" },
    { name: "Polywork / Tech Twitter", type: "Off-Campus Stealth Roles", status: "AI Monitored" },
    { name: "Ripen / Venture Fellows", type: "Fellowships & Grants", status: "Daily Sync" },
    { name: "Jobvite Networks", type: "Mid-Market Tech", status: "Active 24/7" },
    { name: "Reddit (r/cscareerquestions)", type: "Off-Campus Megathreads", status: "AI Monitored" },
  ];

  return (
    <section className="border-y border-zinc-200/80 bg-zinc-50/60 py-8 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900">
            Live Ingestion Pipeline (50+ Career Networks)
          </p>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-500">
          <span>Deduplicated via AI</span>
          <span className="text-zinc-300">|</span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <ShieldCheck className="size-3.5" /> 100% Verified Authentic
          </span>
        </div>
      </div>

      {/* Row 1 Infinite Moving Marquee */}
      <div className="mask-marquee overflow-hidden py-1.5">
        <div className="animate-marquee gap-3">
          {[...sourcesRow1, ...sourcesRow1].map((src, i) => (
            <div
              key={`${src.name}-${i}`}
              className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 shadow-2xs shrink-0 hover:border-zinc-300 hover:shadow-xs transition-all cursor-default"
            >
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-zinc-900 font-mono">{src.name}</span>
              <span className="text-[10px] text-zinc-400 font-mono">·</span>
              <span className="text-[10px] text-zinc-500 font-medium">{src.type}</span>
              <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[9px] font-mono font-semibold text-zinc-600">
                {src.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2 Reverse Infinite Moving Marquee */}
      <div className="mask-marquee overflow-hidden py-1.5 mt-2">
        <div className="animate-marquee-reverse gap-3">
          {[...sourcesRow2, ...sourcesRow2].map((src, i) => (
            <div
              key={`${src.name}-${i}`}
              className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 shadow-2xs shrink-0 hover:border-zinc-300 hover:shadow-xs transition-all cursor-default"
            >
              <span className="size-1.5 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-zinc-900 font-mono">{src.name}</span>
              <span className="text-[10px] text-zinc-400 font-mono">·</span>
              <span className="text-[10px] text-zinc-500 font-medium">{src.type}</span>
              <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[9px] font-mono font-semibold text-zinc-600">
                {src.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
