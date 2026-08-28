import "server-only";
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

/**
 * Sanitizes strings by redacting emails, tokens, and authorization headers.
 */
export function sanitizeLogMessage(input: string): string {
  if (!input) return "";
  return input
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]")
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[REDACTED_JWT]")
    .replace(/(?:key|token|secret|bearer)\s*[:=]\s*[^\s,]+/gi, "[REDACTED_SECRET]");
}

/**
 * Safe API error responder:
 * - Generates a unique correlation ID
 * - Logs the detailed, sanitized error server-side
 * - Returns a generic, safe error message to the client (no stack traces, no internal database schema)
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  const correlationId = `err_${randomBytes(6).toString("hex")}`;
  const rawMessage = error instanceof Error ? error.stack || error.message : String(error);
  const sanitized = sanitizeLogMessage(rawMessage);

  console.error(`[${context}] [${correlationId}]`, sanitized);

  const isDev = process.env.NODE_ENV === "development";

  return NextResponse.json(
    {
      error: isDev
        ? (error instanceof Error ? error.message : "Internal Server Error")
        : "An unexpected error occurred. Please contact support with the reference ID.",
      referenceId: correlationId,
    },
    { status: 500 }
  );
}
