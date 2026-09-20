import Link from "next/link";
import { ArrowLeft, ShieldCheck, RefreshCw, Clock, Mail, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Refund & Cancellation Policy | Opportunity OS",
  description: "Terms and procedures regarding cancellations and refunds for Opportunity OS career passes.",
};

export default function RefundPage() {
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
            <span>Dodo Payments & Statutory Compliant</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-mono font-semibold text-primary">
            <RefreshCw className="size-3 animate-spin" />
            <span>Consumer Protection & Billing Policy</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Refund & Cancellation Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated & effective: September 2026 · Governed under Indian Consumer Protection E-Commerce Rules & Global Merchant Standards
          </p>
        </div>

        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground/90 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              1. Nature of Digital Career Passes
            </h2>
            <p>
              Opportunity OS provides non-tangible, irrevocable digital software access and compute credits ("Career Passes") designed for career intelligence, resume-fit scoring, 50+ network job aggregation, and verified recruiter radar.
            </p>
            <p>
              Access passes (e.g., 30-Day Pro Pass, 90-Day Quarter Pass, 365-Day Annual Pass) are <strong>one-time purchases</strong> that do not auto-renew or silently charge your payment method. You retain complete control over when and how you renew your access.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              2. 7-Day Refund Window (Unused Passes)
            </h2>
            <p>
              We want you to be completely confident in Opportunity OS. If you purchase a Career Pass and find that it does not fit your workflow, you are eligible for a <strong>100% full refund within 7 calendar days of purchase</strong>, provided:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>You have not consumed automated AI cold outreach generation credits.</li>
              <li>You have initiated fewer than 3 deep resume scoring evaluations.</li>
              <li>You submit your refund request within 7 calendar days of the original transaction timestamp.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              3. Non-Refundable Circumstances
            </h2>
            <p>
              Due to the immediate compute costs incurred when communicating with upstream AI models (Google Gemini, Groq) and specialized contact verification APIs, refunds cannot be granted in the following scenarios:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Passes where the 7-day request window has elapsed.</li>
              <li>Accounts where AI cold outreach generation credits or recruiter radar leads have been actively utilized.</li>
              <li>Accounts suspended or terminated due to violations of our <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> (such as automated scraping, reverse engineering, or account sharing).</li>
              <li>Subjective career outcomes (e.g., failure to receive an interview offer or job offer from third-party employers).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              4. Technical Delivery Failure & Double Charges
            </h2>
            <p>
              In the rare event of a payment deduction where access is not automatically activated within 30 minutes due to payment gateway webhook delay or network failure, or in the case of an accidental duplicate charge:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Our automated reconciliation will attempt to activate your entitlement instantly upon webhook settlement.</li>
              <li>If your account remains un-provisioned, we will immediately grant your entitlement or issue an automatic 100% refund without requiring you to jump through administrative hoops.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              5. Refund Request Process & Turnaround Time
            </h2>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-foreground">
                <Clock className="size-4 text-primary" />
                <span>Processing SLA: 5–7 Business Days</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                To request a refund, email our support team directly from the email address associated with your Opportunity OS account:
              </p>
              <div className="pt-2">
                <a
                  href="mailto:krishnagahlod@gmail.com?subject=Refund%20Request%20-%20Opportunity%20OS"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
                >
                  <Mail className="size-3.5" />
                  Email Support: krishnagahlod@gmail.com
                </a>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">
                Please include your registered email address and Dodo Payments Order ID (e.g., <code className="font-mono text-foreground">dodo_pay_...</code>). Once approved, refunds are credited back to the original source (UPI, Credit/Debit Card, Net Banking) within 5–7 business days.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              6. Cancellation of Passes
            </h2>
            <p>
              Because Opportunity OS career passes are pre-paid fixed duration passes (e.g. 30, 90, or 365 days) and <strong>not recurring subscriptions</strong>, there is no recurring billing to cancel. Your pass simply expires automatically at the end of the duration unless you choose to purchase another pass.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
