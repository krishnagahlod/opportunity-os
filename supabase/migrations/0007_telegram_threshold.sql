-- ============================================================================
-- Phase 10.1 — Per-user Telegram score threshold
-- Lets users tune signal-to-noise: only Telegram-ping me for opportunities
-- scoring at least N. Email digest stays inclusive — different economics.
--
-- Apply via: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- ============================================================================

alter table public.profiles
  add column if not exists telegram_min_score int not null default 70
    check (telegram_min_score between 0 and 100);
