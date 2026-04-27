import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ResumeExtractionSchema,
  RESUME_SYSTEM_INSTRUCTION,
  RESUME_USER_PROMPT,
  type ResumeExtraction,
} from "./prompts";

/**
 * Parse a resume PDF into structured skills/roles/summary using Gemini's
 * multimodal endpoint.
 *
 * Why Gemini directly (not via callLLM fallover):
 *   - PDF parsing is multimodal — Groq doesn't support it, so there's no
 *     useful fallover target. If Gemini is down, we surface that to the user
 *     instead of pretending to parse.
 *   - This is a one-time call per upload, not a high-volume ingestion path —
 *     so the lack of fallover doesn't hurt the system overall.
 */
export async function parseResumePdf(
  pdfBytes: Uint8Array,
): Promise<ResumeExtraction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    // 2.0 Flash supports multimodal PDF input, including OCR for scanned files.
    model: "gemini-2.0-flash",
    systemInstruction: RESUME_SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 1500,
      temperature: 0.1,
    },
  });

  // Gemini wants base64 for inlineData. Buffer.toString('base64') is the
  // standard Node way to encode bytes — works on Vercel's Node runtime too.
  const base64 = Buffer.from(pdfBytes).toString("base64");

  const result = await model.generateContent([
    { text: RESUME_USER_PROMPT },
    {
      inlineData: {
        mimeType: "application/pdf",
        data: base64,
      },
    },
  ]);

  const raw = result.response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripFences(raw));
  } catch {
    throw new Error(
      `Resume parser returned non-JSON. Output: ${raw.slice(0, 200)}`,
    );
  }

  const validated = ResumeExtractionSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `Resume parser returned malformed shape: ${validated.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }

  return normalize(validated.data);
}

/** Lowercase, dedupe, drop one-char garbage tokens. */
function normalize(input: ResumeExtraction): ResumeExtraction {
  const cleanSkills = uniq(
    input.skills
      .map((s) => s.toLowerCase().trim())
      .filter((s) => s.length >= 2 && s.length <= 40),
  ).slice(0, 40);

  const cleanRoles = uniq(
    input.roles_of_interest
      .map((s) => s.trim())
      .filter((s) => s.length >= 2 && s.length <= 60),
  ).slice(0, 10);

  return {
    skills: cleanSkills,
    roles_of_interest: cleanRoles,
    summary: input.summary?.trim() || null,
  };
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function stripFences(s: string): string {
  const m = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return m ? m[1] : s;
}
