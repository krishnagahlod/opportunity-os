"use client";

import * as React from "react";
import { Target, Gem, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

function ScoreRing({ score, label, icon: Icon, colorClass }: { score: number; label: string; icon: any; colorClass: string }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card transition-colors shadow-sm">
      <div className="relative flex items-center justify-center mb-3">
        {/* Background Ring */}
        <svg className="size-16 -rotate-90 transform" viewBox="0 0 60 60">
          <circle
            cx="30"
            cy="30"
            r={radius}
            stroke="currentColor"
            strokeWidth="5"
            fill="transparent"
            className="text-muted/30"
          />
          {/* Progress Ring */}
          <circle
            cx="30"
            cy="30"
            r={radius}
            stroke="currentColor"
            strokeWidth="5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn("transition-all duration-1000 ease-out", colorClass)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-lg font-bold tracking-tighter">{score}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
    </div>
  );
}

export function ScoreBreakdown({
  fitScore,
  valueScore,
  actionabilityScore,
}: {
  fitScore: number;
  valueScore: number;
  actionabilityScore: number;
}) {
  return (
    <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
      <ScoreRing 
        score={fitScore} 
        label="Fit" 
        icon={Target} 
        colorClass="text-emerald-500" 
      />
      <ScoreRing 
        score={valueScore} 
        label="Value" 
        icon={Gem} 
        colorClass="text-blue-500" 
      />
      <ScoreRing 
        score={actionabilityScore} 
        label="Action" 
        icon={Zap} 
        colorClass="text-amber-500" 
      />
    </div>
  );
}
