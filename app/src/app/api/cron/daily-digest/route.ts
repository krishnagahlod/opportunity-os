import { NextResponse, type NextRequest } from "next/server";
import { requireCronAuth } from "@/lib/auth/cron";
import {
  buildDigestForUser,
  getDigestRecipients,
} from "@/lib/notifications/digest";
import { sendEmail } from "@/lib/email/send";
import { DigestEmail } from "@/lib/email/digest";
import {
  renderDigestForTelegram,
  sendTelegramMessage,
} from "@/lib/telegram/send";

export const runtime = "nodejs";
export const maxDuration = 60;

/*
 * Daily digest cron.
 *
 * Triggered by:
 *   - Vercel Cron (configured in vercel.json) at 02:30 UTC = 08:00 IST
 *   - Manually via curl: `curl -H "Authorization: Bearer $CRON_SECRET" \
 *       http://localhost:3000/api/cron/daily-digest`
 *
 * For each onboarded user:
 *   1. Build their digest (top 5 scored ≥40 + items closing in 3 days).
 *   2. Send email via Resend.
 *   3. If TELEGRAM_DEFAULT_CHAT_ID is set, also push to Telegram.
 *      (Multi-user Telegram comes when we add a Settings page that lets
 *       each user link their own chat_id to profile.telegram_chat_id.)
 *
 * Best-effort delivery: failures on one user don't stop the rest.
 */

export async function GET(req: NextRequest) {
  const unauthorized = requireCronAuth(req);
  if (unauthorized) return unauthorized;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const telegramChatId = process.env.TELEGRAM_DEFAULT_CHAT_ID ?? null;

  const recipients = await getDigestRecipients();
  const results: Array<{
    user: string;
    email?: string;
    telegram?: string;
    skipped?: string;
  }> = [];

  for (const user of recipients) {
    try {
      const digest = await buildDigestForUser(user);
      if (!digest) {
        results.push({ user: user.id, skipped: "no qualifying opportunities" });
        continue;
      }

      const firstName =
        (user.full_name ?? "").split(" ")[0] || "there";

      // --- Email ---
      let emailResult = "skipped: no email on profile";
      if (user.email) {
        const subject = buildSubject(digest.topPicks.length, digest.closingSoon.length);
        const send = await sendEmail({
          to: user.email,
          subject,
          react: DigestEmail({
            firstName,
            topPicks: digest.topPicks,
            closingSoon: digest.closingSoon,
            appUrl,
          }),
        });
        emailResult = send.ok ? `sent (${send.id})` : `failed: ${send.error}`;
      }

      // --- Telegram (single configured chat for now) ---
      let telegramResult = "skipped: no chat_id";
      const chatId = user.telegram_chat_id ?? telegramChatId;
      if (chatId) {
        const text = renderDigestForTelegram({
          firstName,
          topPicks: digest.topPicks,
          closingSoon: digest.closingSoon,
          appUrl,
        });
        const send = await sendTelegramMessage(chatId, text);
        telegramResult = send.ok ? "sent" : `failed: ${send.error}`;
      }

      results.push({
        user: user.id,
        email: emailResult,
        telegram: telegramResult,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      results.push({ user: user.id, skipped: `error: ${message}` });
    }
  }

  return NextResponse.json({
    ok: true,
    recipients: recipients.length,
    results,
    generated_at: new Date().toISOString(),
  });
}

/** Lets us trigger the same flow with POST too (some cron services prefer POST). */
export const POST = GET;

function buildSubject(topCount: number, closingCount: number): string {
  if (closingCount > 0 && topCount > 0) {
    return `${closingCount} closing soon · ${topCount} top picks`;
  }
  if (closingCount > 0) {
    return `${closingCount} opportunit${closingCount === 1 ? "y" : "ies"} closing soon`;
  }
  return `${topCount} new top pick${topCount === 1 ? "" : "s"} for you`;
}
