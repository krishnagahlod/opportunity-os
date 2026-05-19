import "server-only";
import { callLLM } from "./fallover";
import {
  DedupCheckSchema,
  DEDUP_SYSTEM_INSTRUCTION,
  buildDedupPrompt,
  type DedupCheck,
  type DedupPostingSnapshot,
} from "./prompts";

/**
 * Cross-source deduplication via AI. Called from the ingest upsert route
 * when a new opportunity's title+organization (normalized) matches an
 * already-stored opportunity from a different source_url, added within the
 * last 14 days.
 *
 * Returns the parsed { same, confidence, reasoning } from the model. The
 * caller decides what to do — typically: reject the new insert if
 * `same && confidence >= 0.7`, otherwise let it through.
 *
 * Cost: 1 small Gemini call per fuzzy-match collision. Collisions are rare
 * (most opportunities don't appear on multiple of our sources), so this
 * adds maybe 5-20 calls/day in practice.
 *
 * Errors propagate — caller should catch and proceed with normal upsert on
 * failure (better to occasionally double-insert than silently lose a
 * legitimate opportunity).
 */
export async function checkDuplicate(
  a: DedupPostingSnapshot,
  b: DedupPostingSnapshot,
): Promise<DedupCheck> {
  const result = await callLLM({
    prompt: buildDedupPrompt(a, b),
    schema: DedupCheckSchema,
    systemInstruction: DEDUP_SYSTEM_INSTRUCTION,
    maxTokens: 200,
  });
  return result.data;
}
