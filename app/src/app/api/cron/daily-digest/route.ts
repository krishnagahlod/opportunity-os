import { NextResponse, type NextRequest } from "next/server";
import { requireCronAuth } from "@/lib/auth/cron";
import {
  buildDigestForUser,
  filterDigestForTelegram,
  getDigestRecipients,
  markExpiredOpportunities,
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
 *   3. If user.telegram_chat_id is set, push the digest to that chat.
 *      (Each user controls their own; no env-level default — that previously
 *       caused other users' digests to leak into the developer's chat.)
 *
 * Best-effort delivery: failures on one user don't stop the rest.
 */

export async function GET(req: NextRequest) {
  const unauthorized = requireCronAuth(req);
  if (unauthorized) return unauthorized;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Sweep expired opportunities first so today's digest doesn't surface
  // anything whose deadline already passed.
  const expired = await markExpiredOpportunities();

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
        const subject = buildSubject(
          digest.topPicks.length,
          digest.closingSoon.length,
          digest.myDeadlines.length,
          digest.weekRecap !== null,
        );
        const send = await sendEmail({
          to: user.email,
          subject,
          react: DigestEmail({
            firstName,
            myDeadlines: digest.myDeadlines,
            topPicks: digest.topPicks,
            closingSoon: digest.closingSoon,
            weekRecap: digest.weekRecap,
            appUrl,
          }),
        });
        emailResult = send.ok ? `sent (${send.id})` : `failed: ${send.error}`;
      }

      // --- Telegram (per-user; no env fallback) ---
      // Apply the user's min-score floor before rendering. Email render
      // above keeps the full payload — different signal/noise economics.
      let telegramResult = "skipped: no chat_id";
      const chatId = user.telegram_chat_id;
      if (chatId) {
        const minScore = user.telegram_min_score ?? 70;
        const filtered = filterDigestForTelegram(digest, minScore);
        if (!filtered) {
          telegramResult = `skipped: nothing scored ≥ ${minScore}`;
        } else {
          const text = renderDigestForTelegram({
            firstName,
            myDeadlines: filtered.myDeadlines,
            topPicks: filtered.topPicks,
            closingSoon: filtered.closingSoon,
            weekRecap: filtered.weekRecap,
            appUrl,
          });
          const send = await sendTelegramMessage(chatId, text);
          telegramResult = send.ok ? "sent" : `failed: ${send.error}`;
        }
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
    expired_swept: expired.count,
    recipients: recipients.length,
    results,
    generated_at: new Date().toISOString(),
  });
}

/** Lets us trigger the same flow with POST too (some cron services prefer POST). */
export const POST = GET;

function buildSubject(
  topCount: number,
  closingCount: number,
  myDeadlineCount: number,
  hasWeekRecap: boolean,
): string {
  // Prioritise the user's own deadlines — that's the most actionable signal.
  if (myDeadlineCount > 0) {
    const noun = myDeadlineCount === 1 ? "saved opportunity" : "saved opportunities";
    return `🚨 ${myDeadlineCount} ${noun} closing in 48h`;
  }
  // Sunday week recap takes the next priority slot — gives users a reason
  // to open the message even when there's no urgent action.
  if (hasWeekRecap) {
    return `📅 Your week + ${topCount} top pick${topCount === 1 ? "" : "s"}`;
  }
  if (closingCount > 0 && topCount > 0) {
    return `${closingCount} closing soon · ${topCount} top picks`;
  }
  if (closingCount > 0) {
    return `${closingCount} opportunit${closingCount === 1 ? "y" : "ies"} closing soon`;
  }
  return `${topCount} new top pick${topCount === 1 ? "" : "s"} for you`;
}
