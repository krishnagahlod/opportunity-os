import "server-only";

/**
 * Server-only environment validator.
 * Validates that required environment variables are present and correctly formatted,
 * and ensures that sensitive secrets are never leaked to client bundles.
 */

interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

const REQUIRED_SERVER_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const OPTIONAL_INTEGRATION_VARS = [
  "GEMINI_API_KEY",
  "GROQ_API_KEY",
  "RESEND_API_KEY",
  "CRON_SECRET",
  "INGEST_SHARED_SECRET",
  "DODO_PAYMENTS_API_KEY",
  "DODO_PAYMENTS_WEBHOOK_KEY",
];

export function validateEnvironment(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const varName of REQUIRED_SERVER_VARS) {
    if (!process.env[varName] || process.env[varName]?.trim() === "") {
      missing.push(varName);
    }
  }

  for (const varName of OPTIONAL_INTEGRATION_VARS) {
    if (!process.env[varName] || process.env[varName]?.trim() === "") {
      warnings.push(`Optional variable ${varName} is not set; related features may be disabled.`);
    }
  }

  // Security checks on variable names
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("NEXT_PUBLIC_")) {
      const lower = key.toLowerCase();
      if (
        lower.includes("secret") ||
        lower.includes("service_role") ||
        lower.includes("private") ||
        lower.includes("password") ||
        lower.includes("webhook_key")
      ) {
        throw new Error(
          `SECURITY CRITICAL: Sensitive environment variable '${key}' is exposed to the browser via NEXT_PUBLIC_ prefix!`
        );
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}
