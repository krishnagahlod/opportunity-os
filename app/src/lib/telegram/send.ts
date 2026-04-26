import "server-only";
import type { DigestItem } from "@/lib/notifications/digest";
import { format, parseISO } from "date-fns";

const TELEGRAM_API = "https://api.telegram.org";

export type TelegramSendResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * One-way push to a Telegram chat. Uses the Bot API directly via fetch — no
 * SDK / no polling / no webhook needed. Caller passes the chat_id; we look
 * up the bot token from env.
 *
 * Uses HTML parse mode (not Markdown) — Telegram's legacy Markdown is
 * fragile (one stray special char silently breaks ALL formatting in the
 * message). HTML is strict and predictable.
 */
export async function sendTelegramMessage(
  chatId: string,
  html: string,
): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN not set" };

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: html,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return {
        ok: false,
        error: `Telegram ${res.status}: ${body.slice(0, 300)}`,
      };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

/** Render a digest as a compact HTML message for Telegram. */
export function renderDigestForTelegram({
  firstName,
  myDeadlines,
  topPicks,
  closingSoon,
  appUrl,
}: {
  firstName: string;
  myDeadlines: DigestItem[];
  topPicks: DigestItem[];
  closingSoon: DigestItem[];
  appUrl: string;
}): string {
  const lines: string[] = [];
  lines.push(`<b>Hey ${escapeHtml(firstName)} — here's your digest</b>`);
  lines.push("");

  if (myDeadlines.length > 0) {
    lines.push("🚨 <b>Your saved · closing in 48h</b>");
    for (const i of myDeadlines.slice(0, 5)) {
      lines.push(formatItem(i));
    }
    lines.push("");
  }

  if (closingSoon.length > 0) {
    lines.push("⏰ <b>Closing soon</b>");
    for (const i of closingSoon.slice(0, 5)) {
      lines.push(formatItem(i));
    }
    lines.push("");
  }

  if (topPicks.length > 0) {
    lines.push("✨ <b>Top picks</b>");
    for (const i of topPicks) {
      lines.push(formatItem(i));
    }
    lines.push("");
  }

  // Only emit a clickable link to the dashboard when we have a non-localhost
  // URL — Telegram won't make localhost links useful from a phone anyway.
  if (appUrl && !appUrl.includes("localhost") && !appUrl.includes("127.0.0.1")) {
    lines.push(`<a href="${escapeAttr(appUrl)}">Open dashboard →</a>`);
  } else {
    lines.push(
      `<i>Dashboard: ${escapeHtml(appUrl)} (local — open from your laptop)</i>`,
    );
  }

  return lines.join("\n");
}

function formatItem({ opportunity: o, score }: DigestItem): string {
  const link = o.apply_url;
  const titleHtml = link
    ? `<a href="${escapeAttr(link)}"><b>${escapeHtml(o.title)}</b></a>`
    : `<b>${escapeHtml(o.title)}</b>`;
  const meta: string[] = [escapeHtml(o.organization), `${score}/100`];
  if (o.deadline) {
    meta.push(`Due ${escapeHtml(format(parseISO(o.deadline), "MMM d"))}`);
  }
  return `• ${titleHtml} — ${meta.join(" · ")}`;
}

/** Escape HTML special chars in a text node. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Escape HTML special chars + quotes for inside an attribute value. */
function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, "&quot;");
}
