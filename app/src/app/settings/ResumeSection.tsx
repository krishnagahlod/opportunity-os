"use client";

import { useRef, useState, useTransition } from "react";
import {
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  applyResumeSkill,
  dismissResumeSkill,
  parseResume,
  removeResume,
} from "./actions";

type Phase = "idle" | "uploading" | "parsing" | "done";

/**
 * Resume upload + AI skill extraction block on /settings.
 *
 * Flow visible to user:
 *   - Empty state: drop zone + "Choose PDF" button
 *   - During upload: spinner + "Uploading..." then "Reading with AI..."
 *   - After parse: list of suggested skills as chips with "+ Add" / "X" actions.
 *     Each "+ Add" merges that skill into the user-confirmed Skills section above.
 *   - With resume on file: filename strip + "Replace" / "Remove" actions.
 */
export function ResumeSection({
  userId,
  initialResumePath,
  initialSuggestions,
  initialUploadedAt,
}: {
  userId: string;
  initialResumePath: string | null;
  initialSuggestions: string[];
  initialUploadedAt: string | null;
}) {
  const [resumePath, setResumePath] = useState<string | null>(initialResumePath);
  const [uploadedAt, setUploadedAt] = useState<string | null>(initialUploadedAt);
  const [suggestions, setSuggestions] = useState<string[]>(initialSuggestions);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
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

    // Path: <user_id>/<random-uuid>.pdf — RLS on the bucket enforces that only
    // this user can write under their own folder.
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
      // Clean up orphaned upload — don't leave a parsed-but-unparsed file behind.
      await supabase.storage.from("resumes").remove([path]).catch(() => {});
      setPhase("idle");
      return;
    }

    setResumePath(path);
    setSuggestions(res.extraction.skills);
    setUploadedAt(new Date().toISOString());
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
    // Reset so the same filename can be re-selected later.
    e.target.value = "";
  }

  function add(skill: string) {
    setError(null);
    setAdding(skill);
    startTransition(async () => {
      const res = await applyResumeSkill(skill);
      setAdding(null);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setSuggestions((prev) =>
        prev.filter((s) => s.toLowerCase() !== skill.toLowerCase()),
      );
    });
  }

  function dismiss(skill: string) {
    setError(null);
    startTransition(async () => {
      const res = await dismissResumeSkill(skill);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setSuggestions((prev) =>
        prev.filter((s) => s.toLowerCase() !== skill.toLowerCase()),
      );
    });
  }

  async function remove() {
    if (
      !confirm(
        "Remove your resume? Your confirmed skills stay; only the file and unaccepted suggestions are cleared.",
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await removeResume();
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setResumePath(null);
      setUploadedAt(null);
      setSuggestions([]);
      setPhase("idle");
    });
  }

  const busy =
    phase === "uploading" || phase === "parsing" || isPending;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Resume</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Upload a PDF and AI will pull out your skills as suggestions you can
          add to your profile in one click. Better skill data → sharper feed
          ranking.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        {/* === No resume yet → drop zone ===================================== */}
        {!resumePath && phase !== "uploading" && phase !== "parsing" && (
          <DropZone
            onDrop={onDrop}
            onPick={() => fileInputRef.current?.click()}
          />
        )}

        {/* === Active upload / parse states ================================== */}
        {(phase === "uploading" || phase === "parsing") && (
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/40 px-4 py-3">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {phase === "uploading"
                ? "Uploading PDF..."
                : "Reading resume with AI — this takes about 10–20 seconds..."}
            </span>
          </div>
        )}

        {/* === Resume on file ================================================ */}
        {resumePath && phase !== "uploading" && phase !== "parsing" && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                Resume on file
              </p>
              <p className="text-[11px] text-muted-foreground">
                {uploadedAt
                  ? `Uploaded ${formatDistanceToNowStrict(
                      parseISO(uploadedAt),
                      { addSuffix: true },
                    )}`
                  : "Recently uploaded"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="gap-1.5"
            >
              <Upload className="size-3.5" />
              Replace
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={remove}
              disabled={busy}
              className="gap-1.5 text-muted-foreground"
            >
              <Trash2 className="size-3.5" />
              Remove
            </Button>
          </div>
        )}

        {/* === Suggested skills ============================================== */}
        {suggestions.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              <Sparkles className="size-3 text-primary" />
              AI-suggested skills · review and add
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((skill) => (
                <SuggestionChip
                  key={skill}
                  skill={skill}
                  busy={adding === skill}
                  onAdd={() => add(skill)}
                  onDismiss={() => dismiss(skill)}
                />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Adding a skill merges it into your Skills section above and
              boosts opportunities mentioning it on your next dashboard load.
            </p>
          </div>
        )}

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
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
        disabled={busy}
      />
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
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/70 bg-background px-6 py-8 text-center transition",
        hover && "border-primary/60 bg-primary/[0.04]",
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Upload className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">Drop your resume PDF here</p>
        <p className="text-xs text-muted-foreground">or click to browse · max 5 MB</p>
      </div>
      <Button type="button" size="sm" onClick={onPick} className="gap-1.5">
        <Upload className="size-3.5" />
        Choose PDF
      </Button>
    </div>
  );
}

function SuggestionChip({
  skill,
  busy,
  onAdd,
  onDismiss,
}: {
  skill: string;
  busy: boolean;
  onAdd: () => void;
  onDismiss: () => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/[0.06] py-1 pl-3 pr-1 text-xs font-medium",
        busy && "opacity-50",
      )}
    >
      <span className="text-primary">{skill}</span>
      <button
        type="button"
        onClick={onAdd}
        disabled={busy}
        aria-label={`Add ${skill} to skills`}
        className="ml-1 inline-flex size-5 items-center justify-center rounded-full text-primary transition hover:bg-primary/15"
      >
        {busy ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <Plus className="size-3" />
        )}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        disabled={busy}
        aria-label={`Dismiss ${skill}`}
        className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

