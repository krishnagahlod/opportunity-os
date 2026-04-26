"use client";

import { useTransition } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleSaved } from "@/app/actions";

export function SaveButton({
  opportunityId,
  isSaved,
  compact,
}: {
  opportunityId: string;
  isSaved: boolean;
  /** Icon-only ghost button for dense surfaces (editorial rows). */
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const Icon = isSaved ? BookmarkCheck : Bookmark;

  if (compact) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={isSaved ? "Remove from saved" : "Save"}
        aria-pressed={isSaved}
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await toggleSaved(opportunityId, isSaved);
          })
        }
      >
        <Icon
          className={
            isSaved ? "size-3.5 text-primary" : "size-3.5 text-muted-foreground"
          }
        />
      </Button>
    );
  }

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
      <Icon className="size-3.5" />
      {isSaved ? "Saved" : "Save"}
    </Button>
  );
}
