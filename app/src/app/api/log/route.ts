import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireIngestAuth } from "@/lib/auth/ingest";
import { logIngestion } from "@/lib/ingestion/logs";

export const runtime = "nodejs";

/*
 * Public-ish (auth-gated) ingestion log writer for n8n's
 * Filter and Check-Exists branches. Server-internal code uses
 * `logIngestion()` directly; this route exposes the same to n8n.
 */

const RequestSchema = z.object({
  status: z.enum([
    "extracted",
    "upserted",
    "skipped_duplicate",
    "skipped_filtered",
    "failed",
  ]),
  source_url: z.string().max(2000).optional().nullable(),
  source_name: z.string().max(100).optional().nullable(),
  source_id: z.string().uuid().optional().nullable(),
  reason: z.string().max(1000).optional().nullable(),
  provider: z.enum(["gemini", "groq"]).optional().nullable(),
  tokens_used: z.number().int().nonnegative().optional().nullable(),
  duration_ms: z.number().int().nonnegative().optional().nullable(),
  opportunity_id: z.string().uuid().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const unauthorized = requireIngestAuth(req);
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bad request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  await logIngestion(parsed.data);
  return NextResponse.json({ ok: true });
}
