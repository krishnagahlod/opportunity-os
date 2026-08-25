"use client";

import { useState } from "react";
import {
  FileText,
  Workflow,
  Zap,
  CheckCircle2,
  Bookmark,
  Send,
  MessageSquare,
  Trophy,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function PipelineWorkflowSection() {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      id: 0,
      number: "01",
      title: "One-Time Resume Ingestion",
      tagline: "Upload once. Generate your real technical vector fingerprint.",
      desc: "Drop your PDF resume during onboarding. Our parser extracts your programming languages, frameworks, past internships, hackathon achievements, and deployment architectures without asking you to fill out 20 tedious profile forms.",
      features: [
        "Instant PDF skill vectorization",
        "Framework & library extraction",
        "Role preference clustering",
      ],
      previewType: "resume",
    },
    {
      id: 1,
      number: "02",
      title: "Realtime 50+ Source Ingestion",
      tagline: "Continuous scraping across enterprise ATS and stealth channels.",
      desc: "Every hour, our ingestion engines monitor Greenhouse, Lever, Ashby, Y Combinator, Hacker News, and campus portals. Raw listings are scrubbed, cleaned of spam, deduplicated, and mapped into structured opportunity schemas.",
      features: [
        "Zero duplicate scraper reposts",
        "Direct company ATS extraction",
        "Stealth founder hiring posts captured",
      ],
      previewType: "ingestion",
    },
    {
      id: 2,
      number: "03",
      title: "0–100 Multidimensional Scoring",
      tagline: "Every listing evaluated specifically for your background.",
      desc: "Rather than generic keyword search, our AI performs multidimensional alignment testing: Technical Fit (0-100), Career Brand Value, and Application Actionability, flagging critical missing keywords before you apply.",
      features: [
        "Instant missing keyword alert",
        "Fit score ring on every listing",
        "Personalized 'Why this is a fit' rationale",
      ],
      previewType: "scoring",
    },
    {
      id: 3,
      number: "04",
      title: "Personal Application Kanban",
      tagline: "Track and manage your entire placement sprint in one place.",
      desc: "Save promising roles to review later, mark the ones you've applied to, manage interview rounds, and hide irrelevant roles to continuously train your feed to your personal preferences.",
      features: [
        "One-click Save, Applied, and Hide",
        "Dedicated Saved Pipeline board",
        "Deadlines automatically synced to calendar",
      ],
      previewType: "kanban",
    },
  ];

  const current = steps[activeStep];

  return (
    <section className="py-24 border-b border-zinc-200/80 bg-white">
      <div className="mx-auto max-w-6xl px-4 space-y-16">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-700">
            <Workflow className="size-3.5 text-blue-600" />
            <span>End-to-End Career Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 leading-tight">
            From resume upload to interview offer.
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            See how Opportunity OS automates your entire discovery, decision, and outreach pipeline.
          </p>
        </div>

        {/* Step Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-zinc-200 pb-4">
          {steps.map((step) => {
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  "p-4 rounded-xl text-left transition-all border",
                  isActive
                    ? "border-zinc-900 bg-zinc-50 shadow-xs"
                    : "border-transparent hover:bg-zinc-50/60"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-mono font-bold block mb-1",
                    isActive ? "text-blue-600" : "text-zinc-400"
                  )}
                >
                  STEP {step.number}
                </span>
                <h4
                  className={cn(
                    "text-xs sm:text-sm font-bold leading-snug",
                    isActive ? "text-zinc-900" : "text-zinc-600"
                  )}
                >
                  {step.title}
                </h4>
              </button>
            );
          })}
        </div>

        {/* Dynamic Step Walkthrough Showcase */}
        <div className="grid lg:grid-cols-12 gap-8 items-center rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 sm:p-10 shadow-sm">
          {/* Left Column: Step Description */}
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 text-white px-2.5 py-1 text-xs font-mono font-bold">
              <span>STEP {current.number}</span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl leading-snug">
              {current.tagline}
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {current.desc}
            </p>
            <ul className="space-y-2 pt-2 text-xs text-zinc-700 font-medium">
              {current.features.map((feat) => (
                <li key={feat} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Step Visual Workstation */}
          <div className="lg:col-span-7">
            {current.previewType === "resume" && (
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-blue-600" />
                    <span className="font-bold text-zinc-900">resume_krishna_iitb.pdf</span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                    Vectorized 100%
                  </span>
                </div>
                <div className="space-y-2 text-[11px] text-zinc-600 font-sans">
                  <p className="font-bold font-mono text-zinc-900 uppercase text-[10px]">Extracted Core Competencies:</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {["Next.js 15", "TypeScript", "React 19", "Go", "PostgreSQL", "CRDT Sync", "Supabase", "Kafka", "Docker", "Tailwind CSS"].map((sk) => (
                      <span key={sk} className="rounded bg-zinc-100 border border-zinc-200/80 px-2 py-1 text-zinc-800 font-mono text-[10.5px]">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50/60 border border-blue-200 p-3 text-[11px] font-sans text-blue-900">
                  <p className="font-bold">✨ Semantic Profile Generated:</p>
                  <p className="text-zinc-600 mt-0.5">
                    Target roles: Full-Stack Engineer, Product Engineer, APM. 1,248 listings scored against this profile.
                  </p>
                </div>
              </div>
            )}

            {current.previewType === "ingestion" && (
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                  <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                    <Workflow className="size-4 text-blue-600" /> Ingestion Queue Live Log
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" /> 48 streams active
                  </span>
                </div>
                <div className="space-y-1.5 text-[10.5px] text-zinc-600 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                  <p className="text-emerald-700">✓ [Greenhouse] 14 new engineering roles parsed from Linear & Stripe</p>
                  <p className="text-blue-700">✓ [Y Combinator] 8 founder SWE listings indexed from S25 batch</p>
                  <p className="text-amber-700">✓ [Hacker News] Who is Hiring thread: 42 remote roles extracted</p>
                  <p className="text-zinc-500">✓ [Deduplication] 19 duplicate recruiter reposts dropped</p>
                </div>
              </div>
            )}

            {current.previewType === "scoring" && (
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Scoring Radar</span>
                    <h4 className="text-sm font-bold text-zinc-900">APM Intern · Razorpay</h4>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xl font-extrabold text-zinc-900">95/100</span>
                    <p className="text-[9px] font-bold text-emerald-600 uppercase">Top 1% Fit</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="bg-zinc-50 p-2 rounded border border-zinc-100">
                    <span className="text-[10px] text-zinc-400 block">Technical</span>
                    <span className="font-bold text-zinc-900">96%</span>
                  </div>
                  <div className="bg-zinc-50 p-2 rounded border border-zinc-100">
                    <span className="text-[10px] text-zinc-400 block">Brand Tier</span>
                    <span className="font-bold text-zinc-900">94%</span>
                  </div>
                  <div className="bg-zinc-50 p-2 rounded border border-zinc-100">
                    <span className="text-[10px] text-zinc-400 block">Actionability</span>
                    <span className="font-bold text-zinc-900">95%</span>
                  </div>
                </div>
              </div>
            )}

            {current.previewType === "kanban" && (
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2 text-xs font-mono">
                  <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                    <Bookmark className="size-4 text-blue-600" /> Pipeline Status Board
                  </span>
                  <span className="text-zinc-500">4 Active Applications</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-left text-xs">
                  <div className="rounded-lg bg-zinc-50 p-2.5 border border-zinc-200/70 space-y-1.5">
                    <span className="text-[10px] font-bold font-mono uppercase text-zinc-500 block">Saved (2)</span>
                    <div className="bg-white p-2 rounded border border-zinc-200 shadow-2xs">
                      <p className="font-bold text-zinc-900 text-[11px]">Linear Founding SWE</p>
                      <span className="text-[9px] text-zinc-400 font-mono">92% Fit · 5d left</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-zinc-200 shadow-2xs">
                      <p className="font-bold text-zinc-900 text-[11px]">BCG ACE Case Comp</p>
                      <span className="text-[9px] text-zinc-400 font-mono">89% Fit · 12d left</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-blue-50/50 p-2.5 border border-blue-200/60 space-y-1.5">
                    <span className="text-[10px] font-bold font-mono uppercase text-blue-700 block">Applied (1)</span>
                    <div className="bg-white p-2 rounded border border-blue-200 shadow-2xs">
                      <p className="font-bold text-zinc-900 text-[11px]">Razorpay APM</p>
                      <span className="text-[9px] text-emerald-600 font-mono font-semibold">Cold Email Sent ✓</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-emerald-50/50 p-2.5 border border-emerald-200/60 space-y-1.5">
                    <span className="text-[10px] font-bold font-mono uppercase text-emerald-700 block">Interviewing (1)</span>
                    <div className="bg-white p-2 rounded border border-emerald-200 shadow-2xs">
                      <p className="font-bold text-zinc-900 text-[11px]">CRED Backend Intern</p>
                      <span className="text-[9px] text-blue-600 font-mono font-semibold">Tech Round 1 Scheduled</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
