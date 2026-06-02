"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Side-panel Drawer that slides in from the right WITHOUT blurring or hiding
 * the feed behind it. The feed remains fully visible and scrollable.
 * Clicking outside (on the feed) or pressing Escape closes the panel.
 */
export function Drawer({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Trigger the slide-in animation after mount
    const raf = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      router.back();
    }, 250);
  }, [router]);

  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [close]);

  return (
    <>
      {/* Thin click-catcher on the left side — no blur, no dimming.
          Just catches clicks so tapping on the feed area closes the panel. */}
      <div
        className={cn(
          "fixed inset-0 z-40 transition-opacity duration-250",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={close}
        aria-hidden="true"
      />

      {/* Sliding Panel — sits on the right side, no full-screen overlay */}
      <div
        role="dialog"
        aria-modal="false"
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto border-l border-border bg-background shadow-2xl transition-transform duration-250 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-end px-4 pt-4">
          <button
            onClick={close}
            aria-label="Close panel"
            className="flex size-8 items-center justify-center rounded-full border border-border/60 bg-card text-foreground shadow-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="relative">
          {children}
        </div>
      </div>
    </>
  );
}
