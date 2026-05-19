import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/db";

/**
 * Pipeline-health monitoring.
 *
 * Detects "n8n stopped firing" by checking whether any rows have been added
 * to `ingestion_logs` in the last 24 hours. Folded into the daily-digest
 * cron so a dead pipeline produces a daily Telegram + email alert to admin
 * users — replaces the previous "silently broken for 19 days" failure mode
 * we hit when Render free tier suspended n8n.
 *
 * Why 24h: the longest legitimate gap between any two workflow fires is
 * ~12h (the slowest workflow's schedule). 24h of zero activity definitively
 * means the pipeline is dead, not just slow.
 *
 * Why ALL log statuses count: the goal is detecting "n8n fired at all".
 * Even `skipped_duplicate` or `failed` rows prove a workflow ran. Only
 * zero rows means the pipeline itself stopped.
 */

export type PipelineHealth = {
  healthy: boolean;
  ingestionsLast24h: number;
  /** ISO timestamp of the most recent ingestion_logs row (any status), or null if none ever. */
  lastIngestionAt: string | null;
  /** Hours since lastIngestionAt; null if never. */
  hoursSinceLast: number | null;
};

const ALERT_THRESHOLD_HOURS = 24;

export async function checkPipelineHealth(): Promise<PipelineHealth> {
  const supabase = createAdminClient();
  const since = new Date(
    Date.now() - ALERT_THRESHOLD_HOURS * 60 * 60 * 1000,
  ).toISOString();

  // Count any ingestion activity in last 24h
  const { count } = await supabase
    .from("ingestion_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since);

  // Most recent ingestion log of any kind — used for the alert copy
  const { data: latest } = await supabase
    .from("ingestion_logs")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastIngestionAt = (latest?.created_at as string | undefined) ?? null;
  const hoursSinceLast = lastIngestionAt
    ? (Date.now() - new Date(lastIngestionAt).getTime()) / (1000 * 60 * 60)
    : null;

  return {
    healthy: (count ?? 0) > 0,
    ingestionsLast24h: count ?? 0,
    lastIngestionAt,
    hoursSinceLast,
  };
}

/** Onboarded admin users — recipients for the pipeline-dead alert. */
export async function getAdminRecipients(): Promise<Profile[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "admin")
    .eq("onboarded", true);
  return (data as Profile[] | null) ?? [];
}

/**
 * Render a pipeline-dead alert as HTML for Telegram. Keeps the same HTML
 * parse mode the regular digest uses so escaping rules are consistent.
 */
export function renderPipelineAlertForTelegram(
  health: PipelineHealth,
  appUrl: string,
): string {
  const lines: string[] = [];
  lines.push("🚨 <b>Opportunity OS — pipeline appears dead</b>");
  lines.push("");
  if (health.lastIngestionAt && health.hoursSinceLast !== null) {
    const hours = Math.round(health.hoursSinceLast);
    lines.push(
      `No ingestion activity in the last <b>${hours} hours</b>. Last log entry was ${formatRelative(health.lastIngestionAt)}.`,
    );
  } else {
    lines.push("No ingestion logs found at all.");
  }
  lines.push("");
  lines.push("<b>Likely causes</b>");
  lines.push("• Render free tier suspended n8n (monthly quota)");
  lines.push("• Workflows lost their published state after restart");
  lines.push("• Neon database auto-paused");
  lines.push("");
  if (appUrl && !appUrl.includes("localhost")) {
    lines.push(`<a href="${escapeAttr(appUrl)}/admin">Open admin dashboard →</a>`);
  } else {
    lines.push("<i>Check Render service status and re-publish workflows.</i>");
  }
  return lines.join("\n");
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = diffMs / (1000 * 60 * 60 * 24);
  if (days >= 1) {
    const d = Math.floor(days);
    return `${d} day${d === 1 ? "" : "s"} ago`;
  }
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
