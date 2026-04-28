"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markApplied } from "@/app/actions";

/**
 * Did-you-apply toast nudge.
 *
 * Flow: when the user clicks an external "Apply ↗" link, the click handler
 * writes a `pendingApply` JSON blob to localStorage with the opportunity id,
 * title, organization, and timestamp. When they return to our app and a
 * page mounts this component, it reads the flag — if it's fresh (< 30 min
 * old), it shows a sticky bottom-right toast asking "Did you finish
 * applying to X?" with [Mark applied] [Not yet] actions. Either action
 * clears the flag.
 *
 * Why not setTimeout: a delayed firing would never trigger if the user
 * stays on the external apply page for >30s and never comes back to us.
 * Using "next page mount in our app" guarantees the toast appears at
 * exactly the moment we want — when they're back in our context.
 */

const STORAGE_KEY = "opportunity-os:pending-apply";
const FRESHNESS_MS = 30 * 60 * 1000; // 30 min

type PendingApply = {
  id: string;
  title: string;
  org: string;
  ts: number;
};

/** Call this from any "Apply ↗" external-link click handler before nav. */
export function recordPendingApply(opp: {
  id: string;
  title: string;
  organization: string;
}) {
  try {
    const payload: PendingApply = {
      id: opp.id,
      title: opp.title,
      org: opp.organization,
      ts: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Private browsing / quota — silent failure is fine
  }
}

/**
 * Drop-in replacement for an external "Apply ↗" Link that records the
 * pending-apply flag before opening the apply URL. Used on the opportunity
 * detail page (which is a server component and can't pass onClick directly).
 */
export function ExternalApplyLink({
  href,
  opp,
  className,
  children,
}: {
  href: string;
  opp: { id: string; title: string; organization: string };
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => recordPendingApply(opp)}
      className={cn(
        buttonVariants({ size: "default" }),
        "gap-1.5 bg-foreground text-background hover:bg-foreground/85",
        className,
      )}
    >
      {children ?? (
        <>
          Apply
          <ArrowUpRight className="size-4" />
        </>
      )}
    </Link>
  );
}

export function ApplyNudge() {
  const [pending, setPending] = useState<PendingApply | null>(null);
  const [isPending, startTransition] = useTransition();

  // Read storage on mount. Re-read on storage events so a click in one tab
  // can surface the toast in another (rare but cheap to support).
  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return setPending(null);
        const parsed = JSON.parse(raw) as PendingApply;
        if (Date.now() - parsed.ts > FRESHNESS_MS) {
          // Stale → clear and skip
          localStorage.removeItem(STORAGE_KEY);
          return setPending(null);
        }
        setPending(parsed);
      } catch {
        setPending(null);
      }
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);

  function dismiss() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setPending(null);
  }

  function confirmApplied() {
    if (!pending) return;
    startTransition(async () => {
      await markApplied(pending.id);
      dismiss();
    });
  }

  if (!pending) return null;

  return (
    <div
      role="dialog"
      aria-label="Did you finish applying?"
      className="animate-fade-up fixed bottom-4 right-4 z-50 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-border/70 bg-card/95 p-4 shadow-elevated backdrop-blur-md"
    >
      <p className="text-[12.5px] font-semibold tracking-tight">
        Did you finish applying?
      </p>
      <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">
        <span className="font-medium text-foreground">{pending.title}</span> ·{" "}
        {pending.org}
      </p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={dismiss}
          disabled={isPending}
          className="gap-1 text-muted-foreground"
        >
          <X className="size-3.5" />
          Not yet
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={confirmApplied}
          disabled={isPending}
          className="gap-1.5"
        >
          <Check className="size-3.5" />
          {isPending ? "Marking…" : "Mark applied"}
        </Button>
      </div>
    </div>
  );
}
