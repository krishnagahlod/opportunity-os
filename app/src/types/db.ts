// Hand-authored DB types mirroring supabase/migrations/0001_init.sql.
// Replace with generated types later via `supabase gen types typescript` when convenient.

export type RemotePreference = "remote" | "onsite" | "hybrid" | "any";
export type TimeCommitment = "full-time" | "part-time" | "internship" | "any";
export type UserRole = "user" | "admin";

export type OpportunityCategory =
  | "internship"
  | "fulltime"
  | "case_competition"
  | "hackathon"
  | "fellowship"
  | "scholarship"
  | "conference"
  | "workshop"
  | "bootcamp"
  | "networking"
  | "campus_ambassador"
  | "remote_gig"
  | "other";

export type OpportunityStatus = "active" | "expired" | "spam" | "pending";
export type Difficulty = "low" | "medium" | "high";
export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interviewing"
  | "rejected"
  | "won";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  college: string | null;
  graduation_year: number | null;
  interests: string[];
  skills: string[];
  preferred_location: string | null;
  remote_preference: RemotePreference | null;
  time_commitment: TimeCommitment | null;
  /** Storage path of the uploaded resume, e.g. "<user_id>/<uuid>.pdf". Used to refetch / delete. */
  resume_url: string | null;
  /** AI-extracted skill candidates from the resume. User confirms which to merge into `skills`. */
  resume_skills: string[];
  resume_uploaded_at: string | null;
  telegram_chat_id: string | null;
  /** UUID used to authenticate /api/calendar.ics subscribers. Null until first opt-in. */
  calendar_token: string | null;
  role: UserRole;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
};

export type Opportunity = {
  id: string;
  title: string;
  organization: string;
  category: OpportunityCategory;
  description: string | null;
  summary: string | null;
  tags: string[];
  deadline: string | null;
  eligibility: string | null;
  location: string | null;
  compensation: string | null;
  is_remote: boolean;
  apply_url: string | null;
  source_url: string | null;
  source_id: string | null;
  difficulty: Difficulty | null;
  estimated_value_score: number | null;
  /** AI's self-rated 0..1 confidence in the extraction. Null on pre-2.5 rows. */
  extraction_confidence: number | null;
  date_added: string;
  featured: boolean;
  status: OpportunityStatus;
};

export type IngestionLogStatus =
  | "extracted"
  | "upserted"
  | "skipped_duplicate"
  | "skipped_filtered"
  | "failed";

export type IngestionLog = {
  id: string;
  source_id: string | null;
  source_name: string | null;
  source_url: string | null;
  status: IngestionLogStatus;
  reason: string | null;
  provider: "gemini" | "groq" | null;
  tokens_used: number | null;
  duration_ms: number | null;
  opportunity_id: string | null;
  created_at: string;
};

export type SavedOpportunity = {
  user_id: string;
  opportunity_id: string;
  saved_at: string;
};

export type Application = {
  id: string;
  user_id: string;
  opportunity_id: string;
  status: ApplicationStatus;
  notes: string | null;
  updated_at: string;
};

export type ScoreBreakdown = {
  profile_relevance: number;
  career_value: number;
  brand_value: number;
  compensation: number;
  ease: number;
  urgency: number;
  confidence: number;
};

export type Score = {
  user_id: string;
  opportunity_id: string;
  score: number;
  breakdown: ScoreBreakdown | Record<string, number> | null;
  why: string | null;
  computed_at: string;
};
