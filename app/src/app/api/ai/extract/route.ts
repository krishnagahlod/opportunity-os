import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { callLLM } from "@/lib/ai/fallover";
import {
  ExtractedOpportunitySchema,
  EXTRACT_SYSTEM_INSTRUCTION,
  buildExtractPrompt,
} from "@/lib/ai/prompts";
import { requireIngestAuth } from "@/lib/auth/ingest";

export const runtime = "nodejs";
export const maxDuration = 30;

const RequestSchema = z.object({
  text: z.string().min(20).max(20000),
  source_url: z.string().url().optional(),
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
    return NextResponse.json(
      { error: "Bad request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { text, source_url, hint } = parsed.data;

  try {
    const result = await callLLM({
      prompt: buildExtractPrompt({ rawText: text, sourceUrl: source_url, hint }),
      schema: ExtractedOpportunitySchema,
      systemInstruction: EXTRACT_SYSTEM_INSTRUCTION,
    });

    return NextResponse.json({
      opportunity: result.data,
      provider: result.provider,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Extraction failed", detail: message },
      { status: 502 },
    );
  }
}
