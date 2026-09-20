"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command, X, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();
  const pendingChord = React.useRef<string | null>(null);
  const chordTimeout = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl as HTMLElement)?.isContentEditable;

      // Escape closes modal or blurs input
      if (e.key === "Escape") {
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
          return;
        }
        if (isInput) {
          (activeEl as HTMLElement).blur();
          return;
        }
      }

      // If typing in an input, do not intercept single key shortcuts
      if (isInput) return;

      // '?' triggers shortcuts dialog
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      // '/' triggers search focus
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const searchInput =
          document.querySelector<HTMLInputElement>('input[type="search"]') ||
          document.querySelector<HTMLInputElement>('input[placeholder*="Search" i]') ||
          document.querySelector<HTMLInputElement>("#search-input");
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        } else {
          router.push("/?focus=search");
        }
        return;
      }

      // Chords (e.g., 'g' then key)
      if (pendingChord.current === "g") {
        pendingChord.current = null;
        if (chordTimeout.current) clearTimeout(chordTimeout.current);

        if (e.key === "h") {
          e.preventDefault();
          router.push("/");
          return;
        }
        if (e.key === "a") {
          e.preventDefault();
          router.push("/applications");
          return;
        }
        if (e.key === "s") {
          e.preventDefault();
          router.push("/saved");
          return;
        }
        if (e.key === "p") {
          e.preventDefault();
          router.push("/settings");
          return;
        }
      }

      if (e.key === "g" && !e.metaKey && !e.ctrlKey) {
        pendingChord.current = "g";
        chordTimeout.current = setTimeout(() => {
          pendingChord.current = null;
        }, 1200);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (chordTimeout.current) clearTimeout(chordTimeout.current);
    };
  }, [isOpen, router]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Keyboard className="size-4" />
            </div>
            <div>
              <h2
                id="shortcuts-title"
                className="text-base font-semibold text-foreground"
              >
                Keyboard Shortcuts
              </h2>
              <p className="text-xs text-muted-foreground">
                Navigate Opportunity OS at lightning speed
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            aria-label="Close shortcuts modal"
            className="size-8 rounded-lg"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-5 space-y-6 text-sm">
          {/* Global Actions */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              General
            </h3>
            <div className="space-y-2.5">
              <ShortcutRow keys={["/"]} label="Focus search input" />
              <ShortcutRow keys={["?"]} label="Toggle keyboard shortcuts" />
              <ShortcutRow keys={["Esc"]} label="Close modal / blur search" />
            </div>
          </div>

          {/* Navigation Chords */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Navigation
            </h3>
            <div className="space-y-2.5">
              <ShortcutRow
                chords={[
                  { key: "g" },
                  { text: "then" },
                  { key: "h" },
                ]}
                label="Go to Feed"
              />
              <ShortcutRow
                chords={[
                  { key: "g" },
                  { text: "then" },
                  { key: "a" },
                ]}
                label="Go to Applications Tracker"
              />
              <ShortcutRow
                chords={[
                  { key: "g" },
                  { text: "then" },
                  { key: "s" },
                ]}
                label="Go to Saved"
              />
              <ShortcutRow
                chords={[
                  { key: "g" },
                  { text: "then" },
                  { key: "p" },
                ]}
                label="Go to Settings"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-border/50 pt-4 flex justify-between items-center text-xs text-muted-foreground">
          <span>Press <kbd className="rounded border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[11px]">?</kbd> anywhere to open</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({
  keys,
  chords,
  label,
}: {
  keys?: string[];
  chords?: Array<{ key?: string; text?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground/80">{label}</span>
      <div className="flex items-center gap-1.5">
        {keys &&
          keys.map((k) => (
            <kbd
              key={k}
              className="inline-flex min-w-[24px] items-center justify-center rounded-md border border-border/80 bg-muted/60 px-2 py-0.5 text-xs font-mono font-medium shadow-sm text-foreground"
            >
              {k}
            </kbd>
          ))}
        {chords &&
          chords.map((c, i) =>
            c.key ? (
              <kbd
                key={i}
                className="inline-flex min-w-[24px] items-center justify-center rounded-md border border-border/80 bg-muted/60 px-2 py-0.5 text-xs font-mono font-medium shadow-sm text-foreground"
              >
                {c.key}
              </kbd>
            ) : (
              <span key={i} className="text-xs text-muted-foreground">
                {c.text}
              </span>
            ),
          )}
      </div>
    </div>
  );
}
