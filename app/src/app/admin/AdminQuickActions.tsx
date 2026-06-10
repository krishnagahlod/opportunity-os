"use client";

import { useTransition } from "react";
import { Play, Trash2, Power } from "lucide-react";
import { AdminActionButton } from "./AdminActionButton";
import { reEnableAllAutoDisabled, expireStaleOpportunities, triggerCronEndpoint } from "./actions";

export function AdminQuickActions() {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-card/50 p-4">
      <div className="text-sm font-medium tracking-tight mr-2">Quick Actions:</div>
      
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
    </div>
  );
}
