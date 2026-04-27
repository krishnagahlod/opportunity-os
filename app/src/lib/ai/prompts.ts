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
  // Some AI extractions can't determine org (e.g., a Reddit megathread).
  // Allow null here; the upsert endpoint falls back to source_url hostname
  // or source_name so the DB never gets an actual null in the NOT-NULL column.
  organization: z.string().max(200).nullable().optional().default(null),
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

/* ============ Extract Resume ============ */

/**
 * Schema for what we ask Gemini to pull out of a resume PDF. Kept tight on
 * purpose — we only need signal that improves opportunity matching, not a
 * complete CV parse.
 */
export const ResumeExtractionSchema = z.object({
  /** Lowercase, deduped, normalized skill keywords (e.g. "react", "sql", "figma"). */
  skills: z.array(z.string().min(1).max(40)).max(25).default([]),
  /** Loose interest/role buckets the resume implies (e.g. "Software Engineering", "Data Science"). */
  roles_of_interest: z.array(z.string().min(1).max(60)).max(6).default([]),
  /** 1-sentence factual summary, no embellishment. Optional. */
  summary: z.string().max(200).nullable().optional().default(null),
});

export type ResumeExtraction = z.infer<typeof ResumeExtractionSchema>;

export const RESUME_SYSTEM_INSTRUCTION = `You read resumes and output JSON only — no prose, no fences. Be conservative: only extract what's explicitly demonstrated. Skills are lowercase technical / professional keywords (frameworks, languages, tools, soft skills the candidate clearly uses). Don't invent skills from coursework names alone — only include a skill if there's evidence of actual use (project, role, or specific competency claim). Roles_of_interest are broad role buckets like "Software Engineering" or "Product Management" inferred from the candidate's trajectory. Summary is one short factual sentence. Hard caps: max 25 skills, max 6 roles, max 200 chars summary — cut aggressively to fit.`;

/**
 * Build the resume-extraction prompt with the candidate's PDF text inlined.
 * Caps text at ~12k chars (~3k tokens) so single-page resumes pass through
 * untouched while multi-page CVs don't blow past Groq's 8k-token output
 * window or Gemini's free-tier per-minute input cap.
 */
export function buildResumePrompt(resumeText: string): string {
  const trimmed = resumeText.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const capped = trimmed.length > 12000 ? `${trimmed.slice(0, 12000)}\n[...truncated]` : trimmed;
  return [
    "Extract structured data from this resume.",
    "",
    "Expected JSON:",
    "{",
    '  "skills": string[],              // lowercase keywords; MAX 25; deduped',
    '  "roles_of_interest": string[],   // MAX 6 broad role buckets',
    '  "summary": string | null         // ONE short factual sentence (max 200 chars)',
    "}",
    "",
    "Output JSON only — no prose, no fences.",
    "",
    "--- Resume text ---",
    capped,
    "--- End resume text ---",
  ].join("\n");
}

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
