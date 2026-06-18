"use client";

import { useState } from "react";
import { Sparkles, CheckCircle2, XCircle, AlertCircle, FileText, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import type { ResumeMatch } from "@/types/db";
import Link from "next/link";

export function ResumeMatchScore({ 
  opportunityId, 
  hasResume 
}: { 
  opportunityId: string;
  hasResume: boolean;
}) {
  const [match, setMatch] = useState<ResumeMatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerateMatch() {
    if (!hasResume) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai/match?opportunityId=${opportunityId}`);
      if (!res.ok) {
        throw new Error("Failed to generate match score.");
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMatch(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  if (!hasResume) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <FileText className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-indigo-900">Unlock Deep AI Resume Match</h3>
            <p className="mt-1 text-sm text-indigo-700/80">
              Upload your resume to see an objective match score (0-100), key strengths, and missing requirements for this role.
            </p>
            <Link href="/settings#resume" className={buttonVariants({ variant: "outline", className: "mt-4 bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-700" })}>
              Upload Resume
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (match) {
    // Determine color scheme based on score
    const isHigh = match.match_score >= 80;
    const isMed = match.match_score >= 50 && match.match_score < 80;
    const colorBg = isHigh ? "bg-emerald-50 border-emerald-200" : isMed ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
    const colorText = isHigh ? "text-emerald-700" : isMed ? "text-amber-700" : "text-red-700";
    const colorCircle = isHigh ? "text-emerald-600" : isMed ? "text-amber-600" : "text-red-600";

    return (
      <div className={`mt-8 rounded-xl border p-6 ${colorBg}`}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          
          <div className="flex flex-col items-center sm:w-1/3">
            <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/80 mb-2">Match Score</div>
            <div className={`text-6xl font-bold tracking-tighter ${colorText}`}>
              {match.match_score}%
            </div>
            <div className="mt-2 text-xs text-muted-foreground text-center">Analyzed via AI</div>
          </div>

          <div className="sm:w-2/3 space-y-4">
            {match.strengths.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle2 className={`size-4 ${colorCircle}`} /> 
                  Key Strengths
                </h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {match.strengths.map((str, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="shrink-0 mt-1">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {match.weaknesses.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <AlertCircle className="size-4 text-rose-500" /> 
                  Areas of Concern / Gaps
                </h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {match.weaknesses.map((wk, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="shrink-0 mt-1">•</span>
                      <span>{wk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="size-4 text-purple-500" /> Deep AI Match
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Compare your uploaded resume context against this job description to get a realistic match score.
          </p>
        </div>
        <Button onClick={handleGenerateMatch} disabled={loading} className="shrink-0">
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Analyzing...
            </>
          ) : (
            "Generate Match Score"
          )}
        </Button>
      </div>
      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </div>
  );
}
