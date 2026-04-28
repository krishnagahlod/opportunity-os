-- ============================================================================
-- Phase 10.2 — Gap analysis on the detail page
-- Adds `required_skills text[]` to opportunities so we can extract what the
-- listing explicitly requires at ingest time and surface skills the user is
-- missing on the detail page.
--
-- Apply via: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- ============================================================================

alter table public.opportunities
  add column if not exists required_skills text[] not null default '{}';

-- No backfill needed — existing rows get '{}' and the gap section will
-- simply not render for them. New ingestion runs populate going forward.
