"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Drawer({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Trigger transition after mount
    const raf = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      router.back();
    }, 300); // Wait for slide-out animation to finish before actually navigating back
  };

  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={close}
        aria-hidden="true"
      />
      
      {/* Sliding Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-y-auto bg-background shadow-2xl transition-transform duration-300 sm:border-l sm:border-border",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 z-50 flex size-8 items-center justify-center rounded-full bg-muted/80 text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <X className="size-4" />
        </button>
        <div className="relative h-full">
          {children}
        </div>
      </div>
    </>
  );
}
