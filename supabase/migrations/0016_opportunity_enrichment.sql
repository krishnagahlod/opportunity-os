-- Migration: Opportunity Enrichment
-- Description: Adds columns to store deep qualitative factors extracted via the on-demand enrichment pipeline.

ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS role_seniority text,
ADD COLUMN IF NOT EXISTS eligibility_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS effort_score smallint CHECK (effort_score >= 0 AND effort_score <= 100),
ADD COLUMN IF NOT EXISTS upside_score smallint CHECK (upside_score >= 0 AND upside_score <= 100),
ADD COLUMN IF NOT EXISTS competition_intensity smallint CHECK (competition_intensity >= 0 AND competition_intensity <= 100),
ADD COLUMN IF NOT EXISTS legitimacy_score smallint CHECK (legitimacy_score >= 0 AND legitimacy_score <= 100),
ADD COLUMN IF NOT EXISTS action_plan text,
ADD COLUMN IF NOT EXISTS red_flags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS enriched_at timestamptz;
