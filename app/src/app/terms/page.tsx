export const metadata = {
  title: "Terms of Service | Opportunity OS",
  description: "Terms and conditions for using our platform.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: June 2026
      </p>

      <div className="prose prose-sm prose-neutral dark:prose-invert mt-10 max-w-none">
        <h3>1. Acceptance of Terms</h3>
        <p>
          By accessing and using Opportunity OS, you agree to be bound by these
          Terms of Service. If you do not agree to these terms, please do not
          use the platform.
        </p>

        <h3>2. Description of Service</h3>
        <p>
          Opportunity OS is an aggregator and matching engine that uses
          artificial intelligence to score job opportunities, internships, and
          other programs against your provided resume and preferences.
        </p>

        <h3>3. User Responsibilities</h3>
        <p>
          You agree to provide accurate and current information (including your
          resume). You are responsible for maintaining the security of your
          account.
        </p>

        <h3>4. No Guarantee of Accuracy</h3>
        <p>
          While we strive to provide accurate opportunity matches, the AI-driven
          scoring and extraction process is probabilistic. We do not guarantee
          the accuracy, completeness, or availability of any opportunity listed
          on our platform. You should always verify the details on the original
          source website before applying.
        </p>

        <h3>5. Termination</h3>
        <p>
          We reserve the right to terminate or suspend your access to the
          service at our sole discretion, without prior notice, for conduct that
          we believe violates these Terms or is harmful to other users, us, or
          third parties.
        </p>
      </div>
    </main>
  );
}
