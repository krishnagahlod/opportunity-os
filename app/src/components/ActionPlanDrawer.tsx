"use client";

import { useEffect, useState } from "react";
import { X, Sparkles, Loader2, Copy, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActionPlan } from "@/lib/ai/prompts";

type Props = {
  opportunityId: string;
  isOpen: boolean;
  onClose: () => void;
};

export function ActionPlanDrawer({ opportunityId, isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (isOpen && !plan && !loading && !error) {
      generatePlan();
    }
  }, [isOpen]);

  // Loading sequence
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((s) => Math.min(s + 1, 2));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  async function generatePlan() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/action-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunity_id: opportunityId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate plan");
      
      setPlan(data.actionPlan);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!plan) return;
    navigator.clipboard.writeText(plan.cold_outreach_draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const loadingMessages = [
    "Reading your resume...",
    "Analyzing the role...",
    "Drafting your strategy...",
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-md transform border-l bg-background shadow-2xl transition-transform duration-300 ease-in-out sm:max-w-lg",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-5" />
              <h2 className="text-lg font-semibold">AI Action Plan</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="size-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="animate-pulse text-sm font-medium text-muted-foreground">
                  {loadingMessages[loadingStep]}
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                <p className="font-medium">Failed to generate plan</p>
                <p className="mt-1 text-sm">{error}</p>
                <Button onClick={generatePlan} variant="outline" size="sm" className="mt-4">
                  Try Again
                </Button>
              </div>
            )}

            {plan && !loading && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Resume Tweaks */}
                <section>
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                    <div className="flex size-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                      1
                    </div>
                    Resume Tweaks
                  </h3>
                  <ul className="space-y-3">
                    {plan.resume_tweaks.map((tweak, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ChevronRight className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{tweak}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Interview Prep */}
                <section>
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                    <div className="flex size-6 items-center justify-center rounded-full bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400">
                      2
                    </div>
                    Interview Prep
                  </h3>
                  <ul className="space-y-3">
                    {plan.interview_prep.map((prep, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ChevronRight className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{prep}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Cold Email */}
                <section>
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                    <div className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                      3
                    </div>
                    Cold Outreach Draft
                  </h3>
                  <div className="group relative rounded-xl border bg-muted/50 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {plan.cold_outreach_draft}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCopy}
                      className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      {copied ? <CheckCircle2 className="mr-1.5 size-3.5" /> : <Copy className="mr-1.5 size-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
