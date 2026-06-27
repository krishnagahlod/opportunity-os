export const metadata = {
  title: "Privacy Policy | Opportunity OS",
  description: "How we handle your data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: June 2026
      </p>

      <div className="prose prose-sm prose-neutral dark:prose-invert mt-10 max-w-none">
        <h3>1. Information We Collect</h3>
        <p>
          We collect information you provide directly to us, including your
          resume (PDF text), professional goals, email address, and any feedback
          you submit regarding opportunity matches.
        </p>

        <h3>2. How We Use Your Information</h3>
        <p>
          Your resume and goals are used solely to evaluate your fit for various
          opportunities using AI matching algorithms. We do not sell your data
          to third parties. Your resume text is stored securely in our database.
        </p>

        <h3>3. Data Sharing</h3>
        <p>
          We share your resume text temporarily with third-party Large Language
          Model (LLM) providers (such as OpenAI or Anthropic) solely for the
          purpose of generating match scores. These providers are explicitly
          configured not to train on your data.
        </p>

        <h3>4. Data Retention</h3>
        <p>
          We retain your profile data as long as your account is active. You may
          request account deletion at any time, which will permanently remove
          your resume and matching history from our servers.
        </p>

        <h3>5. Contact Us</h3>
        <p>
          If you have any questions about this Privacy Policy, please reach out
          to the founder in our community channels.
        </p>
      </div>
    </main>
  );
}
