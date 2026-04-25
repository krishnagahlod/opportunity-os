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
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN not set" };

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return {
        ok: false,
        error: `Telegram ${res.status}: ${body.slice(0, 200)}`,
      };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

/** Render a digest as a compact Markdown message for Telegram. */
export function renderDigestForTelegram({
  firstName,
  topPicks,
  closingSoon,
  appUrl,
}: {
  firstName: string;
  topPicks: DigestItem[];
  closingSoon: DigestItem[];
  appUrl: string;
}): string {
  const lines: string[] = [];
  lines.push(`*Hey ${escapeMd(firstName)} — here's your digest*`);
  lines.push("");

  if (closingSoon.length > 0) {
    lines.push("⏰ *Closing soon*");
    for (const i of closingSoon.slice(0, 5)) {
      lines.push(formatItem(i));
    }
    lines.push("");
  }

  if (topPicks.length > 0) {
    lines.push("✨ *Top picks*");
    for (const i of topPicks) {
      lines.push(formatItem(i));
    }
    lines.push("");
  }

  lines.push(`[Open dashboard](${appUrl})`);
  return lines.join("\n");
}

function formatItem({ opportunity: o, score }: DigestItem): string {
  const link = o.apply_url ?? "";
  const titleMd = link
    ? `[${escapeMd(o.title)}](${link})`
    : escapeMd(o.title);
  const meta: string[] = [escapeMd(o.organization), `${score}/100`];
  if (o.deadline) {
    meta.push(`Due ${format(parseISO(o.deadline), "MMM d")}`);
  }
  return `• ${titleMd} — ${meta.join(" · ")}`;
}

/** Telegram Markdown is finicky; escape the characters that have meaning. */
function escapeMd(s: string): string {
  return s.replace(/([_*\[\]()`])/g, "\\$1");
}
