"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  deleteOpportunity,
  overrideConfidence,
  setOpportunityStatus,
} from "./actions";
import type { Opportunity } from "@/types/db";

/**
 * Admin moderation queue surfacing two classes of items that need human eyes
 * before reaching users:
 *
 *   1. User-submitted opportunities (`status='pending'`) — submitted via
 *      /submit but not yet approved.
 *   2. Low-confidence AI extractions (`extraction_confidence < 0.5`) — the
 *      feed filter routes these here so a human can verify them or kill them.
 *
 * Phase 12.3 addition. Replaces the previous "find bad rows by scrolling
 * the Opportunities table" workflow with a focused queue + per-row actions.
 */

type ReviewKind = "pending" | "low-confidence";

export type ReviewRow = Opportunity & {
  kind: ReviewKind;
};

export function NeedsReviewSection({ rows }: { rows: ReviewRow[] }) {
  const [expanded, setExpanded] = useState(true);

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/[0.04]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-amber-500/[0.06]"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300">
            <AlertCircle className="size-3.5" />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">
              Needs review ({rows.length})
            </p>
            <p className="text-[11.5px] text-muted-foreground">
              Pending submissions + low-confidence AI extractions. Hidden from
              the user-facing feed until approved.
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-amber-500/20">
          <table className="w-full">
            <thead>
              <tr className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <th className="px-5 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Org</th>
                <th className="px-3 py-2 text-left">Why</th>
                <th className="px-3 py-2 text-left">Confidence</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <ReviewRowItem key={row.id} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ReviewRowItem({ row }: { row: ReviewRow }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function approve() {
    setError(null);
    startTransition(async () => {
      // For pending: set status='active'. For low-confidence: bump confidence
      // to 0.7 so it appears with no badge.
      const res =
        row.kind === "pending"
          ? await setOpportunityStatus(row.id, "active")
          : await overrideConfidence(row.id, 0.7);
      if ("error" in res) setError(res.error);
    });
  }

  function markSpam() {
    setError(null);
    startTransition(async () => {
      const res = await setOpportunityStatus(row.id, "spam");
      if ("error" in res) setError(res.error);
    });
  }

  function hardDelete() {
    if (
      !confirm(
        `Hard-delete "${row.title}"? This is permanent — saves and applications cascade.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteOpportunity(row.id);
      if ("error" in res) setError(res.error);
    });
  }

  const confidence =
    row.extraction_confidence !== null && row.extraction_confidence !== undefined
      ? Math.round(row.extraction_confidence * 100)
      : null;

  return (
    <tr
      className={cn(
        "border-t border-amber-500/15 text-[12.5px]",
        isPending && "opacity-50",
      )}
    >
      <td className="max-w-[280px] truncate px-5 py-2.5 font-medium">
        <Link
          href={`/opportunity/${row.id}`}
          target="_blank"
          className="inline-flex items-center gap-1 hover:text-primary hover:underline"
        >
          <span className="truncate">{row.title}</span>
          <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
        </Link>
      </td>
      <td className="max-w-[140px] truncate px-3 py-2.5 text-muted-foreground">
        {row.organization}
      </td>
      <td className="px-3 py-2.5">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]",
            row.kind === "pending"
              ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300"
              : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
          )}
        >
          {row.kind === "pending" ? "pending" : "low-confidence"}
        </span>
      </td>
      <td className="px-3 py-2.5 font-mono tabular-nums text-muted-foreground">
        {confidence !== null ? `${confidence}%` : "—"}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={approve}
            disabled={isPending}
            title={
              row.kind === "pending"
                ? "Approve → status=active"
                : "Override confidence to 70%"
            }
            className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300"
          >
            <Check className="size-3" />
            Approve
          </button>
          <button
            type="button"
            onClick={markSpam}
            disabled={isPending}
            title="Mark spam → hidden everywhere"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-3" />
            Spam
          </button>
          <button
            type="button"
            onClick={hardDelete}
            disabled={isPending}
            title="Hard delete — cascades to saves + applications"
            className="inline-flex items-center justify-center rounded-md border border-border bg-background p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete row"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
        {error && (
          <p className="mt-1 text-[10.5px] text-destructive">{error}</p>
        )}
      </td>
    </tr>
  );
}
