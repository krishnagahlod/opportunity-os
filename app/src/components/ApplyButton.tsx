"use client";

import { useTransition } from "react";
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
      disabled={isPending || alreadyApplied}
      onClick={() =>
        startTransition(async () => {
          await markApplied(opportunityId);
        })
      }
    >
      {alreadyApplied ? "Applied" : "Mark applied"}
    </Button>
  );
}
