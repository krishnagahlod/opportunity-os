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
  Check,
  Building2,
  TrendingUp,
  UserCheck,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SuperpowersShowcase() {
  const [copiedDraft, setCopiedDraft] = useState(false);

  const handleCopy = () => {
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  return (
    <section className="py-24 border-b border-zinc-200/80 bg-zinc-50/50">
      <div className="mx-auto max-w-6xl px-4 space-y-24">
        {/* Section Title */}
        <div className="mx-auto max-w-2xl text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-700 shadow-2xs">
            <Zap className="size-3.5 text-blue-600 fill-blue-600" />
            <span>Built For Placement Velocity</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 leading-tight">
            How Opportunity OS beats the 500-applicant flood.
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Standard job boards dump your resume into an HR black hole. We give you precision match scoring, verified hiring manager emails, and instant outreach tailored to your projects.
          </p>
        </div>

        {/* Feature 1: Resume Match Scoring */}
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 font-mono">
              <span>01 / DECISION INTELLIGENCE</span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              0–100 personal fit score on every single opening.
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              We extract your core skills, frameworks, and projects from your resume. When an opening goes live anywhere, our AI computes a multidimensional Fit, Value, and Actionability score so you only spend time on roles you have a real chance of winning.
            </p>
            <ul className="space-y-2.5 pt-2 text-xs text-zinc-700 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Identifies missing keywords and project gaps before you apply</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Filters out ghost jobs and duplicate scraper reposts</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Categorized into Top Matches, Good Fits, and Explore groups</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-zinc-400">
                    Live Score Evaluation
                  </span>
                  <h4 className="text-base font-bold text-zinc-900 mt-0.5">
                    Founding Software Engineer · Linear
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-mono font-extrabold text-zinc-900">94/100</span>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">
                    Top 5% Resume Match
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <span className="text-[10px] text-zinc-400 uppercase font-mono block">
                    Skill Fit
                  </span>
                  <span className="text-base font-bold text-zinc-900 font-mono">96%</span>
                  <p className="text-[10px] text-zinc-500 mt-0.5 truncate">TypeScript, React 19</p>
                </div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <span className="text-[10px] text-zinc-400 uppercase font-mono block">
                    Brand Value
                  </span>
                  <span className="text-base font-bold text-zinc-900 font-mono">92%</span>
                  <p className="text-[10px] text-zinc-500 mt-0.5 truncate">Series B High Equity</p>
                </div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <span className="text-[10px] text-zinc-400 uppercase font-mono block">
                    Actionability
                  </span>
                  <span className="text-base font-bold text-zinc-900 font-mono">94%</span>
                  <p className="text-[10px] text-zinc-500 mt-0.5 truncate">Direct Recruiter Known</p>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs flex items-start gap-2.5">
                <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-zinc-900">Recommended Resume Tweak:</p>
                  <p className="text-zinc-600 text-[11.5px] mt-0.5">
                    Highlight your local caching or WebSocket state work in your project bullet points before submitting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Verified Recruiter & Company Intelligence */}
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-sm font-mono">
                    RZP
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">Razorpay Software Pvt Ltd</h4>
                    <p className="text-xs text-zinc-500">Bengaluru, India · Series F ($750M Total Funding)</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="size-3.5 text-emerald-600" /> 100% Authentic
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
                    Glassdoor Rating
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-zinc-900 font-mono">4.3 / 5.0</span>
                    <span className="text-xs text-zinc-500 font-normal">(1,840 reviews)</span>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">
                    Work-Life Culture
                  </span>
                  <span className="text-sm font-bold text-zinc-900">Healthy · Fast-Paced</span>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <UserCheck className="size-4 text-blue-600" /> Direct Recruiter Radar
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                    Hunter.io Verified
                  </span>
                </div>

                <div className="divide-y divide-zinc-200/60 text-xs">
                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-900">Priya Sundaram</p>
                      <p className="text-[11px] text-zinc-500">Senior Technical Recruiter</p>
                    </div>
                    <span className="font-mono text-[11px] bg-white border border-zinc-200 px-2 py-0.5 rounded text-zinc-800 font-medium">
                      priya.s@razorpay.com
                    </span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-900">Harish Narayanan</p>
                      <p className="text-[11px] text-zinc-500">VP of Engineering</p>
                    </div>
                    <span className="font-mono text-[11px] bg-white border border-zinc-200 px-2 py-0.5 rounded text-zinc-800 font-medium">
                      harish.n@razorpay.com
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4 order-1 lg:order-2">
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 font-mono">
              <span>02 / RECRUITER RADAR</span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Skip HR black holes with verified hiring manager intelligence.
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Never apply to a company blindly. We surface real-time company funding data, Glassdoor culture ratings, and Hunter.io verified hiring manager email addresses.
            </p>
            <ul className="space-y-2.5 pt-2 text-xs text-zinc-700 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Direct email addresses verified via Hunter.io (98%+ deliverability)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Aggregated employee reviews & compensation insights</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Series A-F funding rounds & headcount growth trends</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Feature 3: AI Cold Outreach */}
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 font-mono">
              <span>03 / COLD OUTREACH</span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Personalized cold emails crafted in 5 seconds.
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Generic ChatGPT cold emails get ignored or sent to spam. Opportunity OS writes short, punchy, high-conversion cold emails that tie your actual portfolio projects directly to the company&apos;s active tech challenges.
            </p>
            <ul className="space-y-2.5 pt-2 text-xs text-zinc-700 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Targeted to specific hiring managers and founders</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Zero AI fluff — concise, professional, and results-driven</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>One-click copy or direct Gmail composer launch</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-zinc-400">To:</span>
                  <span className="bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-zinc-900 font-semibold">
                    tuomas@linear.app
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {copiedDraft ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                  <span>{copiedDraft ? "Copied to clipboard!" : "Copy draft"}</span>
                </button>
              </div>

              <div className="space-y-2 text-xs font-sans text-zinc-700 leading-relaxed bg-zinc-50/70 p-4 rounded-xl border border-zinc-200/80">
                <p className="font-bold text-zinc-900">
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
                <p className="text-zinc-500 pt-1">Best regards,<br /><span className="font-semibold text-zinc-900">Krishna</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
