"use client";

import { useRef, useState } from "react";
import { Check, FileText, Loader2, SkipForward, Upload, Zap } from "lucide-react";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseResume } from "../settings/actions";
import type { ResumeExtraction } from "@/lib/ai/prompts";

type Phase = "idle" | "uploading" | "parsing" | "done" | "skipped";

/**
 * Onboarding "quick start" block. Optional — user can skip and fill the form
 * by hand. If they upload a PDF, we parse it once and the form below pre-ticks
 * matching chips. Skills/roles not in our chip lists still get persisted to
 * `resume_skills` so the user can confirm them later from Settings.
 */
export function ResumeQuickStart({
  userId,
  onParsed,
  onSkip,
}: {
  userId: string;
  onParsed: (extraction: ResumeExtraction) => void;
  onSkip: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ skills: number; roles: number } | null>(
    null,
  );
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
    const res = await parseResume(path);
    if ("error" in res) {
      setError(res.error);
      // Don't leave an orphan PDF in storage if parse failed.
      await supabase.storage.from("resumes").remove([path]).catch(() => {});
      setPhase("idle");
      return;
    }

    setStats({
      skills: res.extraction.skills.length,
      roles: res.extraction.roles_of_interest.length,
    });
    setPhase("done");
    onParsed(res.extraction);
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

  function skip() {
    setPhase("skipped");
    onSkip();
  }

  // Once parsed (or skipped) we collapse this whole block to a thin status row
  // so it doesn't compete visually with the form below.
  if (phase === "done") {
    return (
      <CollapsedStatus
        kind="done"
        title={
          stats && (stats.skills + stats.roles) > 0
            ? `Pre-filled from your resume — ${stats.skills} skill${
                stats.skills === 1 ? "" : "s"
              }${
                stats.roles > 0
                  ? `, ${stats.roles} interest${stats.roles === 1 ? "" : "s"}`
                  : ""
              } ticked below`
            : "Resume parsed — review the form below"
        }
      />
    );
  }
  if (phase === "skipped") {
    return null;
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-5 shadow-[0_20px_60px_-30px_color-mix(in_oklch,var(--primary)_30%,transparent)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Zap className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Quick start (optional)</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Drop your resume — we&apos;ll auto-tick matching skills + interests
              below in ~15 seconds.
            </p>
          </div>
        </div>
      </div>

      {(phase === "uploading" || phase === "parsing") ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-background/60 px-4 py-3">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            {phase === "uploading"
              ? "Uploading..."
              : "Reading resume with AI — about 10–20 seconds..."}
          </span>
        </div>
      ) : (
        <div className="mt-4">
          <DropZone
            onDrop={onDrop}
            onPick={() => fileInputRef.current?.click()}
          />
          <div className="mt-3 flex items-center justify-between gap-3 text-[11.5px] text-muted-foreground">
            <span>PDF · max 5 MB · scanned PDFs not supported</span>
            <button
              type="button"
              onClick={skip}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <SkipForward className="size-3" />
              Skip
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={onChange}
        disabled={phase === "uploading" || phase === "parsing"}
      />
    </div>
  );
}

function CollapsedStatus({
  kind,
  title,
}: {
  kind: "done";
  title: string;
}) {
  const Icon = kind === "done" ? Check : FileText;
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/[0.06] px-3 py-1.5 text-[12px] font-medium text-primary">
      <Icon className="size-3.5" />
      {title}
    </div>
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
        "flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-primary/30 bg-background/60 px-6 py-6 text-center transition",
        hover && "border-primary/60 bg-primary/[0.06]",
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Upload className="size-4" />
      </span>
      <p className="text-sm font-medium">Drop your resume PDF here</p>
      <Button type="button" size="sm" onClick={onPick} className="gap-1.5">
        <Upload className="size-3.5" />
        Choose PDF
      </Button>
    </div>
  );
}
