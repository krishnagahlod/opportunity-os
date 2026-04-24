"use client";

import { useTransition } from "react";
import { Check, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markApplied } from "@/app/actions";
import type { ApplicationStatus } from "@/types/db";

export function ApplyButton({
  opportunityId,
  currentStatus,
}: {
  opportunityId: string;
  currentStatus?: ApplicationStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const alreadyApplied =
    currentStatus === "applied" ||
    currentStatus === "interviewing" ||
    currentStatus === "won";

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
      {alreadyApplied ? (
        <CircleCheck className="size-3.5" />
      ) : (
        <Check className="size-3.5" />
      )}
      {alreadyApplied ? "Applied" : "Mark applied"}
    </Button>
  );
}
