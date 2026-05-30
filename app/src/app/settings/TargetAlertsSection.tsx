"use client";

import { BellRing, Sparkles } from "lucide-react";
import Link from "next/link";

export function TargetAlertsSection({ isPremium = false }: { isPremium?: boolean }) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border/60 bg-muted/30 px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-medium text-foreground">
          <BellRing className="size-4 text-primary" />
          Premium Target Alerts
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Get notified instantly on Telegram when specific companies or roles are posted.
        </p>
      </div>

      <div className="p-5">
        {!isPremium ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 px-4 text-center bg-muted/10">
            <Sparkles className="size-8 text-primary mb-3 opacity-80" />
            <h3 className="text-sm font-medium text-foreground">Unlock Target Alerts</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Upgrade to Pro to set up custom instant alerts for your dream companies and never miss a drop.
            </p>
            <Link
              href="/pricing"
              className="mt-5 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/90"
            >
              View Plans
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 px-4 text-center">
             <p className="text-sm text-muted-foreground">
                You have no active alerts. Create one to get started!
             </p>
             <button
              className="mt-5 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/90"
             >
                Create Alert
             </button>
          </div>
        )}
      </div>
    </section>
  );
}
