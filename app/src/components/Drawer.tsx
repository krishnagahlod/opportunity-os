"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

/**
 * Side-panel shell. Opens instantly, pushes main content left via CSS.
 * Fully client-side — no URL change, no server roundtrip.
 */
export function Drawer({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Signal the layout to shrink the main content area
  useEffect(() => {
    document.documentElement.classList.add("drawer-open");
    return () => {
      document.documentElement.classList.remove("drawer-open");
    };
  }, []);

  // Escape key closes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <aside
      role="complementary"
      className="fixed inset-y-0 right-0 z-40 w-[min(540px,100vw)] overflow-y-auto border-l border-border bg-background shadow-xl"
    >
      <div className="sticky top-0 z-10 flex items-center justify-end bg-background/80 px-4 pt-3 pb-1 backdrop-blur-sm">
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="flex size-7 items-center justify-center rounded-full border border-border/60 bg-card text-foreground shadow-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <X className="size-3.5" />
        </button>
      </div>
      {children}
    </aside>
  );
}
