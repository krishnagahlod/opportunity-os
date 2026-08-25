"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Building2,
  Star,
  Mail,
  Zap,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DemoOpportunity {
  id: string;
  title: string;
  company: string;
  category: "Internship" | "Fulltime" | "Fellowship" | "Hackathon";
  location: string;
  stipend: string;
  deadline: string;
  urgency: string;
  fitScore: number;
  matchReason: string;
  missingSkills: string[];
  glassdoor: number;
  funding: string;
  recruiter: {
    name: string;
    role: string;
    email: string;
    verified: boolean;
  };
}

const DEMO_DATA: DemoOpportunity[] = [
  {
    id: "opp-1",
    title: "Associate Product Manager Intern",
    company: "Razorpay",
    category: "Internship",
    location: "Bengaluru, India (Hybrid)",
    stipend: "₹65,000 / mo",
    deadline: "Closing in 3 days",
    urgency: "urgent",
    fitScore: 94,
    matchReason: "Strong overlap with your Next.js payment integration and fintech projects.",
    missingSkills: ["SQL query optimization"],
    glassdoor: 4.3,
    funding: "Series F ($750M)",
    recruiter: {
      name: "Siddharth Rao",
      role: "Lead Tech Recruiter",
      email: "siddharth.r@razorpay.com",
      verified: true,
    },
  },
  {
    id: "opp-2",
    title: "Software Engineer (Founding Team)",
    company: "Linear",
    category: "Fulltime",
    location: "Remote (Global)",
    stipend: "$130k – $160k + Equity",
    deadline: "Closing in 5 days",
    urgency: "closing_soon",
    fitScore: 91,
    matchReason: "High correlation with your TypeScript performance work and reactive state systems.",
    missingSkills: ["Rust internals"],
    glassdoor: 4.8,
    funding: "Series B ($50M)",
    recruiter: {
      name: "Tuomas Artman",
      role: "Co-Founder & CTO",
      email: "tuomas@linear.app",
      verified: true,
    },
  },
  {
    id: "opp-3",
    title: "BCG ACE Strategy Case Competition 2026",
    company: "Boston Consulting Group",
    category: "Hackathon",
    location: "Pan-India · Open to All Colleges",
    stipend: "₹15,00,000 Prize + Fast-Track PPI",
    deadline: "12 days left",
    urgency: "normal",
    fitScore: 88,
    matchReason: "Matches your analytical leadership background and consulting interest tags.",
    missingSkills: ["Financial modeling"],
    glassdoor: 4.5,
    funding: "Enterprise Global",
    recruiter: {
      name: "BCG Campus Hiring Team",
      role: "Campus Relations India",
      email: "ace.india@bcg.com",
      verified: true,
    },
  },
  {
    id: "opp-4",
    title: "AI Research & Product Fellow",
    company: "Y Combinator Fellowship",
    category: "Fellowship",
    location: "San Francisco / Remote",
    stipend: "$500,000 Standard Deal + Mentorship",
    deadline: "Rolling Deadline",
    urgency: "rolling",
    fitScore: 86,
    matchReason: "Aligns with your autonomous agent experiments and open-source contributions.",
    missingSkills: ["Distributed training"],
    glassdoor: 4.9,
    funding: "Top Accelerator",
    recruiter: {
      name: "Garry Tan",
      role: "President & CEO",
      email: "garry@ycombinator.com",
      verified: true,
    },
  },
];

