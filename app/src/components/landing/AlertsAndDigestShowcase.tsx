"use client";

import { useState } from "react";
import { Mail, Send, Bell, Clock, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AlertsAndDigestShowcase() {
  const [activeTab, setActiveTab] = useState<"digest" | "telegram">("digest");

  return (
    <section className="py-24 border-b border-zinc-200/80 bg-zinc-50/50">
      <div className="mx-auto max-w-6xl px-4 space-y-16">
        <div className="mx-auto max-w-2xl text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-700 shadow-2xs">
            <Bell className="size-3.5 text-blue-600" />
            <span>Real-time Closing Radar</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 leading-tight">
            Never miss an off-campus deadline again.
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            By the time an off-campus role gets forwarded to your college WhatsApp group, it has 2,000 applicants. Opportunity OS alerts you the moment it opens and warns you 48 hours before it closes.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("digest")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all border",
              activeTab === "digest"
                ? "border-zinc-900 bg-zinc-900 text-white shadow-xs"
                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
            )}
          >
            <Mail className="size-3.5" />
            <span>8:00 AM Morning Digest</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("telegram")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all border",
              activeTab === "telegram"
                ? "border-zinc-900 bg-zinc-900 text-white shadow-xs"
                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
            )}
          >
            <Send className="size-3.5" />
            <span>Instant Telegram 48h Radar</span>
          </button>
        </div>

        {/* Mock Display */}
        <div className="mx-auto max-w-2xl">
          {activeTab === "digest" ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-md space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <div className="size-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Mail className="size-4" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">Opportunity OS Daily Digest</p>
                    <p className="text-[10px] text-zinc-400">Delivered daily at 08:00 AM IST</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                  5 High-Fit Matches
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase text-zinc-500">Razorpay</span>
                      <span className="text-zinc-300">·</span>
                      <span className="text-[10px] text-sky-700 font-semibold uppercase">Internship</span>
                    </div>
                    <h5 className="text-xs font-bold text-zinc-900">Associate Product Manager Intern</h5>
                    <p className="text-[11px] text-zinc-500 mt-0.5">₹65k/mo · 3 days left to apply</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-zinc-900 text-white px-2 py-1 rounded">
                    95% Match
                  </span>
                </div>

                <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase text-zinc-500">Linear</span>
                      <span className="text-zinc-300">·</span>
                      <span className="text-[10px] text-emerald-700 font-semibold uppercase">Fulltime</span>
                    </div>
                    <h5 className="text-xs font-bold text-zinc-900">Founding Software Engineer</h5>
                    <p className="text-[11px] text-zinc-500 mt-0.5">$140k/yr · Direct founder email attached</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-zinc-900 text-white px-2 py-1 rounded">
                    92% Match
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-md space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <div className="size-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                    <Send className="size-4" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">Opportunity OS Telegram Bot</p>
                    <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold">
                      <span className="size-1.5 rounded-full bg-emerald-500" /> Active Alert Stream
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                  Closing Warning
                </span>
              </div>

              <div className="rounded-xl border border-zinc-200/80 bg-sky-50/40 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-600 font-mono text-[11px]">🚨 48-HOUR DEADLINE ALERT</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Just now</span>
                </div>
                <p className="font-bold text-zinc-900 text-sm">
                  BCG ACE Strategy Case Competition 2026
                </p>
                <p className="text-zinc-600 text-[11.5px] leading-relaxed">
                  Applications for Pan-India BCG ACE PPIs close on Friday 11:59 PM. 89% compatibility with your consulting & analytical profile.
                </p>
                <div className="pt-2 flex items-center justify-between text-[11px] font-mono border-t border-sky-200/60">
                  <span className="text-zinc-600 font-bold">Prize: ₹15 Lakhs + Pre-Placement Interview</span>
                  <span className="text-blue-600 font-bold hover:underline cursor-pointer">Quick Apply →</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
