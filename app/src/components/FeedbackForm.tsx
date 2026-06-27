"use client";

import { useState, useTransition } from "react";
import { ThumbsDown, AlertTriangle, Flag, Check, MessageSquare } from "lucide-react";
import { submitFeedback, type FeedbackType } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEEDBACK_OPTIONS: { value: FeedbackType; label: string; icon: any }[] = [
  { value: "bad_match", label: "Bad match for me", icon: ThumbsDown },
  { value: "ineligible", label: "I am not eligible", icon: AlertTriangle },
  { value: "low_quality", label: "Low quality / Spam", icon: Flag },
  { value: "broken_link", label: "Broken link", icon: Flag },
];

export function FeedbackForm({ opportunityId }: { opportunityId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-[11.5px] text-emerald-600 dark:text-emerald-400">
        <Check className="size-3.5" />
        Thanks for the feedback!
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground transition hover:text-foreground"
      >
        <MessageSquare className="size-3.5" />
        Report issue
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-border/60 bg-muted/30 p-3">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        What's wrong with this?
      </p>
      <div className="flex flex-wrap gap-1.5">
        {FEEDBACK_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <Button
              key={opt.value}
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-[11.5px] font-normal"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await submitFeedback(opportunityId, opt.value);
                  setSubmitted(true);
                });
              }}
            >
              <Icon className="size-3 opacity-70" />
              {opt.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
