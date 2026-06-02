"use client";

import { useRef, useState } from "react";
import {
  Check,
  FileText,
  Loader2,
  SkipForward,
  Sparkles,
  Upload,
} from "lucide-react";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseResume } from "../settings/actions";
import type { ResumeExtraction } from "@/lib/ai/prompts";

type Phase = "idle" | "uploading" | "parsing" | "done";

/**
 * Counts that get reported back from the parent form after it tries to merge
 * the AI's extraction into our predefined chip lists. Lets us show a truthful
 * "X skills, Y interests ticked" message instead of the AI's raw extraction
 * count (which can be misleading when many extracted terms aren't in our
 * chip lists and silently went to `resume_skills` for later review).
 */
export type ParseResultStats = {
  matchedSkills: number;
  matchedInterests: number;
  /** Skills the AI returned that didn't match any chip — saved as suggestions. */
  extraSkills: number;
};

/**
 * Onboarding "quick start" hero block. Optional — user can skip and fill the
 * form by hand. If they upload a PDF, we parse it once and the form below
 * pre-ticks matching chips. The extracted skills/roles ride through the
 * shared prompt + onboarding-options module so the AI's output and our
 * chip lists are aligned.
 */
export function ResumeQuickStart({
  userId,
  onParsed,
}: {
  userId: string;
  onParsed: (extraction: ResumeExtraction) => ParseResultStats;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [parsingStep, setParsingStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ParseResultStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File is larger than 5 MB. Try a smaller PDF.");
      return;
    }

    setPhase("uploading");

    const id = crypto.randomUUID();
    const path = `${userId}/${id}.pdf`;
    const supabase = createBrowserSupabase();
    const { error: upErr } = await supabase.storage
      .from("resumes")
      .upload(path, file, {
        contentType: "application/pdf",
        upsert: false,
      });
    if (upErr) {
      setError(`Upload failed: ${upErr.message}`);
      setPhase("idle");
      return;
    }

    setPhase("parsing");
    setParsingStep(0);
    const intervalId = setInterval(() => {
      setParsingStep((s) => Math.min(s + 1, 2));
    }, 2500);

    const res = await parseResume(path);
    clearInterval(intervalId);
    
    if ("error" in res) {
      setError(res.error);
      await supabase.storage.from("resumes").remove([path]).catch(() => {});
      setPhase("idle");
      return;
    }

    const result = onParsed(res.extraction);
    setStats(result);
    setPhase("done");
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  /* ============ Done state — collapsed status row ============ */
  if (phase === "done" && stats) {
    return <DoneState stats={stats} onReset={() => {
      setStats(null);
      setPhase("idle");
      setError(null);
    }} />;
  }

  const parsingMessages = [
    "Analyzing your profile...",
    "Mapping skills to domains...",
    "Finding exact matches...",
  ];

  /* ============ Active states ================================ */
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-primary/20 p-6 sm:p-8",
        "bg-gradient-to-br from-primary/[0.06] via-background/80 to-fuchsia-500/[0.05]",
        "shadow-[0_30px_80px_-30px_color-mix(in_oklch,var(--primary)_30%,transparent)]",
      )}
    >
      {/* Decorative shimmer in the corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-fuchsia-500/15 blur-3xl"
      />

      <div className="relative">
        <div className="flex items-start gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md">
            <Sparkles className="size-4" />
          </span>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Quick start
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
              Skip 2 minutes of typing
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Drop your resume PDF — we&apos;ll auto-tick matching skills and
              interests in ~15 seconds.
            </p>
          </div>
        </div>

        {(phase === "uploading" || phase === "parsing") ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-primary/20 bg-background/80 px-4 py-3.5 backdrop-blur-sm">
            <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
            <span className="text-sm font-medium text-foreground animate-pulse">
              {phase === "uploading"
                ? "Uploading..."
                : parsingMessages[parsingStep]}
            </span>
          </div>
        ) : (
          <div className="mt-5">
            <DropZone
              onDrop={onDrop}
              onPick={() => fileInputRef.current?.click()}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11.5px] text-muted-foreground">
              <span>PDF · max 5 MB · text-PDFs only (scanned not supported)</span>
              <a
                href="#onboarding-form"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .querySelector<HTMLElement>('section[aria-label="basics"], form section')
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium transition hover:bg-muted hover:text-foreground"
              >
                <SkipForward className="size-3" />
                Fill manually instead
              </a>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={onChange}
        disabled={phase === "uploading" || phase === "parsing"}
      />
    </section>
  );
}

/* ============================================================================
 * Sub-components
 * ========================================================================== */

function DoneState({
  stats,
  onReset,
}: {
  stats: ParseResultStats;
  onReset: () => void;
}) {
  // Build a readable headline based on the actual ticked counts (truth)
  // rather than the AI's raw extraction count (which can mislead when many
  // terms didn't match our chip list).
  const tickedTotal = stats.matchedSkills + stats.matchedInterests;
  const ticked =
    tickedTotal === 0
      ? "Resume parsed — no exact matches in our chip list, fill in below"
      : [
          stats.matchedSkills > 0 &&
            `${stats.matchedSkills} skill${stats.matchedSkills === 1 ? "" : "s"}`,
          stats.matchedInterests > 0 &&
            `${stats.matchedInterests} interest${stats.matchedInterests === 1 ? "" : "s"}`,
        ]
          .filter(Boolean)
          .join(" + ");

  const tickedHeadline =
    tickedTotal === 0 ? ticked : `Pre-filled — ${ticked} ticked below`;

  return (
    <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <Check className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{tickedHeadline}</p>
          {stats.extraSkills > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {stats.extraSkills} more skill{stats.extraSkills === 1 ? "" : "s"} from
              your resume saved as suggestions — review them in Settings later.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <FileText className="size-3" />
          Replace
        </button>
      </div>
    </section>
  );
}

function DropZone({
  onDrop,
  onPick,
}: {
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onPick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/30 bg-background/60 px-6 py-8 text-center backdrop-blur-sm transition-all",
        hover &&
          "border-primary/60 bg-primary/[0.06] shadow-[0_0_0_4px_color-mix(in_oklch,var(--primary)_15%,transparent)]",
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-fuchsia-500/20 text-primary">
        <Upload className="size-4" />
      </span>
      <p className="text-sm font-medium">Drop your resume PDF here</p>
      <Button
        type="button"
        size="sm"
        onClick={onPick}
        className="gap-1.5 bg-foreground text-background hover:bg-foreground/85"
      >
        <Upload className="size-3.5" />
        Choose PDF
      </Button>
    </div>
  );
}
