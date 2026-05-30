-- Migration 0009: Source Quality and Feedback

-- Table: source_connectors
create table public.source_connectors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  connector_type text not null check (connector_type in (
    'unstop',
    'devpost',
    'greenhouse',
    'ashby',
    'lever',
    'rss',
    'html',
    'manual',
    'user_submission',
    'search_api'
  )),
  url text,
  config jsonb not null default '{}',
  target_personas text[] not null default '{}',
  categories text[] not null default '{}',
  country_focus text[] not null default '{}',
  enabled boolean not null default true,
  trust_tier int not null default 2 check (trust_tier between 1 and 5),
  fetch_frequency_minutes int not null default 720,
  last_run_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table: source_quality_daily
create table public.source_quality_daily (
  source_connector_id uuid references public.source_connectors(id) on delete cascade,
  day date not null,
  fetched_count int not null default 0,
  inserted_count int not null default 0,
  duplicate_count int not null default 0,
  expired_count int not null default 0,
  low_confidence_count int not null default 0,
  hidden_count int not null default 0,
  save_count int not null default 0,
  apply_count int not null default 0,
  dismiss_count int not null default 0,
  avg_score numeric(5,2),
  avg_confidence numeric(4,3),
  primary key (source_connector_id, day)
);

-- Table: opportunity_feedback
create table public.opportunity_feedback (
  user_id uuid references public.profiles(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  feedback text not null check (feedback in (
    'not_interested',
    'bad_match',
    'already_seen',
    'ineligible',
    'low_quality',
    'broken_link',
    'great_match'
  )),
  created_at timestamptz not null default now(),
  primary key (user_id, opportunity_id, feedback)
);

-- Alter profiles for onboarding
alter table public.profiles
add column if not exists stage text,
add column if not exists opportunity_goals text[] not null default '{}',
add column if not exists avoid_tags text[] not null default '{}',
add column if not exists target_companies text[] not null default '{}',
add column if not exists min_compensation text;

-- RLS Policies
alter table public.source_connectors enable row level security;
create policy "source_connectors authenticated read" on public.source_connectors for select to authenticated using (true);
create policy "source_connectors admin write" on public.source_connectors for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

alter table public.source_quality_daily enable row level security;
create policy "source_quality_daily authenticated read" on public.source_quality_daily for select to authenticated using (true);
create policy "source_quality_daily admin write" on public.source_quality_daily for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

alter table public.opportunity_feedback enable row level security;
create policy "feedback self all" on public.opportunity_feedback for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
