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
  /** Number of items in the admin "Needs review" queue (pending submissions
   * + extraction_confidence < 0.5). Reported in the daily pipeline alert
   * so the admin sees a reminder even when ingestion is otherwise healthy. */
  needsReviewCount: number;
};

const ALERT_THRESHOLD_HOURS = 24;

export async function checkPipelineHealth(): Promise<PipelineHealth> {
  const supabase = createAdminClient();
  const since = new Date(
    Date.now() - ALERT_THRESHOLD_HOURS * 60 * 60 * 1000,
  ).toISOString();

  // Three checks in parallel: ingestion activity, latest log, and needs-review count
  const [
    { count: ingestionCount },
    { data: latest },
    { count: needsReviewCount },
  ] = await Promise.all([
    supabase
      .from("ingestion_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since),
    supabase
      .from("ingestion_logs")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .or("status.eq.pending,extraction_confidence.lt.0.5")
      .neq("status", "spam"),
  ]);

  const lastIngestionAt = (latest?.created_at as string | undefined) ?? null;
  const hoursSinceLast = lastIngestionAt
    ? (Date.now() - new Date(lastIngestionAt).getTime()) / (1000 * 60 * 60)
    : null;

  return {
    healthy: (ingestionCount ?? 0) > 0,
    ingestionsLast24h: ingestionCount ?? 0,
    lastIngestionAt,
    hoursSinceLast,
    needsReviewCount: needsReviewCount ?? 0,
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
 * Render a pipeline-status alert as HTML for Telegram. Adaptive copy —
 * leads with the pipeline-dead story when unhealthy, mentions the
 * needs-review queue when non-empty. Both can fire in the same alert.
 */
export function renderPipelineAlertForTelegram(
  health: PipelineHealth,
  appUrl: string,
): string {
  const lines: string[] = [];

  if (!health.healthy) {
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
  } else if (health.needsReviewCount > 0) {
    lines.push("📋 <b>Opportunity OS — items awaiting review</b>");
    lines.push("");
  }

  if (health.needsReviewCount > 0) {
    lines.push(
      `<b>${health.needsReviewCount}</b> item${health.needsReviewCount === 1 ? "" : "s"} pending admin review (low-confidence extractions or user submissions). They&apos;re hidden from the user feed until approved.`,
    );
    lines.push("");
  }

  if (appUrl && !appUrl.includes("localhost")) {
    lines.push(`<a href="${escapeAttr(appUrl)}/admin">Open admin dashboard →</a>`);
  } else {
    lines.push("<i>Check the admin dashboard at /admin.</i>");
  }
  return lines.join("\n");
}

/** True if the alert should fire today — either pipeline is dead OR there
 * are items waiting in the admin review queue. */
export function shouldAlert(health: PipelineHealth): boolean {
  return !health.healthy || health.needsReviewCount > 0;
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
