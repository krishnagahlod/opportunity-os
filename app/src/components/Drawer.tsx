"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

/**
 * Side-panel Drawer that pushes the main content to the left.
 * Opens instantly. The feed grid shrinks to make room — no overlay, no blur.
 * Clicking X or pressing Escape closes the panel and restores the full-width feed.
 */
export function Drawer({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // On mount: signal the layout to shrink the main content area.
  // On unmount: restore full-width layout.
  useEffect(() => {
    document.documentElement.classList.add("drawer-open");
    return () => {
      document.documentElement.classList.remove("drawer-open");
    };
  }, []);

  const close = useCallback(() => {
    document.documentElement.classList.remove("drawer-open");
    router.back();
  }, [router]);

  // Escape key closes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [close]);

  return (
    <aside
      role="complementary"
      className="fixed inset-y-0 right-0 z-40 w-[min(540px,100vw)] overflow-y-auto border-l border-border bg-background shadow-xl"
    >
      <div className="sticky top-0 z-10 flex items-center justify-end px-4 pt-3 pb-1">
        <button
          onClick={close}
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
