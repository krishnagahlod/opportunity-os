import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, EyeOff, Server, UserCheck } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Opportunity OS",
  description: "Comprehensive Privacy Policy of Opportunity OS detailing personal data collection, AI non-training guarantees, sub-processors, and statutory rights under India's DPDPA 2023 and GDPR.",
};

export default function PrivacyPage() {
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
            <span>DPDPA 2023 & GDPR Compliant</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-mono font-semibold text-primary">
            <Lock className="size-3" />
            <span>Privacy & Data Protection Notice</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated & effective: September 2026 · Compliant with the Digital Personal Data Protection Act (India DPDPA 2023) and General Data Protection Regulation (GDPR)
          </p>
        </div>

        {/* AI Non-Training Callout Banner */}
        <div className="mb-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-emerald-950 dark:text-emerald-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <EyeOff className="size-4" />
            <span>Binding Guarantee: Zero AI Model Training on Candidate Data</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-emerald-900/90 dark:text-emerald-200/90">
            We hold a strict, legally binding commitment: <strong>Your resume text, career goals, personal identifiers, and application status are NEVER used to train, retrain, fine-tune, or calibrate public AI foundation models</strong> (such as Google Gemini, Groq, Anthropic, or OpenAI). AI processing is strictly ephemeral and confined to your instant match scoring and gap analysis.
          </p>
        </div>

        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground/90 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              1. Information We Collect
            </h2>
            <p>
              Opportunity OS collects personal data strictly to deliver personalized opportunity scoring, deadline reminders, and recruiter intelligence:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li><strong>Account Identifiers:</strong> Email address, name, educational domain (e.g., <code className="font-mono text-xs">@iitb.ac.in</code> verification), and authentication user ID.</li>
              <li><strong>Resume Content:</strong> PDF resumes uploaded to your private storage folder, extracted technical skills, education history, and career goals.</li>
              <li><strong>Application & Workflow Data:</strong> Saved job listings, kanban application statuses (applied, interviewing, offered), notes, and feedback scores.</li>
              <li><strong>Payment Records:</strong> Transaction identifiers, pass tiers (e.g. 30-Day Pro Pass), and payment status via Dodo Payments. We <strong>never</strong> store raw credit card numbers or banking passwords.</li>
              <li><strong>Technical Metadata:</strong> Cryptographic session hashes, browser user agent strings, and anonymized telemetry strictly for device session limits and abuse prevention.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              2. How We Process and Use Your Information
            </h2>
            <p>We process your personal data solely for the following legitimate purposes:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Evaluating candidate-opportunity relevance through deterministic parsing and LLM scoring (0–100 match ratings).</li>
              <li>Generating personalized, actionable gap analysis reports highlighting missing skills for specific roles.</li>
              <li>Delivering deadline digests via opt-in email (Resend) or opt-in Telegram alerts.</li>
              <li>Enforcing career pass entitlements and single-account fair usage quotas.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              3. Authorized Third-Party Sub-Processors
            </h2>
            <p>
              We partner with industry-leading infrastructure providers to deliver our services. All third-party sub-processors are bound by strict data protection agreements:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-border/60 rounded-lg">
                <thead className="bg-muted/50 font-mono text-[11px] text-foreground">
                  <tr>
                    <th className="p-2.5 border-b border-border/60">Sub-Processor</th>
                    <th className="p-2.5 border-b border-border/60">Function</th>
                    <th className="p-2.5 border-b border-border/60">Data Processed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-muted-foreground font-sans">
                  <tr>
                    <td className="p-2.5 font-semibold text-foreground">Supabase Inc.</td>
                    <td className="p-2.5">Database, Authentication & Private File Storage</td>
                    <td className="p-2.5">User profile, encrypted passwords, resume files</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-foreground">Dodo Payments</td>
                    <td className="p-2.5">Payment Processing & Merchant of Record (PCI-DSS)</td>
                    <td className="p-2.5">Payment identifiers, billing email, transaction status</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-foreground">Google Gemini & Groq</td>
                    <td className="p-2.5">AI Inference (Ephemeral Processing Only, No Training)</td>
                    <td className="p-2.5">Resume text snippets & job description matching</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-foreground">Resend Technologies</td>
                    <td className="p-2.5">Transactional Email Delivery</td>
                    <td className="p-2.5">User email address, deadline notification digests</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-foreground">PostHog & Sentry</td>
                    <td className="p-2.5">Product Telemetry & Crash Monitoring</td>
                    <td className="p-2.5">Anonymized page views, error event stack traces</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              4. Statutory Rights under India's DPDPA 2023 & GDPR
            </h2>
            <p>
              As a Data Principal under India's Digital Personal Data Protection Act (DPDPA 2023) and GDPR, you retain statutory rights over your digital personal data:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li>
                <strong>Right to Access & Data Portability (Section 11):</strong> You may obtain a complete, machine-readable export of all your data in JSON format directly from your <Link href="/settings" className="text-primary hover:underline">Settings Dashboard</Link> or via <code className="font-mono text-xs">/api/account/export</code>.
              </li>
              <li>
                <strong>Right to Erasure / "Right to Be Forgotten" (Section 12):</strong> You may trigger complete account and data erasure anytime from your Settings or via <code className="font-mono text-xs">/api/account/delete</code>. This permanently deletes your profile, stored resume files, application history, and session records.
              </li>
              <li>
                <strong>Right to Correction:</strong> You may edit and update your skills, preferences, and personal details anytime via your Settings.
              </li>
              <li>
                <strong>Right to Grievance Redressal (Section 13):</strong> You may register grievances regarding the processing of your personal data with our designated Grievance Redressal Officer.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              5. Protection of Minors (DPDPA 2023 Section 9)
            </h2>
            <p>
              Opportunity OS is strictly intended for individuals who are at least 18 years of age (college students, graduates, and professionals). We do not knowingly track, profile, or collect personal data from minors. If you are under 18, you must not use or register on this platform without verifiable parental consent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
              6. Grievance Redressal Officer (GRO) & Contact
            </h2>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2 text-xs">
              <p className="text-foreground font-semibold">
                Statutory Grievance Redressal Officer (India DPDPA 2023 Section 13):
              </p>
              <p className="text-muted-foreground">
                <strong>Name:</strong> Krishna Gahlod · <strong>Designation:</strong> Founder & Data Grievance Redressal Officer
              </p>
              <p className="text-muted-foreground">
                <strong>Email:</strong> <a href="mailto:krishnagahlod@gmail.com" className="text-primary hover:underline">krishnagahlod@gmail.com</a> · <strong>Location:</strong> Mumbai, Maharashtra, India
              </p>
              <p className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                Statutory Turnaround Timeline: Within 30 calendar days of receipt.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
