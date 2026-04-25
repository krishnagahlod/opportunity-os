-- ============================================================================
-- Phase 2.5 — Pipeline optimization
-- 1. Add `extraction_confidence` to opportunities (AI's self-rated quality)
-- 2. Create `ingestion_logs` table for per-item observability
-- 3. Seed the HN Jobs RSS source so n8n can attach properly
--
-- Apply via: Supabase Dashboard → SQL Editor → New query → paste → Run
-- ============================================================================

-- 1) extraction_confidence on opportunities
alter table public.opportunities
  add column if not exists extraction_confidence numeric(3,2)
    check (extraction_confidence is null
           or (extraction_confidence >= 0 and extraction_confidence <= 1));

-- 2) ingestion_logs table
create table if not exists public.ingestion_logs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources(id) on delete set null,
  -- Denormalized so we can log even when source_id is unknown / lookup failed
  source_name text,
  source_url text,
  status text not null check (status in (
    'extracted',
    'upserted',
    'skipped_duplicate',
    'skipped_filtered',
    'failed'
  )),
  reason text,                                 -- error message or filter reason
  provider text check (provider in ('gemini','groq')),
  tokens_used int,                             -- heuristic estimate
  duration_ms int,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ingestion_logs_created_at_idx
  on public.ingestion_logs (created_at desc);
create index if not exists ingestion_logs_source_created_idx
  on public.ingestion_logs (source_id, created_at desc);
create index if not exists ingestion_logs_status_idx
  on public.ingestion_logs (status);

alter table public.ingestion_logs enable row level security;

-- Admin-only read; writes go through service role (bypasses RLS).
-- Uses public.is_admin() helper from migration 0002.
drop policy if exists "ingestion_logs admin read" on public.ingestion_logs;
create policy "ingestion_logs admin read"
  on public.ingestion_logs for select
  using (public.is_admin());

-- 3) Seed the HN Jobs RSS source so n8n's source_name lookup succeeds
insert into public.sources (name, kind, url, enabled)
values ('HN Jobs RSS', 'rss', 'https://hnrss.org/jobs', true)
on conflict do nothing;
