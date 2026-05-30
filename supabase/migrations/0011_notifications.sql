-- Migration 0011: Premium Target Alerts

-- Table: target_alerts (Monetized feature for instant alerts)
create table public.target_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  alert_name text not null,
  target_companies text[] not null default '{}',
  target_roles text[] not null default '{}',
  min_compensation numeric,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table: subscriptions (Simple tracking for now)
create table public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade not null,
  plan text not null check (plan in ('free', 'pro', 'campus')),
  status text not null check (status in ('active', 'past_due', 'canceled', 'trialing')),
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS Policies
alter table public.target_alerts enable row level security;
create policy "target_alerts self all" on public.target_alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.subscriptions enable row level security;
create policy "subscriptions self read" on public.subscriptions for select using (auth.uid() = user_id);
create policy "subscriptions admin all" on public.subscriptions for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Set all existing users to free plan
insert into public.subscriptions (user_id, plan, status)
select id, 'free', 'active' from public.profiles
on conflict (user_id) do nothing;
