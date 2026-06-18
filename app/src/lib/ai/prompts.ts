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
  // Hard requirements the listing names — feeds the detail page's
  // "What you're missing" gap analysis. Lowercase keywords only.
  // Empty array if nothing is explicitly stated as required (don't infer).
  required_skills: z.array(z.string().min(1).max(40)).max(8).default([]),
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
  skills: z.array(z.string().min(1).max(40)).max(25).default([]),
  roles_of_interest: z.array(z.string().min(1).max(60)).max(6).default([]),
  estimated_seniority: z.enum(["student", "intern", "entry_level", "early_career", "mid_level", "senior", "lead", "unknown"]).default("unknown"),
  key_achievements: z.array(z.string()).max(3).default([]),
});

export type ResumeExtraction = z.infer<typeof ResumeExtractionSchema>;

export const RESUME_SYSTEM_INSTRUCTION = `You read resumes and output ONE complete JSON object — no prose, no fences, no truncation. Close every array and object. Be conservative: only extract what's explicitly demonstrated. Don't invent skills from coursework names alone — only include a skill if there's evidence of actual use (project, role, or specific competency claim). Roles_of_interest must be picked from the predefined bucket list provided in the user prompt — do NOT invent new role names. Skills should prefer the predefined chip list when applicable; otherwise return lowercase keywords. Hard caps: max 25 skills, max 6 roles. Cut aggressively if the candidate has more. Identify 1-3 key achievements.`;

/**
 * Build the resume-extraction prompt with the candidate's PDF text inlined.
 * Caps text at ~12k chars (~3k tokens) so single-page resumes pass through
 * untouched while multi-page CVs don't blow past Groq's 8k-token output
 * window or Gemini's free-tier per-minute input cap.
 *
 * Passing `roleOptions` and `skillOptions` constrains the AI to emit values
 * that match our onboarding chips exactly — so a finance resume returns
 * `["Finance"]` (matches the chip) instead of `["Investment Banking",
 * "Equity Research"]` which would silently fail to tick anything.
 */
export function buildResumePrompt(
  resumeText: string,
  roleOptions: readonly string[],
  skillOptions: readonly string[],
): string {
  const trimmed = resumeText.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const capped = trimmed.length > 12000 ? `${trimmed.slice(0, 12000)}\n[...truncated]` : trimmed;
  return [
    "Extract structured data from this resume.",
    "",
    "ROLES_OF_INTEREST — pick all that apply from this exact list (case-insensitive, max 6). DO NOT invent new role names.",
    ...roleOptions.map((r) => `  - ${r}`),
    "",
    "SKILLS — when a skill matches one of these chip names, use the exact spelling:",
    `  ${skillOptions.join(", ")}`,
    "Otherwise return a lowercase keyword (e.g. 'react', 'sql', 'figma'). Max 25, deduped.",
    "",
    "Expected JSON shape (output ONE complete object — close every bracket):",
    "{",
    '  "skills": string[],              // mix of chip names + lowercase keywords; MAX 25',
    '  "roles_of_interest": string[],   // ONLY values from the role list above; MAX 6',
    '  "estimated_seniority": "student" | "intern" | "entry_level" | "early_career" | "mid_level" | "senior" | "lead" | "unknown",',
    '  "key_achievements": string[]     // 1-3 most impressive bullet points/achievements',
    "}",
    "",
    "Output JSON only — no prose, no fences. Make sure both arrays are closed.",
    "",
    "--- Resume text ---",
    capped,
    "--- End resume text ---",
  ].join("\n");
}

export const EXTRACT_SYSTEM_INSTRUCTION = `Extract a single career opportunity from messy text into clean JSON. Output ONLY a JSON object — no prose, no fences. Use null for unknown fields, [] for missing arrays. Dates as ISO 8601 ("YYYY-MM-DD"). summary = 1-2 sentence pitch. tags = 3-6 lowercase keywords. required_skills = lowercase keywords the listing EXPLICITLY requires (e.g. "python", "sql", "react"). Empty array if not explicitly stated. Don't infer requirements from job title or general description — only include what's clearly named as a requirement. estimated_value_score = 0-100 honest assessment of career value. extraction_confidence = your 0..1 self-rating: 1.0 = explicit, well-formed posting with clear org+role; 0.5 = ambiguous (announcement, vague pitch); 0.2 = doesn't really look like an opportunity at all (Show HN, blog, news). Don't invent facts.`;

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
  "category": one of ${CATEGORIES.map((c) => `"${c}"`).join(" | ")}. (Note: internship = short-term for students/grads. fulltime = permanent employment. fellowship = immersive stipend-based cohort program. scholarship = educational funding. When title contains 'intern', use 'internship'. When title contains 'fellowship', use 'fellowship'),
  "description": string | null,
  "summary": string (1-2 sentences) | null,
  "tags": string[] (3-6 lowercase),
  "required_skills": string[] (max 8, lowercase, only if EXPLICITLY required, [] otherwise),
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
  parts.push(rawText.slice(0, 2500)); // cap input for token budget
  parts.push("--- End raw text ---");
  return parts.join("\n");
}

