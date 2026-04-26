"use client";

import { useState, useTransition } from "react";
import { Calendar, CalendarPlus, Check, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ensureCalendarToken, rotateCalendarToken } from "./actions";

/**
 * Calendar subscription block on /settings.
 *
 * The token IS the credential — users paste the URL into Google Calendar /
 * Apple Calendar / Outlook, and those apps poll it. Rotation invalidates the
 * old URL and any subscribed clients silently stop syncing — they'll need the
 * new URL.
 *
 * Until the user clicks "Generate URL" no row in `profiles.calendar_token`
 * exists, so the feed cannot be hit at all. This is opt-in by design.
 */
export function CalendarSection({
  initialToken,
  appUrl,
}: {
  initialToken: string | null;
  appUrl: string;
}) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const subscriptionUrl = token ? `${appUrl}/api/calendar.ics?token=${token}` : "";
  // webcal:// is the universal "subscribe to a calendar" scheme — Apple
  // Calendar handles it natively, and Google offers the same flow if you
  // strip the protocol.
  const webcalUrl = subscriptionUrl.replace(/^https?:\/\//, "webcal://");
  const googleAddUrl = subscriptionUrl
    ? `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(webcalUrl)}`
    : "";

  function generate() {
    setError(null);
    startTransition(async () => {
      const res = await ensureCalendarToken();
      if ("error" in res) setError(res.error);
      else setToken(res.token);
    });
  }

  function rotate() {
    if (
      !confirm(
        "Rotate URL? The old subscription will stop syncing in your calendar app. You'll need to paste the new URL there.",
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await rotateCalendarToken();
      if ("error" in res) setError(res.error);
      else {
        setToken(res.token);
        setCopied(false);
      }
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(subscriptionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Couldn't copy to clipboard. Long-press or right-click to copy manually.");
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Calendar sync</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Subscribe your calendar app to your saved + applied opportunity
          deadlines. Reminders pop up 7 days and 1 day before each deadline.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        {token === null ? (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Calendar className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">No subscription URL yet</p>
                <p className="text-xs text-muted-foreground">
                  Generate a private URL to plug into Google / Apple / Outlook.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={generate}
              disabled={isPending}
              className="gap-1.5"
            >
              <CalendarPlus className="size-3.5" />
              {isPending ? "Generating..." : "Generate URL"}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <label
                htmlFor="calendar-url"
                className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground"
              >
                Your private subscription URL
              </label>
              <div className="flex gap-2">
                <Input
                  id="calendar-url"
                  value={subscriptionUrl}
                  readOnly
                  onFocus={(e) => e.currentTarget.select()}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copy}
                  className="shrink-0 gap-1.5"
                  aria-label="Copy URL"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Anyone with this URL can read your deadlines (no profile data).
                If it leaks, rotate it.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
              <a
                href={googleAddUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition hover:bg-foreground/85"
              >
                <CalendarPlus className="size-3.5" />
                Add to Google Calendar
              </a>
              <a
                href={webcalUrl}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
                title="Apple Calendar / Outlook handle webcal:// natively"
              >
                <Calendar className="size-3.5" />
                Subscribe (Apple / Outlook)
              </a>
              <a
                href={subscriptionUrl}
                download="opportunity-os.ics"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
              >
                Download once (.ics)
              </a>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={rotate}
                disabled={isPending}
                className="ml-auto gap-1.5 text-muted-foreground"
              >
                <RefreshCw className="size-3.5" />
                {isPending ? "Rotating..." : "Rotate URL"}
              </Button>
            </div>

            <details className="text-[11.5px] text-muted-foreground">
              <summary className="cursor-pointer select-none font-medium">
                How subscription works
              </summary>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 leading-relaxed">
                <li>
                  Click <strong>Add to Google Calendar</strong> (or paste the
                  URL into Apple/Outlook&apos;s &ldquo;Subscribe&rdquo; flow).
                </li>
                <li>
                  Your calendar app polls the URL every few hours. New saves
                  and applications appear automatically.
                </li>
                <li>
                  Each event has alerts at <strong>7 days</strong> and{" "}
                  <strong>1 day</strong> before the deadline.
                </li>
                <li>
                  Tap an event to jump straight to the apply URL.
                </li>
              </ol>
            </details>
          </>
        )}

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
