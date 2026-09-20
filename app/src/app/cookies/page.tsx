import Link from "next/link";
import { ArrowLeft, Cookie, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Cookie Policy | Opportunity OS",
  description: "Explanation of cookies, local storage, and telemetry used by Opportunity OS.",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to Opportunity OS
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <span>DPDPA & GDPR Compliant</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-mono font-semibold text-primary">
            <Cookie className="size-3" />
            <span>Browser Storage & Telemetry Transparency</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Cookie Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated & effective: September 2026 · Governed under India DPDPA 2023 & European GDPR
          </p>
        </div>

        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground/90 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              1. What Are Cookies and Browser Storage?
            </h2>
            <p>
              Cookies and local browser storage (<code className="font-mono text-xs">localStorage</code>) are small text files stored on your computer or mobile device when you access web applications. They allow Opportunity OS to remember your authenticated session, preserve theme settings, and evaluate application performance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              2. Categories of Cookies We Use
            </h2>
            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Strictly Essential Cookies (Always Active)</h3>
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    Mandatory
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  These cookies are technically indispensable for the website to function securely. They manage your encrypted authentication session via Supabase Auth (<code className="font-mono text-xs">sb-access-token</code>, <code className="font-mono text-xs">sb-refresh-token</code>), CSRF protection, and session security hashing. Because the platform cannot operate without these, they do not require consent under DPDPA and GDPR.
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Performance & Telemetry Cookies (Optional)</h3>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-primary">
                    Requires Consent
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  We use privacy-conscious analytics via PostHog to understand which opportunity sources are most popular, detect UI errors, and measure latency across our AI matching pipeline. These telemetry identifiers are pseudonymous. We <strong>never</strong> use advertising trackers or sell browsing data to third-party data brokers.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              3. Summary Table of Cookies & Storage
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-border/60 rounded-lg">
                <thead className="bg-muted/50 font-mono text-[11px] text-foreground">
                  <tr>
                    <th className="p-2.5 border-b border-border/60">Key / Cookie Name</th>
                    <th className="p-2.5 border-b border-border/60">Provider</th>
                    <th className="p-2.5 border-b border-border/60">Purpose</th>
                    <th className="p-2.5 border-b border-border/60">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-muted-foreground font-sans">
                  <tr>
                    <td className="p-2.5 font-mono text-foreground font-medium">sb-*-auth-token</td>
                    <td className="p-2.5">Supabase</td>
                    <td className="p-2.5">User authentication & security</td>
                    <td className="p-2.5">Session / 1 Year</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono text-foreground font-medium">opportunity_cookie_consent</td>
                    <td className="p-2.5">Opportunity OS</td>
                    <td className="p-2.5">Stores cookie consent state</td>
                    <td className="p-2.5">Permanent (localStorage)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono text-foreground font-medium">ph_*_posthog</td>
                    <td className="p-2.5">PostHog</td>
                    <td className="p-2.5">Anonymous telemetry & performance</td>
                    <td className="p-2.5">1 Year (if opted in)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              4. How to Manage and Revoke Consent
            </h2>
            <p>
              You can adjust or revoke your cookie choices at any time via the Cookie Preferences banner or by resetting your browser cookies. Most modern browsers (Chrome, Safari, Firefox, Edge) also allow you to block all cookies or notify you when a cookie is set via their privacy preferences.
            </p>
            <p>
              For further inquiries regarding our data handling, refer to our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> or contact our Grievance Redressal Officer at <a href="mailto:krishnagahlod@gmail.com" className="text-primary hover:underline">krishnagahlod@gmail.com</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
