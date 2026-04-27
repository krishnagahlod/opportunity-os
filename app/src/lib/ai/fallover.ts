import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import type { ZodSchema } from "zod";

/*
 * The AI brain of the app. Everything that needs an LLM goes through callLLM().
 *
 * Strategy:
 *   1. Try Gemini 2.0 Flash (cheap, fast, generous free tier).
 *   2. On rate limit / quota error, fall over to Groq Llama 3.3 70B (also free).
 *   3. Validate the returned JSON against a Zod schema — reject on mismatch
 *      (don't silently return garbage).
 *   4. Retry once on parse failure before giving up.
 */

export type LLMProvider = "gemini" | "groq";

export type LLMCallResult<T> = {
  data: T;
  provider: LLMProvider;
  raw: string;
};

const GEMINI_MODEL = "gemini-2.0-flash";
// Default Groq model — Llama 3.1 8B Instant. 30K TPM (2.5x more than 70B
// Versatile), faster, plenty smart for short/simple JSON like opportunity
// extraction. Some larger structured outputs (resume parsing) override
// this with `groqModel` to use 70B Versatile, which is more reliable on
// json_object mode for richer schemas.
const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";

export async function callLLM<T>({
  prompt,
  schema,
  systemInstruction,
  // 1000 ≈ ~750 words of JSON output. ExtractedOpportunitySchema has ~16 fields;
  // Groq was previously truncating at 600 on items with longer summaries/why text.
  maxTokens = 1000,
  groqModel = DEFAULT_GROQ_MODEL,
}: {
  prompt: string;
  schema: ZodSchema<T>;
  systemInstruction?: string;
  maxTokens?: number;
  /** Override Groq model for this call. Use 'llama-3.3-70b-versatile' for
   * larger / pickier structured outputs that the 8B model truncates. */
  groqModel?: string;
}): Promise<LLMCallResult<T>> {
  let geminiError: unknown = null;

  // --- Attempt 1: Gemini ---
  try {
    const raw = await callGemini(prompt, systemInstruction, maxTokens);
    const parsed = safeParse<T>(raw, schema);
    if (parsed) {
      return { data: parsed, provider: "gemini", raw };
    }
    // Parse failed — try once more with stricter reminder, still on Gemini
    const raw2 = await callGemini(
      prompt +
        "\n\nIMPORTANT: respond with ONLY a single JSON object matching the schema. No prose, no markdown fences.",
      systemInstruction,
      maxTokens,
    );
    const parsed2 = safeParse<T>(raw2, schema);
    if (parsed2) {
      return { data: parsed2, provider: "gemini", raw: raw2 };
    }
    throw new Error(
      `Gemini returned invalid JSON twice. Last output: ${raw2.slice(0, 200)}`,
    );
  } catch (e) {
    geminiError = e;
    if (!isRateLimited(e) && !isQuotaError(e)) {
      // Not a rate-limit — re-throw so we know Gemini is legitimately broken
      // for this request shape. Don't silently mask bad prompts behind Groq.
      if (isTransient(e)) {
        // network/transient — fall through to Groq as a resilience play
      } else {
        throw e;
      }
    }
  }

  // --- Attempt 2: Groq ---
  try {
    const raw = await callGroq(prompt, systemInstruction, maxTokens, groqModel);
    const parsed = safeParse<T>(raw, schema);
    if (parsed) {
      return { data: parsed, provider: "groq", raw };
    }
    // Parse failed — retry once with a stricter "complete the JSON" reminder.
    // Mirrors the Gemini path. Llama models occasionally stop early on
    // json_object mode and a fresh prompt with explicit closure instruction
    // usually fixes it.
    const raw2 = await callGroq(
      prompt +
        "\n\nIMPORTANT: respond with ONE complete JSON object matching the schema. Close every array and object. No prose, no markdown fences, no truncation.",
      systemInstruction,
      maxTokens,
      groqModel,
    );
    const parsed2 = safeParse<T>(raw2, schema);
    if (parsed2) {
      return { data: parsed2, provider: "groq", raw: raw2 };
    }
    throw new Error(
      `Groq returned invalid JSON twice. Last output (${raw2.length} chars): ${raw2.slice(0, 600)}`,
    );
  } catch (groqError) {
    throw new Error(
      `Both providers failed. Gemini: ${errMsg(geminiError)}. Groq: ${errMsg(groqError)}`,
    );
  }
}

/* ============ Provider-specific calls ============ */

async function callGemini(
  prompt: string,
  systemInstruction: string | undefined,
  maxTokens: number,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: maxTokens,
      temperature: 0.2,
    },
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function callGroq(
  prompt: string,
  systemInstruction: string | undefined,
  maxTokens: number,
  model: string,
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const client = new Groq({ apiKey });
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [];
  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }
  messages.push({ role: "user", content: prompt });

  // Retry once on TPM rate-limit. Groq tells us how long to wait in the error;
  // we honor that (capped at 15s) and try again instead of failing the request.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const chat = await client.chat.completions.create({
        model,
        messages,
        response_format: { type: "json_object" },
        max_tokens: maxTokens,
        temperature: 0.2,
      });
      const choice = chat.choices[0];
      const content = choice?.message?.content ?? "";
      if (!content) throw new Error("Groq returned empty content");
      // Surface length truncation as a recognisable error so the caller knows
      // bumping max_tokens (rather than re-prompting) is the actual fix.
      if (choice?.finish_reason === "length") {
        throw new Error(
          `Groq truncated output at max_tokens=${maxTokens} (finish_reason=length). Last chars: "${content.slice(-80)}"`,
        );
      }
      return content;
    } catch (e) {
      if (attempt === 0 && isRateLimited(e)) {
        const waitMs = Math.min(parseGroqRetryMs(e) ?? 6000, 15000);
        console.warn(
          `[fallover] Groq TPM hit, sleeping ${waitMs}ms then retrying once`,
        );
        await sleep(waitMs);
        continue;
      }
      throw e;
    }
  }
  throw new Error("Unreachable");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Parse "Please try again in 5.32s" or "Please try again in 1.66s" out of Groq's error string. */
function parseGroqRetryMs(e: unknown): number | null {
  const msg = errMsg(e);
  const m = msg.match(/try again in ([\d.]+)\s*s/i);
  if (!m) return null;
  const seconds = Number(m[1]);
  return Number.isFinite(seconds) ? Math.ceil(seconds * 1000) : null;
}

/* ============ Helpers ============ */

function safeParse<T>(raw: string, schema: ZodSchema<T>): T | null {
  const cleaned = stripJsonFences(raw).trim();
  try {
    const obj = JSON.parse(cleaned);
    const result = schema.safeParse(obj);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function stripJsonFences(s: string): string {
  const m = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return m ? m[1] : s;
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

function isRateLimited(e: unknown): boolean {
  const msg = errMsg(e).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests")
  );
}

function isQuotaError(e: unknown): boolean {
  const msg = errMsg(e).toLowerCase();
  return (
    msg.includes("quota") ||
    msg.includes("resource_exhausted") ||
    msg.includes("billing")
  );
}

function isTransient(e: unknown): boolean {
  const msg = errMsg(e).toLowerCase();
  return (
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("timeout") ||
    msg.includes("econnreset") ||
    msg.includes("503") ||
    msg.includes("502")
  );
}
