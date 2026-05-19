import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripHtml } from "@/lib/utils";
import type { Opportunity } from "@/types/db";

export const runtime = "nodejs";

/*
 * Subscribable iCalendar feed for a single user's saved + applied opportunity
 * deadlines. The user opts in from /settings, which generates a per-user UUID
 * token; this route is authenticated solely by that token (no cookies).
 *
 * Why per-token (not cookie auth):
 *   Calendar apps (Google, Apple, Outlook) poll the URL directly without
 *   a browser session. Using a token query param mirrors how every other
 *   private calendar feed on the internet works.
 *
 * What's included:
 *   - All saved opportunities with a future deadline.
 *   - All applications in `saved | applied | interviewing` status with a
 *     future deadline. (`won` and `rejected` are excluded — deadline no
 *     longer actionable.)
 *   - Deduped by opportunity_id when the user has both saved + applied.
 *
 * What's excluded:
 *   - Opportunities without a deadline (no calendar value).
 *   - Past deadlines.
 *   - Spam / expired opportunities.
 *
 * Each VEVENT carries:
 *   - All-day event on the deadline date (timezone-agnostic — closest match
 *     to how most opportunity sources actually mean "deadline").
 *   - VALARM 1 day before (always) and 7 days before (when far enough out).
 *   - URL property pointing at apply_url so calendar apps can deep-link.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CalendarItem = {
  opportunity: Opportunity;
  isSaved: boolean;
  applicationStatus: "saved" | "applied" | "interviewing" | null;
};

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";

  if (!UUID_RE.test(token)) {
    return new Response(
      "Invalid or missing token. Visit /settings to get your subscription URL.",
      { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const supabase = createAdminClient();

  // 1) Resolve token → user (admin client bypasses RLS, which is what we want
  //    here: the token IS the credential).
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("calendar_token", token)
    .maybeSingle();

  if (!profile) {
    return new Response(
      "Token not recognised. Rotate it in /settings and update your subscription.",
      { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const userId = profile.id as string;
  const nowIso = new Date().toISOString();

  // 2) Pull saved + applied items in parallel. We fetch IDs first, then a
  //    single opportunities query, so we don't have to merge two embedded
  //    payloads from PostgREST.
  const [savedRes, appsRes] = await Promise.all([
    supabase
      .from("saved_opportunities")
      .select("opportunity_id")
      .eq("user_id", userId),
    supabase
      .from("applications")
      .select("opportunity_id, status")
      .eq("user_id", userId)
      .in("status", ["saved", "applied", "interviewing"]),
  ]);

  const savedIds = new Set(
    (savedRes.data ?? []).map((r) => r.opportunity_id as string),
  );
  const appStatusById = new Map<string, "saved" | "applied" | "interviewing">();
  for (const r of appsRes.data ?? []) {
    appStatusById.set(
      r.opportunity_id as string,
      r.status as "saved" | "applied" | "interviewing",
    );
  }

  const oppIds = Array.from(new Set([...savedIds, ...appStatusById.keys()]));

  if (oppIds.length === 0) {
    return calendarResponse(
      buildEmptyCalendar(profile.full_name as string | null),
    );
  }

  const { data: opps } = await supabase
    .from("opportunities")
    .select(
      "id,title,organization,category,summary,deadline,location,is_remote,apply_url,status",
    )
    .in("id", oppIds)
    .not("deadline", "is", null)
    .gte("deadline", nowIso)
    // Only active opps end up in the calendar feed. Phase 12 — previously
    // only `spam` was excluded; `expired` and `pending` could slip through
    // if their deadline somehow was future-looking.
    .eq("status", "active");

  const items: CalendarItem[] = ((opps ?? []) as Opportunity[]).map((o) => ({
    opportunity: o,
    isSaved: savedIds.has(o.id),
    applicationStatus: appStatusById.get(o.id) ?? null,
  }));

  return calendarResponse(
    buildCalendar(items, profile.full_name as string | null),
  );
}

/* ============================================================================
 * ICS construction
 * ========================================================================== */

function calendarResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      // Calendar clients re-poll on their own schedule (typically every few
      // hours). 30 min cache absorbs duplicate polls without serving stale
      // data after a save/apply.
      "Cache-Control": "private, max-age=1800",
      "Content-Disposition": 'inline; filename="opportunity-os.ics"',
    },
  });
}

function buildEmptyCalendar(name: string | null): string {
  return assembleCalendar(name, []);
}

