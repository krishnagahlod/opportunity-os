"use client";

import { useTransition } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
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
      className="gap-1"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleSaved(opportunityId, isSaved);
        })
      }
    >
      {isSaved ? (
        <BookmarkCheck className="size-3.5" />
      ) : (
        <Bookmark className="size-3.5" />
      )}
      {isSaved ? "Saved" : "Save"}
    </Button>
  );
}
