"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Opportunity OS Critical Global Crash]:", error);
    try {
      Sentry.captureException(error);
    } catch {}
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4 font-sans antialiased">
        <div className="max-w-md w-full text-center space-y-6 rounded-2xl border border-neutral-800 bg-neutral-900/90 p-8 shadow-2xl">
          <div className="mx-auto size-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-mono font-bold text-lg">
            !
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Critical System Interruption
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Opportunity OS encountered an unrecoverable system exception. Our engineering team has received an automated incident report.
            </p>
          </div>

          {error.digest && (
            <div className="p-2 rounded-lg bg-neutral-800/80 font-mono text-[11px] text-neutral-400">
              Reference: <span className="text-white">{error.digest}</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-neutral-200 transition cursor-pointer"
            >
              Reload Application
            </button>
            <a
              href="/"
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-700 transition"
            >
              Return Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
