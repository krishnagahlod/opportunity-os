"use client";

import { useState } from "react";
import {
  Zap,
  ShieldCheck,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Star,
  Copy,
  Send,
  Building2,
  TrendingUp,
  FileText,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SuperpowersShowcase() {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <section className="py-24 border-b border-border/70 bg-background">
      <div className="mx-auto max-w-6xl px-4 space-y-24">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-primary">
            Engineered For Placement Velocity
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to beat the applicant flood.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Standard job boards dump 500 applicants into a black hole. Opportunity OS reverse-engineers the hiring pipeline directly to your advantage.
          </p>
        </div>

        {/* Feature 1: Resume-Driven Decision Intelligence */}
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">
              <Zap className="size-3.5" />
              <span>Resume-Matched Scoring</span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              0–100 personal fit scoring on every single listing.
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We extract your core skills, frameworks, and projects from your resume. When an opening goes live anywhere, our AI computes a multidimensional Fit, Value, and Actionability score so you only spend time on roles you have a real chance of winning.
            </p>
            <ul className="space-y-2.5 pt-2 text-xs text-foreground/80 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Instant skill gap analysis (know what to highlight)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Automated red flag detection for ghost or scam postings</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Smart feed grouping: Top Matches vs Good Fits</span>
              </li>
            </ul>
          </div>

          {/* Feature 1 Visual: Deep Score Card */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground">
                    Active Resume Score
                  </span>
                  <h4 className="text-base font-bold text-foreground mt-0.5">
                    Founding Software Engineer · Linear
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-mono font-extrabold text-foreground">94/100</span>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                    High Fit Tier
                  </p>
                </div>
              </div>

              {/* Score breakdown metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                    Skill Fit
                  </span>
                  <span className="text-base font-bold text-foreground">96%</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">TypeScript, React, Node</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                    Career Value
                  </span>
                  <span className="text-base font-bold text-foreground">92%</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Top-Tier Brand Equity</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                    Actionability
                  </span>
                  <span className="text-base font-bold text-foreground">90%</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Direct Recruiter Known</p>
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs flex items-start gap-2.5">
                <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Missing Keyword Alert:</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    They mention &apos;distributed state&apos;. Highlight your caching implementation in your intro note.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Verified Recruiter & Company Intelligence */}
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Feature 2 Visual (Left) */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm font-mono">
                    RZP
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Razorpay Software Pvt Ltd</h4>
                    <p className="text-xs text-muted-foreground">Bengaluru, India · Series F ($750M Raised)</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="size-3.5" /> 100% Authentic
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">
                    Glassdoor Sentiment
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-foreground">4.3 / 5.0</span>
                    <span className="text-xs text-muted-foreground font-normal">(1,840 reviews)</span>
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">
                    Work-Life Balance
                  </span>
                  <span className="text-sm font-bold text-foreground">3.9 / 5.0 · Healthy</span>
                </div>
              </div>

              {/* Verified Hunter.io contacts */}
              <div className="rounded-xl border border-border/70 bg-background/80 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <UserCheck className="size-4 text-primary" /> Verified Recruiter Radar
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 font-bold px-1.5 py-0.5 rounded">
                    Hunter.io Verified
                  </span>
                </div>

                <div className="divide-y divide-border/50 text-xs">
                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Priya Sundaram</p>
                      <p className="text-[11px] text-muted-foreground">Senior Technical Recruiter</p>
                    </div>
                    <span className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded text-foreground font-medium">
                      priya.s@razorpay.com
                    </span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Harish Narayanan</p>
                      <p className="text-[11px] text-muted-foreground">VP of Product & Engineering</p>
                    </div>
                    <span className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded text-foreground font-medium">
                      harish.n@razorpay.com
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 Copy (Right) */}
          <div className="lg:col-span-5 space-y-4 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="size-3.5" />
              <span>Company Trust Radar</span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Skip HR black holes with direct hiring manager intelligence.
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Never apply to a company blindly. We surface real-time company funding data, Glassdoor culture ratings, and Hunter.io verified hiring manager email addresses.
            </p>
            <ul className="space-y-2.5 pt-2 text-xs text-foreground/80 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Direct recruiter email addresses verified via Hunter.io</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Aggregated employee sentiment from Glassdoor</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Funding history & headcount growth trajectory</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Feature 3: AI Cold Outreach Composer */}
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">
              <Mail className="size-3.5" />
              <span>High-Conversion Outreach</span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Personalized cold emails crafted in 5 seconds.
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Generic ChatGPT cold emails get marked as spam. Opportunity OS writes short, punchy, high-conversion cold emails that tie your actual portfolio projects directly to the company&apos;s product challenges.
            </p>
            <ul className="space-y-2.5 pt-2 text-xs text-foreground/80 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Targeted to specific hiring managers and founders</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Zero AI fluff — direct, authentic, and results-focused</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>One-click copy or direct Gmail launch</span>
              </li>
            </ul>
          </div>

          {/* Feature 3 Visual: Interactive Cold Email Composer */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground font-mono">To:</span>
                  <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground font-medium">
                    tuomas@linear.app
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Copy className="size-3" />
                  {copiedEmail ? "Copied to clipboard!" : "Copy draft"}
                </button>
              </div>

              <div className="space-y-2 text-xs font-sans text-foreground/90 leading-relaxed bg-background/60 p-4 rounded-xl border border-border/60">
                <p className="font-semibold text-foreground">
                  Subject: Quick question re: Linear desktop sync engine & student SWE role
                </p>
                <p className="pt-1">Hi Tuomas,</p>
                <p>
                  I saw Linear&apos;s recent founding SWE posting and wanted to reach out directly. I recently built a local-first reactive sync engine with CRDTs and WebSockets for my campus project.
                </p>
                <p>
                  I noticed Linear&apos;s emphasis on sub-50ms interaction latencies. Given my background optimizing client-side caching in React 19, I&apos;d love to contribute to your core sync infrastructure.
                </p>
                <p>
                  Here is my GitHub (github.com/krishnagahlod) and full resume. Would you have 10 minutes next week for a quick chat?
                </p>
                <p className="text-muted-foreground pt-1">Best regards,<br />Krishna</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
