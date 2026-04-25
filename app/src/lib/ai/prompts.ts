import { z } from "zod";

/*
 * Centralized prompts + their response schemas.
 *
 * Keep all prompts in this one file so iteration is easy:
 * tweak copy here, not scattered across route handlers.
 */

export const CATEGORIES = [
  "internship",
  "fulltime",
  "case_competition",
  "hackathon",
  "fellowship",
  "scholarship",
  "conference",
  "workshop",
  "bootcamp",
  "networking",
  "campus_ambassador",
  "remote_gig",
  "other",
] as const;

/* ============ Extract Opportunity ============ */

export const ExtractedOpportunitySchema = z.object({
  title: z.string().min(1).max(300),
  organization: z.string().min(1).max(200),
  category: z.enum(CATEGORIES),
  description: z.string().nullable().optional().default(null),
  summary: z.string().max(300).nullable().optional().default(null),
  tags: z.array(z.string()).max(8).default([]),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:?\d{2})?)?$/)
    .nullable()
    .optional()
    .default(null),
  eligibility: z.string().nullable().optional().default(null),
  location: z.string().nullable().optional().default(null),
  compensation: z.string().nullable().optional().default(null),
  is_remote: z.boolean().default(false),
  apply_url: z.string().url().nullable().optional().default(null),
  difficulty: z.enum(["low", "medium", "high"]).nullable().optional().default(null),
  estimated_value_score: z
    .number()
    .int()
    .min(0)
    .max(100)
    .nullable()
    .optional()
    .default(null),
  // 0..1 self-rated by AI: how confident is the extraction?
  // 1.0 = explicit, well-formed job posting; 0.5 = ambiguous; 0.2 = doesn't look like a real opportunity.
  extraction_confidence: z.number().min(0).max(1).default(0.7),
});

export type ExtractedOpportunity = z.infer<typeof ExtractedOpportunitySchema>;

export const EXTRACT_SYSTEM_INSTRUCTION = `Extract a single career opportunity from messy text into clean JSON. Output ONLY a JSON object — no prose, no fences. Use null for unknown fields, [] for missing arrays. Dates as ISO 8601 ("YYYY-MM-DD"). summary = 1-2 sentence pitch. tags = 3-6 lowercase keywords. estimated_value_score = 0-100 honest assessment of career value. extraction_confidence = your 0..1 self-rating: 1.0 = explicit, well-formed posting with clear org+role; 0.5 = ambiguous (announcement, vague pitch); 0.2 = doesn't really look like an opportunity at all (Show HN, blog, news). Don't invent facts.`;

export function buildExtractPrompt({
  rawText,
  sourceUrl,
  hint,
}: {
  rawText: string;
  sourceUrl?: string;
  hint?: string;
}): string {
  const parts: string[] = [];
  parts.push("Extract a single structured opportunity from the text below.");
  if (hint) parts.push(`Hint about the source: ${hint}`);
  if (sourceUrl) parts.push(`Source URL (use as apply_url if no better one): ${sourceUrl}`);
  parts.push("");
  parts.push("Expected JSON shape:");
  parts.push(`{
  "title": string,
  "organization": string,
  "category": one of ${CATEGORIES.map((c) => `"${c}"`).join(" | ")},
  "description": string | null,
  "summary": string (1-2 sentences) | null,
  "tags": string[] (3-6 lowercase),
  "deadline": ISO 8601 datetime | null,
  "eligibility": string | null,
  "location": string | null,
  "compensation": string | null,
  "is_remote": boolean,
  "apply_url": URL | null,
  "difficulty": "low" | "medium" | "high" | null,
  "estimated_value_score": number 0-100 | null,
  "extraction_confidence": number 0..1 (your honest self-rating, see system instruction)
}`);
  parts.push("");
  parts.push("--- Raw text ---");
  parts.push(rawText.slice(0, 1500)); // cap input for free-tier token budget
  parts.push("--- End raw text ---");
  return parts.join("\n");
}
