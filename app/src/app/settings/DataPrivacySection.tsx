"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Download, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteUserAccount } from "./actions";

export function DataPrivacySection() {
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = () => {
    startDeleteTransition(async () => {
      setDeleteError(null);
      const res = await deleteUserAccount();
      if (res.ok) {
        router.push("/?deleted=true");
        router.refresh();
      } else {
        setDeleteError(res.error || "Failed to delete account. Please try again.");
      }
    });
  };

  return (
    <section className="rounded-2xl border border-border/70 bg-card/60 p-6 shadow-sm space-y-6">
      <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground">
              Data Privacy & Statutory Rights
            </h3>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              DPDPA 2023 & GDPR
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Exercise your legal data rights under the Digital Personal Data Protection Act (India) and GDPR. You have full ownership of your personal career data.
          </p>
        </div>
        <div className="size-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
          <ShieldCheck className="size-5" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Right to Data Portability (Section 11) */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
              Export Personal Data
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Download a structured, machine-readable JSON copy of your profile, extracted resume skills, applications, saved jobs, and sessions.
            </p>
          </div>
          <a
            href="/api/account/export"
            download="opportunity_os_data_export.json"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition shadow-2xs w-full"
          >
            <Download className="size-3.5 text-primary" />
            Download My Data (JSON)
          </a>
        </div>

        {/* Right to Erasure / Account Deletion (Section 12) */}
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-destructive">
              Erase Account & Personal Data
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Permanently purge your profile, stored resume files, application tracker items, and delete your authentication account.
            </p>
          </div>

          {!confirmDelete ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs gap-1.5 w-full"
            >
              <Trash2 className="size-3.5" />
              Delete Account...
            </Button>
          ) : (
            <div className="space-y-2 rounded-lg border border-destructive/40 bg-card p-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-2 text-xs text-destructive font-medium">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span>This action is permanent and cannot be undone.</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="flex-1 text-xs gap-1.5 h-8"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Confirm Deletion"
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={isDeleting}
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {deleteError && (
        <p className="text-xs text-destructive rounded-lg border border-destructive/30 bg-destructive/10 p-2.5">
          {deleteError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground pt-2 border-t border-border/40 font-mono">
        <div>
          <span>Binding Guarantee: </span>
          <span className="text-foreground">Zero AI model training on candidate resumes</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/privacy" className="hover:text-foreground transition hover:underline">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/contact" className="hover:text-foreground transition hover:underline">
            Grievance Redressal
          </Link>
        </div>
      </div>
    </section>
  );
}
