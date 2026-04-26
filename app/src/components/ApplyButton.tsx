"use client";

import { useTransition } from "react";
import { Check, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markApplied } from "@/app/actions";
import type { ApplicationStatus } from "@/types/db";

export function ApplyButton({
  opportunityId,
  currentStatus,
  compact,
}: {
  opportunityId: string;
  currentStatus?: ApplicationStatus;
  /** Icon-only ghost button for dense surfaces (editorial rows). */
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const alreadyApplied =
    currentStatus === "applied" ||
    currentStatus === "interviewing" ||
    currentStatus === "won";
  const Icon = alreadyApplied ? CircleCheck : Check;

  if (compact) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={alreadyApplied ? "Already marked applied" : "Mark applied"}
        aria-pressed={alreadyApplied}
        disabled={isPending || alreadyApplied}
        onClick={() =>
          startTransition(async () => {
            await markApplied(opportunityId);
          })
        }
      >
        <Icon
          className={
            alreadyApplied
              ? "size-3.5 text-emerald-600 dark:text-emerald-400"
              : "size-3.5 text-muted-foreground"
          }
        />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={alreadyApplied ? "secondary" : "outline"}
      size="sm"
      className="gap-1"
      disabled={isPending || alreadyApplied}
      onClick={() =>
        startTransition(async () => {
          await markApplied(opportunityId);
        })
      }
    >
      <Icon className="size-3.5" />
      {alreadyApplied ? "Applied" : "Mark applied"}
    </Button>
  );
}