function buildCalendar(items: CalendarItem[], name: string | null): string {
  const dtstamp = formatUtcStamp(new Date());
  const events: string[] = [];

  for (const item of items) {
    const o = item.opportunity;
    if (!o.deadline) continue;

    const deadlineDate = new Date(o.deadline);
    if (Number.isNaN(deadlineDate.getTime())) continue;

    const summary = buildSummary(item);
    const description = buildDescription(item);
    const dateStr = formatDate(deadlineDate);
    const dateNextStr = formatDate(addDays(deadlineDate, 1));

    const lines: string[] = [
      "BEGIN:VEVENT",
      `UID:${o.id}@opportunity-os`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${dateNextStr}`,
      `SUMMARY:${escapeText(summary)}`,
      `DESCRIPTION:${escapeText(description)}`,
    ];

    const location = o.is_remote ? "Remote" : o.location;
    if (location) lines.push(`LOCATION:${escapeText(location)}`);
    if (o.apply_url) lines.push(`URL:${escapeText(o.apply_url)}`);

    lines.push("STATUS:CONFIRMED", "TRANSP:TRANSPARENT");

    // Reminders: 1 day before always; 7 days before only if there's room.
    const msUntil = deadlineDate.getTime() - Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (msUntil > oneDayMs) {
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeText(`Deadline tomorrow: ${o.title}`)}`,
        "TRIGGER:-P1D",
        "END:VALARM",
      );
    }
    if (msUntil > 7 * oneDayMs) {
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeText(`Deadline in 1 week: ${o.title}`)}`,
        "TRIGGER:-P7D",
        "END:VALARM",
      );
    }

    lines.push("END:VEVENT");
    events.push(lines.join("\r\n"));
  }

  return assembleCalendar(name, events);
}

function assembleCalendar(name: string | null, events: string[]): string {
  const calName = name
    ? `Opportunity OS — ${name}`
    : "Opportunity OS deadlines";
  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Opportunity OS//Calendar feed//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calName)}`,
    "X-WR-CALDESC:Saved + applied opportunity deadlines from Opportunity OS",
    "X-PUBLISHED-TTL:PT2H",
    "REFRESH-INTERVAL;VALUE=DURATION:PT2H",
  ].join("\r\n");

  const body = events.join("\r\n");
  const footer = "END:VCALENDAR";

  // Fold every line per RFC 5545 (max 75 octets) — keeps strict parsers happy.
  const raw = body
    ? `${header}\r\n${body}\r\n${footer}\r\n`
    : `${header}\r\n${footer}\r\n`;
  return foldLines(raw);
}

function buildSummary(item: CalendarItem): string {
  const o = item.opportunity;
  const status = item.applicationStatus;
  const tag = status === "interviewing" ? " · Interviewing"
    : status === "applied" ? " · Applied"
    : item.isSaved ? "" /* default save state has no tag */
    : "";
  return `${o.title} — ${o.organization}${tag}`;
}

function buildDescription(item: CalendarItem): string {
  const o = item.opportunity;
  const lines: string[] = [];

  const summary = stripHtml(o.summary);
  if (summary) lines.push(summary);

  const tagBits: string[] = [];
  if (item.isSaved) tagBits.push("Saved");
  if (item.applicationStatus) {
    const label =
      item.applicationStatus === "saved"
        ? "Tracker: Saved"
        : item.applicationStatus === "applied"
          ? "Applied"
          : "Interviewing";
    tagBits.push(label);
  }
  if (tagBits.length > 0) lines.push(tagBits.join(" · "));

  if (o.apply_url) lines.push(`Apply: ${o.apply_url}`);

  return lines.join("\n\n");
}

/* ============================================================================
 * RFC 5545 helpers
 * ========================================================================== */

/** Escape characters that have special meaning inside a TEXT property value. */
function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n/g, "\\n")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\n");
}

function formatDate(d: Date): string {
  const y = d.getUTCFullYear().toString().padStart(4, "0");
  const m = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  return `${y}${m}${day}`;
}

function formatUtcStamp(d: Date): string {
  const y = d.getUTCFullYear().toString().padStart(4, "0");
  const mo = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const da = d.getUTCDate().toString().padStart(2, "0");
  const h = d.getUTCHours().toString().padStart(2, "0");
  const mi = d.getUTCMinutes().toString().padStart(2, "0");
  const s = d.getUTCSeconds().toString().padStart(2, "0");
  return `${y}${mo}${da}T${h}${mi}${s}Z`;
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + n);
  return next;
}

/** RFC 5545 §3.1: lines must not exceed 75 octets; fold with CRLF + space. */
function foldLines(raw: string): string {
  const out: string[] = [];
  for (const line of raw.split("\r\n")) {
    if (Buffer.byteLength(line, "utf8") <= 75) {
      out.push(line);
      continue;
    }
    // Walk the string codepoint-by-codepoint, accumulating bytes.
    let buf = "";
    let bufBytes = 0;
    let isFirstChunk = true;
    for (const ch of line) {
      const chBytes = Buffer.byteLength(ch, "utf8");
      const limit = isFirstChunk ? 75 : 74; // continuation lines start with " "
      if (bufBytes + chBytes > limit) {
        out.push(isFirstChunk ? buf : ` ${buf}`);
        buf = ch;
        bufBytes = chBytes;
        isFirstChunk = false;
      } else {
        buf += ch;
        bufBytes += chBytes;
      }
    }
    if (buf) out.push(isFirstChunk ? buf : ` ${buf}`);
  }
  return out.join("\r\n");
}
