"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Zap,
  ShieldCheck,
  Building2,
  Clock,
  Star,
  Mail,
  Copy,
  Check,
  SlidersHorizontal,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  MapPin,
  Briefcase,
  Command,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DemoRole {
  id: string;
  title: string;
  company: string;
  category: "Internship" | "Fulltime" | "Fellowship" | "Hackathon";
  location: "Bengaluru" | "Remote" | "Mumbai" | "San Francisco" | "Delhi NCR";
  stipend: string;
  deadline: string;
  urgency: "urgent" | "closing_soon" | "normal" | "rolling";
  fitScore: number;
  tags: string[];
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

const DEMO_ROLES: DemoRole[] = [
  {
    id: "opp-rzp",
    title: "Associate Product Manager Intern",
    company: "Razorpay",
    category: "Internship",
    location: "Bengaluru",
    stipend: "₹65,000 / mo",
    deadline: "3 days left",
    urgency: "urgent",
    fitScore: 95,
    tags: ["Product", "Fintech", "Next.js", "SQL"],
    matchReason: "Strong correlation with your payment integration work, user analytics, and system architecture projects.",
    missingSkills: ["SQL query profiling"],
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
    id: "opp-linear",
    title: "Founding Software Engineer (React / TypeScript)",
    company: "Linear",
    category: "Fulltime",
    location: "Remote",
    stipend: "$130k – $160k + Equity",
    deadline: "5 days left",
    urgency: "closing_soon",
    fitScore: 92,
    tags: ["TypeScript", "React 19", "CRDTs", "Remote"],
    matchReason: "Direct match for your local-first state synchronization, web performance, and clean UI engineering.",
    missingSkills: ["Rust state machine"],
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
    id: "opp-bcg",
    title: "BCG ACE Strategy Case Competition 2026",
    company: "Boston Consulting Group",
    category: "Hackathon",
    location: "Mumbai",
    stipend: "₹15,00,000 Prize + Fast-Track PPI",
    deadline: "12 days left",
    urgency: "normal",
    fitScore: 89,
    tags: ["Strategy", "Case Comp", "Pre-Placement"],
    matchReason: "High alignment with your analytical case study submissions, leadership roles, and problem solving tags.",
    missingSkills: ["Financial Modeling"],
    glassdoor: 4.5,
    funding: "Global Enterprise",
    recruiter: {
      name: "BCG Campus Hiring Team",
      role: "Campus Relations India",
      email: "ace.india@bcg.com",
      verified: true,
    },
  },
  {
    id: "opp-yc",
    title: "AI Product & Systems Fellow",
    company: "Y Combinator Fellowship",
    category: "Fellowship",
    location: "San Francisco",
    stipend: "$500,000 Standard Deal + Mentorship",
    deadline: "Rolling Deadline",
    urgency: "rolling",
    fitScore: 88,
    tags: ["AI Agents", "LLM Evals", "Startup"],
    matchReason: "Matches your autonomous AI agent projects, prompt architecture work, and fast builder velocity.",
    missingSkills: ["Distributed inference"],
    glassdoor: 4.9,
    funding: "Top Accelerator",
    recruiter: {
      name: "Garry Tan",
      role: "President & CEO",
      email: "garry@ycombinator.com",
      verified: true,
    },
  },
  {
    id: "opp-cred",
    title: "Backend Engineering Intern (Go / Distributed Systems)",
    company: "CRED",
    category: "Internship",
    location: "Bengaluru",
    stipend: "₹75,000 / mo",
    deadline: "Closing in 48h",
    urgency: "urgent",
    fitScore: 91,
    tags: ["Go", "Kafka", "Microservices", "Fintech"],
    matchReason: "Matches your high-throughput queue processing and distributed locking implementations.",
    missingSkills: ["gRPC service mesh"],
    glassdoor: 4.2,
    funding: "Series E ($800M)",
    recruiter: {
      name: "Ankit Goel",
      role: "Talent Acquisition Lead",
      email: "ankit.g@cred.club",
      verified: true,
    },
  },
];

export function InteractiveFeedHero() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedLocation, setSelectedLocation] = useState<string>("All");
  const [selectedId, setSelectedId] = useState<string>(DEMO_ROLES[0].id);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard listener for `/` and `Cmd+K` / `Ctrl+K`
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key === "k")) &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtered dataset
  const filteredRoles = useMemo(() => {
    return DEMO_ROLES.filter((role) => {
      const matchesCat = selectedCategory === "All" || role.category === selectedCategory;
      const matchesLoc = selectedLocation === "All" || role.location === selectedLocation;
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        role.title.toLowerCase().includes(query) ||
        role.company.toLowerCase().includes(query) ||
        role.tags.some((t) => t.toLowerCase().includes(query));

      return matchesCat && matchesLoc && matchesQuery;
    });
  }, [searchQuery, selectedCategory, selectedLocation]);

  const activeRole = useMemo(() => {
    return filteredRoles.find((r) => r.id === selectedId) || filteredRoles[0] || DEMO_ROLES[0];
  }, [filteredRoles, selectedId]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="w-full rounded-2xl border border-zinc-200/90 bg-white shadow-xl overflow-hidden text-left">
      {/* Top Application Header / Command Bar */}
      <div className="border-b border-zinc-200/80 bg-zinc-50/80 px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Live Search Input with Keyboard Shortcut */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role, skill (e.g. React, Fintech, Go) or company..."
              className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-14 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none transition-all shadow-2xs"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[10px] text-zinc-400 hover:text-zinc-600 font-mono"
                >
                  ESC
                </button>
              ) : (
                <kbd className="hidden sm:inline-block rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[9px] font-mono text-zinc-500 shadow-2xs">
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* Telemetry Counter */}
          <div className="flex items-center gap-2 shrink-0 text-xs font-mono text-zinc-500">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-zinc-800">{filteredRoles.length} matches</span>
            <span className="text-zinc-300">|</span>
            <span>1,248 indexed</span>
          </div>
        </div>

        {/* Category & Location Filter Strip */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200/60">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1">
            {["All", "Internship", "Fulltime", "Hackathon", "Fellowship"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-all active:scale-[0.98]",
                  selectedCategory === cat
                    ? "bg-zinc-900 text-white shadow-xs font-semibold"
                    : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Location Quick Filter */}
          <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-500">
            <MapPin className="size-3 text-zinc-400" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-transparent border-0 text-zinc-700 font-medium text-xs focus:ring-0 cursor-pointer"
            >
              <option value="All">All Locations</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Remote">Remote (Global)</option>
              <option value="Mumbai">Mumbai</option>
              <option value="San Francisco">San Francisco</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Interactive Split Workstation */}
      <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 min-h-[480px]">
        {/* Left Column: Feed Listings */}
        <div className="lg:col-span-6 p-3 sm:p-4 space-y-2.5 overflow-y-auto max-h-[520px] bg-zinc-50/40">
          {filteredRoles.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500 space-y-2">
              <p className="font-semibold text-zinc-700">No matching demo roles found.</p>
              <p>Try searching for &quot;React&quot;, &quot;Fintech&quot;, or clearing the filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedLocation("All");
                }}
                className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredRoles.map((role) => {
              const isSelected = role.id === activeRole?.id;
              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedId(role.id)}
                  className={cn(
                    "group relative cursor-pointer rounded-xl border p-3.5 transition-all text-left active:scale-[0.99]",
                    isSelected
                      ? "border-zinc-900 bg-white shadow-sm ring-1 ring-zinc-900/10"
                      : "border-zinc-200/80 bg-white hover:border-zinc-300 hover:shadow-xs"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-900 font-mono">
                          {role.company}
                        </span>
                        <span className="text-zinc-300 text-xs">·</span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.2 text-[10px] font-semibold uppercase",
                            role.category === "Internship" && "bg-sky-50 text-sky-700 border border-sky-200/60",
                            role.category === "Fulltime" && "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
                            role.category === "Hackathon" && "bg-amber-50 text-amber-700 border border-amber-200/60",
                            role.category === "Fellowship" && "bg-purple-50 text-purple-700 border border-purple-200/60"
                          )}
                        >
                          {role.category}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-[13px] font-bold text-zinc-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
                        {role.title}
                      </h4>
                    </div>

                    {/* Fit Score Badge */}
                    <div className="flex flex-col items-end shrink-0">
                      <span className="inline-flex items-center gap-1 rounded bg-zinc-900 text-white px-2 py-0.5 text-xs font-mono font-bold">
                        <Zap className="size-3 text-amber-400 fill-amber-400" />
                        {role.fitScore}%
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400 mt-0.5 uppercase">Match</span>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="mt-2.5 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-100 pt-2 font-mono">
                    <span className="font-semibold text-zinc-900">{role.stipend}</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[11px]",
                        role.urgency === "urgent" && "text-rose-600 font-semibold",
                        role.urgency === "closing_soon" && "text-amber-700 font-medium"
                      )}
                    >
                      <Clock className="size-3" />
                      {role.deadline}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Deep Intelligence & Verified Recruiter Radar */}
        {activeRole && (
          <div className="lg:col-span-6 p-4 sm:p-5 bg-white flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-zinc-100 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-400">
                    Decision Analysis
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="size-3.5 text-emerald-600" /> Verified Opening
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 leading-snug">
                  {activeRole.title}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
                  <Building2 className="size-3.5 text-zinc-400" />
                  <span className="font-semibold text-zinc-800">{activeRole.company}</span> · {activeRole.location}
                </p>
              </div>

              {/* Match Rationale Card */}
              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 text-xs space-y-1">
                <p className="font-bold text-zinc-900 flex items-center gap-1.5 text-[11.5px]">
                  <Zap className="size-3.5 text-blue-600" /> Why this matches your resume:
                </p>
                <p className="text-zinc-600 text-[11.5px] leading-relaxed">
                  {activeRole.matchReason}
                </p>
              </div>

              {/* Company Metrics & Glassdoor */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-zinc-200/80 bg-white p-2.5">
                  <span className="text-[10px] text-zinc-400 font-mono uppercase block mb-1">
                    Glassdoor Rating
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-zinc-900">{activeRole.glassdoor} / 5.0</span>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200/80 bg-white p-2.5">
                  <span className="text-[10px] text-zinc-400 font-mono uppercase block mb-1">
                    Company Stage
                  </span>
                  <span className="text-xs font-bold text-zinc-900 truncate block">
                    {activeRole.funding}
                  </span>
                </div>
              </div>

              {/* Verified Hiring Manager Radar */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-900 flex items-center gap-1.5 text-[11.5px]">
                    <Mail className="size-3.5 text-blue-600" /> Direct Recruiter Radar
                  </span>
                  <span className="text-[9px] font-mono uppercase bg-emerald-100/80 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                    Hunter.io Verified
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-200/60">
                  <div>
                    <p className="font-bold text-zinc-900 text-xs">{activeRole.recruiter.name}</p>
                    <p className="text-[10.5px] text-zinc-500">{activeRole.recruiter.role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeRole.recruiter.email)}
                    className="inline-flex items-center gap-1 font-mono text-[11px] bg-white border border-zinc-200 px-2 py-1 rounded text-zinc-800 font-medium hover:bg-zinc-100 transition-colors shadow-2xs active:scale-[0.97]"
                  >
                    {copiedEmail ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3 text-zinc-400" />}
                    <span>{activeRole.recruiter.email}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Instant Feed Link */}
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
              <span className="text-[11px] text-zinc-500">
                Drop your resume to score 1,200+ live openings.
              </span>
              <Link href="/login">
                <Button size="sm" className="font-bold text-xs h-8 px-3.5 gap-1 shadow-xs bg-zinc-900 hover:bg-zinc-800 text-white active:scale-[0.98]">
                  Unlock Live Feed <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
