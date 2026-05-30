-- Migration 0010: Enrichment Fields

alter table public.opportunities
add column if not exists role_seniority text check (role_seniority in (
  'student',
  'intern',
  'entry_level',
  'early_career',
  'mid_level',
  'senior',
  'unknown'
)),
add column if not exists eligibility_tags text[] not null default '{}',
add column if not exists effort_score int check (effort_score between 0 and 100),
add column if not exists upside_score int check (upside_score between 0 and 100),
add column if not exists competition_intensity int check (competition_intensity between 0 and 100),
add column if not exists legitimacy_score int check (legitimacy_score between 0 and 100),
add column if not exists action_plan text,
add column if not exists red_flags text[] not null default '{}',
add column if not exists enrichment_version int not null default 1,
add column if not exists enriched_at timestamptz;
