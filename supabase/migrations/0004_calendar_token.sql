-- ============================================================================
-- Phase 7.x — Calendar feed
-- Adds a per-user random token used to authenticate subscribers to the
-- /api/calendar.ics feed. The token is the only credential — anyone with the
-- URL gets read-only access to that user's saved + applied deadlines, mirroring
-- how Google Calendar / Apple Calendar private subscription URLs work.
--
-- Apply via: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- ============================================================================

alter table public.profiles
  add column if not exists calendar_token uuid;

create unique index if not exists profiles_calendar_token_key
  on public.profiles (calendar_token)
  where calendar_token is not null;
