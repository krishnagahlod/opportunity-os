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
  | "freebie"
  | "certification"
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
  /** Full extracted text from the resume, used for deep AI matching. */
  resume_text?: string | null;
  telegram_chat_id: string | null;
  /** Minimum 0..100 score required for an opportunity to appear in this user's
   * Telegram digest. Email digest ignores this. Default 70. */
  telegram_min_score: number;
  /** UUID used to authenticate /api/calendar.ics subscribers. Null until first opt-in. */
  calendar_token: string | null;
  role: UserRole;
  onboarded: boolean;
  stage?: string | null;
  opportunity_goals?: string[];
  avoid_tags?: string[];
  target_companies?: string[];
  min_compensation?: string | null;
  created_at: string;
  updated_at: string;
};

export type ResumeMatch = {
  user_id: string;
  opportunity_id: string;
  match_score: number;
  strengths: string[];
  weaknesses: string[];
  analyzed_at: string;
};

export type Opportunity = {
  id: string;
  title: string;
  organization: string;
  category: OpportunityCategory;
  description: string | null;
  summary: string | null;
  tags: string[];
  /** Skills the listing explicitly requires. Lowercase. AI-extracted at ingest.
   * Used by the detail page's "What you're missing" gap-analysis section. */
  required_skills: string[];
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
  company_id: string | null;
  company?: Company | null;

  // Enrichment fields (Populated on-demand via /api/ai/enrich)
  role_seniority?: string | null;
  eligibility_tags?: string[];
  effort_score?: number | null;
  upside_score?: number | null;
  competition_intensity?: number | null;
  legitimacy_score?: number | null;
  action_plan?: string | null;
  red_flags?: string[];
  enriched_at?: string | null;
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

export type RawOpportunity = {
  id: string;
  source_id: string;
  source_url: string;
  raw_data: any; // The JSON representing the unstructured listing
  status: "pending" | "processed" | "failed" | "duplicate";
  created_at: string;
  processed_at?: string;
};

export interface Company {
  id: string;
  name: string;
  domain: string;
  logo_url: string | null;
  description: string | null;
  industry: string | null;
  founded_year: number | null;
  employee_count: string | null;
  headquarters: string | null;
  website: string | null;
  linkedin_url: string | null;
  funding_stage: string | null;
  total_funding: string | null;
  trust_score: number;
  trust_signals: any;
  enriched_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OutreachLead {
  id: string;
  company_id: string;
  name: string;
  title: string | null;
  lead_type: string | null;
  source: string | null;
  linkedin_url: string | null;
  email: string | null;
  email_verified: boolean;
  relevance_score: number;
  created_at: string;
}

export interface OutreachLog {
  id: string;
  user_id: string;
  lead_id: string | null;
  opportunity_id: string | null;
  status: string;
  email_draft: string | null;
  sent_at: string | null;
  follow_up_at: string | null;
  created_at: string;
  updated_at: string;
}


export type SourceConnector = {
  id: string;
  name: string;
  connector_type: string;
  url: string | null;
  config: Record<string, any>;
  target_personas: string[];
  categories: string[];
  country_focus: string[];
  enabled: boolean;
  trust_tier: number;
  fetch_frequency_minutes: number;
  last_run_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type SourceQualityDaily = {
  source_connector_id: string;
  day: string;
  fetched_count: number;
  inserted_count: number;
  duplicate_count: number;
  expired_count: number;
  low_confidence_count: number;
  hidden_count: number;
  save_count: number;
  apply_count: number;
  dismiss_count: number;
  avg_score: number | null;
  avg_confidence: number | null;
};

export type OpportunityFeedback = {
  user_id: string;
  opportunity_id: string;
  feedback: 'not_interested' | 'bad_match' | 'already_seen' | 'ineligible' | 'low_quality' | 'broken_link' | 'great_match';
  created_at: string;
};

// ============================================================================
// SaaS Subscription & Entitlement Types
// ============================================================================

export type PlanKey =
  | "free"
  | "iitb_free"
  | "pro_30d"
  | "pro_90d"
  | "pro_365d"
  | "lifetime"
  | "admin";

export type Plan = {
  id: string;
  product: string;
  slug: PlanKey;
  display_name: string;
  description: string | null;
  price_inr: number;
  duration_days: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type EntitlementStatus = "active" | "scheduled" | "expired" | "revoked" | "suspended";
export type EntitlementSource = "iitb" | "admin" | "razorpay" | "promo" | "topmate" | "system";

export type Entitlement = {
  id: string;
  user_id: string;
  product: string;
  plan_key: PlanKey;
  status: EntitlementStatus;
  source: EntitlementSource;
  starts_at: string;
  expires_at: string | null;
  granted_by: string | null;
  external_reference: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type SubscriptionStatus = "created" | "pending" | "active" | "cancelled" | "expired" | "refunded";

export type Subscription = {
  id: string;
  user_id: string;
  product: string;
  plan_key: PlanKey;
  provider: string;
  provider_customer_id: string | null;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  provider_subscription_id: string | null;
  status: SubscriptionStatus;
  started_at: string;
  current_period_start: string;
  current_period_end: string | null;
  cancelled_at: string | null;
  ended_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type PaymentStatus = "created" | "pending" | "paid" | "failed" | "refunded" | "cancelled";

export type PaymentTransaction = {
  id: string;
  user_id: string;
  product: string;
  plan_key: string;
  amount: number;
  currency: string;
  provider: string;
  provider_order_id: string;
  provider_payment_id: string | null;
  provider_signature: string | null;
  status: PaymentStatus;
  raw_reference: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type FeatureKey =
  | "opportunity_feed_limit"
  | "search_query"
  | "ai_cold_outreach"
  | "verified_contact_info"
  | "hot_leads_access"
  | "ai_action_plan"
  | "company_trust_scores"
  | "priority_instant_alerts";

export type FeatureLimit = {
  id: string;
  product: string;
  plan_key: PlanKey;
  feature_key: FeatureKey;
  enabled: boolean;
  limit_value: number; // -1 = unlimited
  period: "daily" | "weekly" | "monthly" | "lifetime" | "forever";
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type UsageEvent = {
  id: string;
  user_id: string;
  product: string;
  feature_key: FeatureKey;
  period_key: string;
  count: number;
  last_used_at: string;
  created_at: string;
  updated_at: string;
};

export type UserSession = {
  id: string;
  user_id: string;
  session_token_hash: string;
  device_hash: string | null;
  device_name: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  created_at: string;
  last_seen_at: string;
  revoked_at: string | null;
};

export type AdminAuditLog = {
  id: string;
  admin_user_id: string;
  target_user_id: string | null;
  product: string;
  action: string;
  before_state: Record<string, any> | null;
  after_state: Record<string, any> | null;
  reason: string | null;
  created_at: string;
};

export type UserEntitlementState = {
  planKey: PlanKey;
  displayName: string;
  isPro: boolean;
  isIITB: boolean;
  isAdmin: boolean;
  isLifetime: boolean;
  expiresAt: string | null;
  daysRemaining: number | null;
  limits: Record<FeatureKey, { enabled: boolean; limitValue: number; period: string }>;
  usage: Record<FeatureKey, number>;
};