/* ============ Cross-source dedup check ============ */

/** Compact snapshot of an opportunity fed to the dedup AI. Title + org are
 * the strongest signals; category/location/summary disambiguate when the
 * top-line fields match but the role is actually different. */
export type DedupPostingSnapshot = {
  title: string;
  organization: string;
  category: string;
  location?: string | null;
  summary?: string | null;
};

export const DedupCheckSchema = z.object({
  same: z.boolean(),
  /** 0..1 — model's self-rated confidence in the boolean. We treat
   * confidence < 0.7 as "uncertain → don't dedup" (false-negative bias
   * is safer than false-positive). */
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(200).optional(),
});

export type DedupCheck = z.infer<typeof DedupCheckSchema>;

export const DEDUP_SYSTEM_INSTRUCTION = `You determine whether two job/opportunity postings refer to the same role. Output ONE JSON object — no prose, no fences. Two postings are SAME when they are clearly the same role at the same organization being reposted from a different source. They are DIFFERENT when role title, level (intern vs full-time vs lead), or location differs in any meaningful way. When uncertain, return same=false with low confidence. False negatives (allowing a duplicate row to exist) are far safer than false positives (rejecting a legitimately different role). Confidence should be your honest 0..1 self-rating: 1.0 = obvious match (or obvious mismatch), 0.5 = could go either way, 0.2 = haven't really told you enough.`;

export function buildDedupPrompt(
  a: DedupPostingSnapshot,
  b: DedupPostingSnapshot,
): string {
  return [
    "Are these two postings the same opportunity?",
    "",
    "Posting A:",
    `  Title: ${a.title}`,
    `  Organization: ${a.organization}`,
    `  Category: ${a.category}`,
    `  Location: ${a.location ?? "unspecified"}`,
    `  Summary: ${(a.summary ?? "").slice(0, 300)}`,
    "",
    "Posting B:",
    `  Title: ${b.title}`,
    `  Organization: ${b.organization}`,
    `  Category: ${b.category}`,
    `  Location: ${b.location ?? "unspecified"}`,
    `  Summary: ${(b.summary ?? "").slice(0, 300)}`,
    "",
    'Return JSON: { "same": boolean, "confidence": 0..1, "reasoning"?: short string }',
  ].join("\n");
}

/* ============ Enrich Opportunity ============ */

export const OpportunityEnrichmentSchema = z.object({
  role_seniority: z.enum([
    "student",
    "intern",
    "entry_level",
    "early_career",
    "mid_level",
    "senior",
    "unknown",
  ]),
  best_for: z.array(z.string()).max(5),
  eligibility_tags: z.array(z.string()).max(10),
  nice_to_have_skills: z.array(z.string()).max(10),
  effort_score: z.number().int().min(0).max(100),
  upside_score: z.number().int().min(0).max(100),
  competition_intensity: z.number().int().min(0).max(100),
  legitimacy_score: z.number().int().min(0).max(100),
  action_plan: z.string().max(300),
  red_flags: z.array(z.string()).max(8),
});

export type OpportunityEnrichment = z.infer<typeof OpportunityEnrichmentSchema>;

export const ENRICH_SYSTEM_INSTRUCTION = `You read a career opportunity posting and extract qualitative judgments. Output ONE complete JSON object — no prose, no fences.
Facts must come from the listing text. Inferences must be conservative. If unclear, return lower confidence or a red flag.`;

export function buildEnrichPrompt(
  title: string,
  organization: string,
  category: string,
  description: string | null,
  eligibility: string | null
): string {
  return [
    "Enrich this opportunity with qualitative judgments.",
    "",
    `Title: ${title}`,
    `Organization: ${organization}`,
    `Category: ${category}`,
    `Eligibility: ${eligibility || "Unknown"}`,
    "",
    "Description:",
    (description || "").slice(0, 3000),
    "",
    "Expected JSON format:",
    `{
  "role_seniority": "student" | "intern" | "entry_level" | "early_career" | "mid_level" | "senior" | "unknown",
  "best_for": string[] (max 5),
  "eligibility_tags": string[] (max 10),
  "nice_to_have_skills": string[] (max 10),
  "effort_score": 0-100,
  "upside_score": 0-100,
  "competition_intensity": 0-100,
  "legitimacy_score": 0-100,
  "action_plan": string (max 300),
  "red_flags": string[] (max 8)
}`
  ].join("\n");
}

/* ============ Action Plan (Personalized) ============ */

export const ActionPlanSchema = z.object({
  gap_analysis: z.array(z.string()).max(4),
  resume_tweaks: z.array(z.string()).max(4),
  interview_prep: z.array(z.string()).max(4),
  cold_outreach_draft: z.string(),
});

export type ActionPlan = z.infer<typeof ActionPlanSchema>;

export const ACTION_PLAN_SYSTEM_INSTRUCTION = `You are a career advisor helping a candidate apply to an opportunity. Your job is to output a JSON object containing a concrete, structured action plan.
Do NOT invent information that isn't provided. Be concise, actionable, and encouraging. Focus heavily on practical next steps. Output ONLY a valid JSON object.`;