export function InteractiveFeedHero() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedId, setSelectedId] = useState<string>(DEMO_DATA[0].id);

  const filteredOpps = DEMO_DATA.filter((item) =>
    selectedCategory === "All" ? true : item.category === selectedCategory
  );

  const activeOpp = DEMO_DATA.find((item) => item.id === selectedId) || DEMO_DATA[0];

  return (
    <div className="relative mx-auto mt-12 w-full max-w-5xl">
      {/* Container Frame */}
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl">
        {/* Terminal / App Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-border/70 bg-muted/40 px-4 py-3 gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>opportunity-os.app/live-feed</span>
              <span className="rounded bg-muted px-1 py-0.2 text-[10px] text-muted-foreground font-mono">
                1,248 roles
              </span>
            </div>
          </div>

          {/* Interactive Category Filter Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-background/60 p-1">
            {["All", "Internship", "Fulltime", "Hackathon", "Fellowship"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                  selectedCategory === cat
                    ? "bg-foreground text-background shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Live Feed + Detail Inspection Workspace */}
        <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border/70 min-h-[460px]">
          {/* Left Column: Interactive Cards List */}
          <div className="lg:col-span-6 p-4 space-y-2.5 overflow-y-auto max-h-[500px]">
            <div className="flex items-center justify-between px-1 pb-1 text-[11px] font-medium text-muted-foreground">
              <span>Top Scored Matches (Demo Feed)</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold">
                Click any role to inspect
              </span>
            </div>

            {filteredOpps.map((opp) => {
              const isSelected = opp.id === activeOpp.id;
              return (
                <div
                  key={opp.id}
                  onClick={() => setSelectedId(opp.id)}
                  className={cn(
                    "group relative cursor-pointer rounded-xl border p-4 transition-all",
                    isSelected
                      ? "border-primary/80 bg-primary/5 shadow-xs"
                      : "border-border/70 bg-card hover:border-border hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {opp.company}
                        </span>
                        <span className="text-muted-foreground/40 text-xs">·</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            opp.category === "Internship" && "bg-sky-500/10 text-sky-600 dark:text-sky-400",
                            opp.category === "Fulltime" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                            opp.category === "Hackathon" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                            opp.category === "Fellowship" && "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                          )}
                        >
                          {opp.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
                        {opp.title}
                      </h4>
                    </div>

                    {/* Fit Score Ring / Pill */}
                    <div className="flex flex-col items-end shrink-0">
                      <span className="inline-flex items-center gap-1 rounded-md bg-foreground text-background px-2 py-0.5 text-xs font-mono font-bold">
                        <Zap className="size-3 text-amber-400 fill-amber-400" />
                        {opp.fitScore}%
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">Fit Score</span>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-2.5">
                    <span className="font-medium text-foreground">{opp.stipend}</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[11px]",
                        opp.urgency === "urgent" && "text-destructive font-medium",
                        opp.urgency === "closing_soon" && "text-amber-600 dark:text-amber-400 font-medium"
                      )}
                    >
                      <Clock className="size-3" />
                      {opp.deadline}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Deep Opportunity & Company Intelligence Inspector */}
          <div className="lg:col-span-6 p-5 bg-background/50 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-border/60 pb-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-primary">
                    AI Decision Analysis
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="size-3" /> Verified Opportunity
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground leading-snug">
                  {activeOpp.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <Building2 className="size-3.5" /> {activeOpp.company} · {activeOpp.location}
                </p>
              </div>

              {/* Match Rationale */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
                <p className="font-semibold text-primary mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" /> Why this role matches your resume:
                </p>
                <p className="text-foreground/90 leading-relaxed text-[11.5px]">
                  {activeOpp.matchReason}
                </p>
              </div>

              {/* Company Signals & Glassdoor Rating */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-border/70 bg-card p-3">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                    Company Sentiment
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-foreground flex items-center gap-1">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      {activeOpp.glassdoor} / 5.0
                    </span>
                    <span className="text-[10px] text-muted-foreground">Glassdoor</span>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-card p-3">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                    Growth / Funding
                  </span>
                  <span className="text-xs font-bold text-foreground truncate block">
                    {activeOpp.funding}
                  </span>
                </div>
              </div>

              {/* Verified Hiring Manager Contact */}
              <div className="rounded-xl border border-border/70 bg-card p-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Mail className="size-3.5 text-primary" /> Verified Hiring Contact
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 px-1.5 py-0.2 rounded font-bold">
                    Hunter.io 98%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <p className="font-semibold text-foreground">{activeOpp.recruiter.name}</p>
                    <p className="text-[11px] text-muted-foreground">{activeOpp.recruiter.role}</p>
                  </div>
                  <span className="font-mono text-[11px] bg-muted px-2 py-1 rounded text-foreground font-medium">
                    {activeOpp.recruiter.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct CTA */}
            <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted-foreground">
                Drop your resume to score 1,200+ live listings.
              </span>
              <Link href="/login">
                <Button size="sm" className="font-semibold text-xs gap-1.5 shrink-0 shadow-sm">
                  Get Full Feed <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
