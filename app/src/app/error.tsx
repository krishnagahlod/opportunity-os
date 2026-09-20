"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft, ShieldAlert } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception to Sentry and console
    console.error("[Opportunity OS Client Error Boundary]:", error);
    try {
      Sentry.captureException(error);
    } catch {}
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between font-sans">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-sm text-foreground tracking-tight"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background font-mono text-xs">
              O
            </span>
            <span className="text-base font-extrabold">Opportunity OS</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive shadow-inner">
          <AlertTriangle className="size-7" />
        </div>

        <span className="text-xs font-mono font-semibold uppercase tracking-widest text-destructive">
          Application Error
        </span>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md">
          An unexpected error occurred while rendering this view. Our error monitoring systems have logged the incident.
        </p>

        {error.digest && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
            <ShieldAlert className="size-3 text-amber-500" />
            <span>Incident Reference: <code className="text-foreground">{error.digest}</code></span>
          </div>
        )}

        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <ArrowLeft className="size-3.5" />
            Return Home
          </Link>
        </div>
      </main>

      <footer className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground font-mono">
        <p>© {new Date().getFullYear()} Opportunity OS · Resilient Application Runtime</p>
      </footer>
    </div>
  );
}
