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
});

export type ExtractedOpportunity = z.infer<typeof ExtractedOpportunitySchema>;

export const EXTRACT_SYSTEM_INSTRUCTION = `You are an opportunity-ingestion assistant for Opportunity OS, a platform that aggregates career opportunities (internships, full-time roles, case competitions, hackathons, fellowships, scholarships, etc.) for ambitious students and early professionals.

You extract clean, structured JSON from messy text scraped from career pages, Unstop, Wellfound, RSS feeds, and similar sources.

Rules:
- Respond with ONLY a valid JSON object — no prose, no markdown fences.
- If a field can't be determined with confidence, use null (or [] for arrays).
- Dates must be ISO 8601 ("YYYY-MM-DD" or "YYYY-MM-DDTHH:MM:SSZ"). If no date, null.
- "summary" is a 1-2 sentence plain-English pitch. Never empty if description exists.
- "tags" is 3-6 lowercase topical keywords (e.g. "fintech", "backend", "consulting").
- "estimated_value_score" is your honest 0-100 estimate of this opportunity's value to an ambitious student. Factor in brand, compensation, selectivity, career impact.
- Do not invent facts. If the text says "stipend unknown", write compensation: null, not a made-up number.`;

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
  "estimated_value_score": number 0-100 | null
}`);
  parts.push("");
  parts.push("--- Raw text ---");
  parts.push(rawText.slice(0, 8000)); // cap input for free-tier token budget
  parts.push("--- End raw text ---");
  return parts.join("\n");
}
