"use client";

import { useTransition } from "react";
import { cn } from "@/lib/utils";
import type { AdminActionResult } from "./actions";

/**
 * Tiny client-component wrapper that runs an admin server action with a
 * pending state and rolls back on error. Used for inline toggles and
 * status changes in the admin tables.
 */
export function AdminActionButton({
  label,
  active = false,
  variant = "secondary",
  onAction,
  className,
}: {
  label: string;
  active?: boolean;
  variant?: "primary" | "secondary" | "danger";
  onAction: () => Promise<AdminActionResult>;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();

  const baseStyle =
    "inline-flex items-center justify-center rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset transition disabled:opacity-50";
  const variants = {
    primary: active
      ? "bg-primary/15 text-primary ring-primary/30"
      : "bg-background text-muted-foreground ring-border hover:text-foreground hover:bg-muted/60",
    secondary: active
      ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300"
      : "bg-background text-muted-foreground ring-border hover:text-foreground hover:bg-muted/60",
    danger:
      "bg-rose-500/10 text-rose-700 ring-rose-500/30 hover:bg-rose-500/15 dark:text-rose-300",
  };

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await onAction();
        })
      }
      className={cn(baseStyle, variants[variant], className)}
    >
      {isPending ? "…" : label}
    </button>
  );
}
