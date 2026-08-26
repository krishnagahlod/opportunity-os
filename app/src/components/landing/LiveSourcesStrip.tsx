"use client";

import { ShieldCheck } from "lucide-react";

export function LiveSourcesStrip() {
  const sources = [
    { name: "Greenhouse API", type: "Enterprise ATS", status: "Active 24/7" },
    { name: "Lever ATS", type: "Top Tech Careers", status: "Active 24/7" },
    { name: "Y Combinator Jobs", type: "YC Startups", status: "Realtime" },
    { name: "Ashby HQ", type: "High-Growth SaaS", status: "Active 24/7" },
    { name: "Hacker News (Who's Hiring)", type: "Direct Founder Posts", status: "Monthly Sync" },
    { name: "Devpost Hackathons", type: "Global Competitions", status: "Hourly Sync" },
    { name: "Workday Enterprise", type: "Fortune 500", status: "Active 24/7" },
    { name: "Internshala Direct", type: "Pan-India Internships", status: "Hourly Sync" },
    { name: "Unstop Competitions", type: "Case Comps & PPIs", status: "Hourly Sync" },
    { name: "Wellfound (AngelList)", type: "Early Stage Startups", status: "Active 24/7" },
    { name: "MLH Hackathons", type: "Official Student Leagues", status: "Hourly Sync" },
    { name: "Breezy HR", type: "Seed & Series A", status: "Active 24/7" },
    { name: "SmartRecruiters", type: "Global Enterprises", status: "Active 24/7" },
  ];

  return (
    <section className="border-y border-zinc-200/80 bg-zinc-50/70 py-6 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-900">
            Live Ingestion Pipeline (50+ Career Networks)
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500">
          <span>AI Deduplicated</span>
          <span className="text-zinc-300">·</span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <ShieldCheck className="size-3.5" /> 100% Authentic Postings
          </span>
        </div>
      </div>

      {/* Single Smooth Moving Marquee Row (Gliding Leftwards) */}
      <div className="mask-marquee overflow-hidden py-1">
        <div className="animate-marquee gap-3">
          {[...sources, ...sources].map((src, i) => (
            <div
              key={`${src.name}-${i}`}
              className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 shadow-2xs shrink-0 hover:border-zinc-300 hover:shadow-xs transition-all cursor-default"
            >
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-zinc-900 font-mono">{src.name}</span>
              <span className="text-[10px] text-zinc-300 font-mono">·</span>
              <span className="text-[11px] text-zinc-500 font-medium">{src.type}</span>
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-mono font-bold text-zinc-600">
                {src.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
