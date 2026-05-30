-- Migration 0012: Deeper Onboarding Intent

alter table public.profiles
add column if not exists stage text,
add column if not exists opportunity_goals text[] not null default '{}',
add column if not exists avoid_tags text[] not null default '{}',
add column if not exists target_companies text[] not null default '{}',
add column if not exists min_compensation text;
