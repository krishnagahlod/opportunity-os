-- ============================================================================
-- Opportunity OS — initial schema + RLS
-- Apply via: Supabase Dashboard → SQL Editor → New query → paste → Run
-- ============================================================================

-- Extensions (gen_random_uuid() lives in pgcrypto)
create extension if not exists pgcrypto;

-- ============================================================================
-- TABLE: profiles (1:1 with auth.users)
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  college text,
  graduation_year int,
  interests text[] default '{}',          -- ['consulting','PM','tech',...]
  skills text[] default '{}',
  preferred_location text,
  remote_preference text check (remote_preference in ('remote','onsite','hybrid','any')),
  time_commitment text check (time_commitment in ('full-time','part-time','internship','any')),
  resume_url text,
  telegram_chat_id text,
  role text not null default 'user' check (role in ('user','admin')),
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- TABLE: sources (ingestion sources, managed by admin)
-- ============================================================================
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('scraper','rss','manual','user_submission')),
  url text,
  last_run_at timestamptz,
  last_status text check (last_status in ('ok','error')),
  last_error text,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- TABLE: opportunities (global pool, shared across users)
-- ============================================================================
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text not null,
  category text not null check (category in (
    'internship','fulltime','case_competition','hackathon',
    'fellowship','scholarship','conference','workshop','bootcamp',
    'networking','campus_ambassador','remote_gig','other'
  )),
  description text,
  summary text,                     -- AI-generated 2-sentence
  tags text[] default '{}',         -- AI-generated
  deadline timestamptz,
  eligibility text,
  location text,
  compensation text,
  is_remote boolean default false,
  apply_url text,
  source_url text unique,           -- natural dedup key
  source_id uuid references public.sources(id) on delete set null,
  difficulty text check (difficulty in ('low','medium','high')),
  estimated_value_score int check (estimated_value_score between 0 and 100),
  date_added timestamptz not null default now(),
  featured boolean not null default false,
  status text not null default 'active' check (status in ('active','expired','spam','pending'))
);

-- Helpful indexes for feed queries
create index if not exists opportunities_status_deadline_idx
  on public.opportunities (status, deadline);
create index if not exists opportunities_category_idx
  on public.opportunities (category);
create index if not exists opportunities_date_added_idx
  on public.opportunities (date_added desc);
create index if not exists opportunities_tags_gin_idx
  on public.opportunities using gin (tags);

-- ============================================================================
-- TABLE: saved_opportunities (per-user bookmarks)
-- ============================================================================
create table if not exists public.saved_opportunities (
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

-- ============================================================================
-- TABLE: applications (per-user application tracker)
-- ============================================================================
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  status text not null check (status in ('saved','applied','interviewing','rejected','won')),
  notes text,
  updated_at timestamptz not null default now(),
  unique (user_id, opportunity_id)
);

create index if not exists applications_user_status_idx
  on public.applications (user_id, status);

-- ============================================================================
-- TABLE: scores (cached per-user AI relevance scores)
-- ============================================================================
create table if not exists public.scores (
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  score int not null check (score between 0 and 100),
  breakdown jsonb,
  why text,
  computed_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

create index if not exists scores_user_score_idx
  on public.scores (user_id, score desc);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles             enable row level security;
alter table public.sources              enable row level security;
alter table public.opportunities        enable row level security;
alter table public.saved_opportunities  enable row level security;
alter table public.applications         enable row level security;
alter table public.scores               enable row level security;

-- --- profiles ---
drop policy if exists "profiles self read"     on public.profiles;
drop policy if exists "profiles self update"   on public.profiles;
drop policy if exists "profiles admin read all" on public.profiles;

create policy "profiles self read"
  on public.profiles for select using (auth.uid() = id);

create policy "profiles self update"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Admins can read all profiles (needed for admin panel)
create policy "profiles admin read all"
  on public.profiles for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- --- sources ---
-- All authenticated users can read; only admins can write.
drop policy if exists "sources authenticated read" on public.sources;
drop policy if exists "sources admin write"        on public.sources;

create policy "sources authenticated read"
  on public.sources for select to authenticated using (true);

create policy "sources admin write"
  on public.sources for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- --- opportunities ---
-- All authenticated users can read active opportunities; only admins can write.
-- (Service role used by n8n bypasses RLS entirely.)
drop policy if exists "opportunities authenticated read" on public.opportunities;
drop policy if exists "opportunities admin write"        on public.opportunities;

create policy "opportunities authenticated read"
  on public.opportunities for select to authenticated using (status in ('active','pending'));

create policy "opportunities admin write"
  on public.opportunities for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- --- saved_opportunities ---
drop policy if exists "saved self all" on public.saved_opportunities;
create policy "saved self all"
  on public.saved_opportunities for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- --- applications ---
drop policy if exists "applications self all" on public.applications;
create policy "applications self all"
  on public.applications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- --- scores ---
drop policy if exists "scores self read"   on public.scores;
drop policy if exists "scores self write"  on public.scores;
create policy "scores self read"
  on public.scores for select using (auth.uid() = user_id);
-- Writes happen via service role from /api/ai/score route; no user-facing insert policy needed.
create policy "scores self write"
  on public.scores for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- Seed: one default manual source so admin can attach manually-added opps
-- ============================================================================
insert into public.sources (name, kind, enabled)
values ('Manual Admin Entry', 'manual', true)
on conflict do nothing;
