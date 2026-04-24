"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleSaved } from "@/app/actions";

export function SaveButton({
  opportunityId,
  isSaved,
}: {
  opportunityId: string;
  isSaved: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={isSaved ? "secondary" : "outline"}
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleSaved(opportunityId, isSaved);
        })
      }
    >
      {isSaved ? "Saved" : "Save"}
    </Button>
  );
}
