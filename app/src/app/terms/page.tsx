import Link from "next/link";
import { ArrowLeft, ShieldCheck, FileText, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Opportunity OS",
  description: "Terms and conditions governing access and use of the Opportunity OS career intelligence platform.",
};

export default function TermsPage() {
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
            <span>Legally Binding Agreement</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-mono font-semibold text-primary">
            <FileText className="size-3" />
            <span>Platform User Agreement</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated & effective: September 2026 · Governed under the laws of the Republic of India (Mumbai, Maharashtra Jurisdiction)
          </p>
        </div>

        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground/90 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, registering for, or purchasing access on Opportunity OS (the "Platform"), operated by Krishna Gahlod ("we", "us", or "Operator"), you agree to be bound by these Terms of Service and our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. If you do not agree to these terms, you must discontinue use immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              2. Eligibility & Age Declaration (DPDPA 2023 Section 9)
            </h2>
            <p>
              You affirm that you are at least <strong>18 years of age</strong> and possess the legal capacity to enter into these terms. If you are under 18, you may only access the platform under the active supervision of a parent or legal guardian who agrees to be bound by these Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              3. Description of Platform & Opportunity Aggregation
            </h2>
            <p>
              Opportunity OS provides an algorithmic discovery engine that continuously aggregates public job listings, internships, fellowships, hackathons, and case competitions across 50+ third-party career portals and Applicant Tracking Systems (ATS) including Greenhouse, Lever, Ashby, Hacker News, Y Combinator, Devpost, and Unstop.
            </p>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2 text-amber-950 dark:text-amber-200">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-4" />
                <span>Crucial Placement & Outcome Disclaimer</span>
              </div>
              <p className="text-xs leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                Opportunity OS is an <strong>independent intelligence discovery tool</strong>. We do not act as an employer, recruiter, or placement agency. We do <strong>not guarantee</strong> that you will receive job interviews, employer replies, offers of employment, or specific compensation packages. Application shortlisting decisions are made solely at the discretion of external hiring companies.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              4. Nominative Fair Use & Trademark Disclaimer
            </h2>
            <p>
              All corporate names, brand names, product titles, logos, and registered trademarks displayed on Opportunity OS (including, but not limited to, Google, Microsoft, Meta, Apple, McKinsey, BCG, Greenhouse, Lever, Ashby, Y Combinator, Devpost, and Unstop) are the property of their respective trademark holders.
            </p>
            <p>
              Reference to these entities on Opportunity OS is conducted strictly under the doctrine of <strong>Nominative Fair Use</strong> for descriptive, educational, and job identification purposes only. Opportunity OS is an independent software application and is <strong>not endorsed by, sponsored by, or officially affiliated with</strong> any cited employer or campus Training & Placement (T&P) cell.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              5. Permitted & Prohibited Conduct
            </h2>
            <p>You agree to use Opportunity OS solely for your personal career discovery. You agree NOT to:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Deploy automated bots, spiders, scrapers, or crawlers to extract opportunity listings or platform proprietary scoring data.</li>
              <li>Attempt to reverse-engineer, decompile, or copy platform scoring rubrics or AI prompting architecture.</li>
              <li>Share account credentials or session tokens with third parties; each Career Pass is single-user and strictly capped at 3 active devices.</li>
              <li>Abuse our AI cold outreach generation service to send unsolicited bulk spam messages to hiring managers.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              6. Career Passes, Billing & Cancellations
            </h2>
            <p>
              All fees for Opportunity OS passes (e.g. 30-Day Pro Pass, 90-Day Quarter Pass, 365-Day Annual Pass) are billed as one-time charges in Indian Rupees (INR) via our PCI-DSS compliant payment partner, Dodo Payments.
            </p>
            <p>
              Refund requests and cancellation policies are strictly governed by our dedicated <Link href="/refund" className="text-primary hover:underline">Refund & Cancellation Policy</Link>, which includes a 7-day refund window for unconsumed passes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              7. Limitation of Liability & Dispute Jurisdiction
            </h2>
            <p>
              To the fullest extent permitted by applicable law, Opportunity OS and its operator shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from your use of the platform or external application outcomes.
            </p>
            <p>
              These Terms shall be governed by and construed in accordance with the substantive laws of the Republic of India. Any legal dispute, claim, or proceeding arising under these Terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>Mumbai, Maharashtra, India</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              8. Contact
            </h2>
            <p>
              For questions regarding these Terms, contact our administration at <a href="mailto:krishnagahlod@gmail.com" className="text-primary hover:underline">krishnagahlod@gmail.com</a> or visit our <Link href="/contact" className="text-primary hover:underline">Contact & Grievance Redressal</Link> page.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
