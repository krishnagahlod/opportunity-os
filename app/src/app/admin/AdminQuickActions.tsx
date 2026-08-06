"use client";

import { useTransition } from "react";
import { Play, Trash2, Power, TrendingUp } from "lucide-react";
import Link from "next/link";
import { AdminActionButton } from "./AdminActionButton";
import { reEnableAllAutoDisabled, expireStaleOpportunities, triggerCronEndpoint } from "./actions";

export function AdminQuickActions() {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-card/50 p-4">
      <div className="text-sm font-medium tracking-tight mr-2">Quick Actions:</div>
      
      <Link
        href="/admin/analytics"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
      >
        <TrendingUp className="size-3.5" />
        Analytics
      </Link>

      <AdminActionButton 
        label="Re-enable Auto-Disabled" 
        onAction={async () => reEnableAllAutoDisabled()} 
      />
      
      <AdminActionButton 
        label="Expire Stale Opps (60d)" 
        variant="danger"
        onAction={async () => expireStaleOpportunities(60)} 
      />

      <AdminActionButton 
        label="Trigger Ingest" 
        onAction={async () => triggerCronEndpoint("ingest")} 
      />

      <AdminActionButton 
        label="Trigger Digest" 
        onAction={async () => triggerCronEndpoint("daily-digest")} 
      />

      <AdminActionButton 
        label="Recalc Source Quality" 
        onAction={async () => triggerCronEndpoint("source-quality")} 
      />
    </div>
  );
}