export function buildActionPlanPrompt(
  title: string,
  organization: string,
  description: string | null,
  resumeText: string | null,
  userSkills: string[],
  userGoals: string[],
): string {
  const cleanDesc = (description || "").slice(0, 3000);
  const cleanResume = (resumeText || "").slice(0, 3000);

  return [
    "Generate a highly personalized action plan to help this candidate land this specific opportunity.",
    "",
    "--- OPPORTUNITY ---",
    `Title: ${title}`,
    `Organization: ${organization}`,
    "Description:",
    cleanDesc,
    "",
    "--- CANDIDATE ---",
    `Goals: ${userGoals.join(", ")}`,
    `Known Skills: ${userSkills.join(", ")}`,
    "Resume Summary / Text:",
    cleanResume || "No resume provided.",
    "",
    "--- REQUIREMENTS ---",
    "1. gap_analysis: 2-3 specific bullet points highlighting exact skills or experiences the candidate is missing compared to the job description, and how to mitigate them.",
    "2. resume_tweaks: 2-3 highly specific bullet points on how they should tailor their resume for THIS exact role based on their background.",
    "3. interview_prep: 2-3 specific topics, algorithms, or behavioral themes they must study for this role.",
    "4. cold_outreach_draft: A 3-sentence cold email they can send to a recruiter or hiring manager at this company. Explicitly mention one of the user's past experiences and map it to a core requirement of the role.",
    "",
    "Expected JSON format:",
    `{
  "gap_analysis": string[],
  "resume_tweaks": string[],
  "interview_prep": string[],
  "cold_outreach_draft": string
}`
  ].join("\n");
}

/* ============ Category Refinement ============ */

export const CategoryRefinementSchema = z.object({
  category: z.enum(CATEGORIES),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().max(200).optional(),
});

export type CategoryRefinement = z.infer<typeof CategoryRefinementSchema>;

export const CATEGORY_REFINEMENT_SYSTEM_INSTRUCTION = `You verify and potentially correct the categorization of a job opportunity. Output ONE complete JSON object — no prose, no fences.
You will be given the original category chosen by the connector, and the job details.
If the original category is correct, return it with high confidence (e.g. 0.9).
If it is wrong (e.g. it says fulltime but it is an internship), return the corrected category with high confidence.
Note: internship = typically unpaid or stipend-based, aimed at students/recent grads, duration 1-6 months. fulltime = salaried, permanent employment.`;

export function buildCategoryRefinementPrompt(
  title: string,
  organization: string,
  description: string | null,
  originalCategory: string
): string {
  const cleanDesc = (description || "").slice(0, 800);
  return [
    "Verify the category for this opportunity.",
    "",
    `Title: ${title}`,
    `Organization: ${organization}`,
    `Original Category: ${originalCategory}`,
    "Description:",
    cleanDesc,
    "",
    "Expected JSON shape:",
    `{
  "category": one of ${CATEGORIES.map((c) => `"${c}"`).join(" | ")},
  "confidence": number 0..1,
  "reasoning": string
}`
  ].join("\n");
}

/* ============ Deep Resume Match ============ */

export const AI_MATCH_SYSTEM_INSTRUCTION = `You are an expert technical recruiter and career coach. Your job is to evaluate a candidate's resume against a specific opportunity description and provide an objective match score (0-100) along with concrete strengths and weaknesses.
Output ONLY a JSON object. Ensure the format is strictly adhered to.`;

export const ResumeMatchSchema = z.object({
  match_score: z.number().int().min(0).max(100),
  strengths: z.array(z.string()).max(3),
  weaknesses: z.array(z.string()).max(3),
});

export type ResumeMatchResult = z.infer<typeof ResumeMatchSchema>;

export function buildMatchPrompt(
  resumeText: string,
  oppTitle: string,
  oppOrganization: string,
  oppDescription: string | null,
  oppRequiredSkills: string[]
): string {
  const cappedResume = resumeText.slice(0, 15000);
  const cappedDesc = (oppDescription || "").slice(0, 5000);
  
  return [
    `Evaluate the fit between the candidate's resume and the target opportunity.`,
    ``,
    `Target Opportunity:`,
    `- Title: ${oppTitle}`,
    `- Organization: ${oppOrganization}`,
    `- Required Skills: ${oppRequiredSkills.join(", ") || "None specified"}`,
    `- Description: ${cappedDesc}`,
    ``,
    `Candidate Resume:`,
    `---`,
    cappedResume,
    `---`,
    ``,
    `Expected JSON shape:`,
    `{`,
    `  "match_score": integer // 0 to 100. Be realistic. 90+ means near-perfect fit. 50-70 means some overlap but missing key requirements. <50 means poor fit.`,
    `  "strengths": string[] // Up to 3 short, specific bullet points on why they are a strong fit (max 15 words each).`,
    `  "weaknesses": string[] // Up to 3 short, specific bullet points on what they lack or areas for concern (max 15 words each).`,
    `}`,
  ].join("\n");
}
