"use client";

import { useState } from "react";
import { EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function HideButton({ opportunityId, compact = false, onHidden }: { opportunityId: string; compact?: boolean; onHidden?: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleHide(e: React.MouseEvent) {
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId, feedback: "not_interested" }),
      });
      if (res.ok && onHidden) {
        onHidden();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleHide}
      disabled={loading}
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-border bg-background font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50",
        compact ? "size-7" : "gap-1.5 px-3 py-1.5 text-xs",
      )}
      title="Not for me / Hide"
      aria-label="Hide opportunity"
    >
      <EyeOff className="size-3.5" />
      {!compact && "Hide"}
    </button>
  );
}
