"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { addSkillToProfile } from "@/app/actions";
import { cn } from "@/lib/utils";

/**
 * Click-to-add chip used in the detail page's "What you're missing" section.
 *
 * Renders the missing skill name and a tiny "+" button that calls the
 * `addSkillToProfile` server action. After the action returns success the
 * chip flips to an "added" state in-place (small green check + muted text)
 * rather than disappearing — that gives the user a confirmation moment
 * before the next page navigation re-renders without the chip.
 */
export function MissingSkillChip({ skill }: { skill: string }) {
  const [added, setAdded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function add() {
    if (added) return;
    setError(null);
    startTransition(async () => {
      const res = await addSkillToProfile(skill);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setAdded(true);
    });
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={isPending || added}
      title={
        added
          ? `${skill} added to your skills`
          : error
            ? `Add failed: ${error}`
            : `Add ${skill} to my skills`
      }
      className={cn(
        "group/chip inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px] font-medium transition-all",
        added
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : error
            ? "border-destructive/40 bg-destructive/10 text-destructive"
            : "border-border/60 bg-muted/40 text-muted-foreground hover:-translate-y-px hover:border-primary/40 hover:bg-primary/[0.06] hover:text-foreground",
      )}
    >
      <span>{skill}</span>
      <span
        aria-hidden
        className={cn(
          "inline-flex size-4 items-center justify-center rounded-full transition-colors",
          added
            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground/70 group-hover/chip:bg-primary/15 group-hover/chip:text-primary",
        )}
      >
        {isPending ? (
          <Loader2 className="size-2.5 animate-spin" />
        ) : added ? (
          <Check className="size-2.5" />
        ) : (
          <Plus className="size-2.5" />
        )}
      </span>
    </button>
  );
}
