import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { callLLM } from "@/lib/ai/fallover";
import {
  ExtractedOpportunitySchema,
  EXTRACT_SYSTEM_INSTRUCTION,
  buildExtractPrompt,
} from "@/lib/ai/prompts";
import { requireIngestAuth } from "@/lib/auth/ingest";
import { estimateTokens, logIngestion } from "@/lib/ingestion/logs";

export const runtime = "nodejs";
export const maxDuration = 30;

const RequestSchema = z.object({
  text: z.string().min(20).max(20000),
  source_url: z.string().url().optional(),
  source_name: z.string().max(100).optional(),
  hint: z.string().max(400).optional(),
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
    console.error(
      "[/api/ai/extract] body rejected by zod. Body:",
      JSON.stringify(body),
      "Issues:",
      JSON.stringify(parsed.error.issues),
    );
    return NextResponse.json(
      { error: "Bad request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { text, source_url, source_name, hint } = parsed.data;
  const start = Date.now();

  try {
    const result = await callLLM({
      prompt: buildExtractPrompt({ rawText: text, sourceUrl: source_url, hint }),
      schema: ExtractedOpportunitySchema,
      systemInstruction: EXTRACT_SYSTEM_INSTRUCTION,
      maxTokens: 2000,
      groqModel: "gpt-oss-120b",
    });

    void logIngestion({
      status: "extracted",
      source_url: source_url ?? null,
      source_name: source_name ?? null,
      provider: result.provider,
      tokens_used: estimateTokens(result.raw),
      duration_ms: Date.now() - start,
    });

    return NextResponse.json({
      opportunity: result.data,
      provider: result.provider,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[/api/ai/extract] AI call failed:", message);
    void logIngestion({
      status: "failed",
      source_url: source_url ?? null,
      source_name: source_name ?? null,
      reason: message.slice(0, 1000),
      duration_ms: Date.now() - start,
    });
    return NextResponse.json(
      { error: "Extraction failed", detail: message },
      { status: 502 },
    );
  }
}
