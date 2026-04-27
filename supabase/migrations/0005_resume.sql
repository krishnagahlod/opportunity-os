-- ============================================================================
-- Phase 7.x — Resume upload + AI skill extraction
-- 1. Adds resume_skills + resume_uploaded_at to profiles
--    (resume_url already exists from migration 0001)
-- 2. Creates a private `resumes` Storage bucket with per-user RLS
--
-- Apply via: Supabase Dashboard → SQL Editor → New query → paste → Run
-- ============================================================================

-- 1) Profile columns ----------------------------------------------------------

alter table public.profiles
  add column if not exists resume_skills text[] default '{}';

alter table public.profiles
  add column if not exists resume_uploaded_at timestamptz;

-- 2) Storage bucket -----------------------------------------------------------
-- Private bucket — users can read/write their own files only.
-- File path convention: <user_id>/<uuid>.pdf

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do update set public = false;

-- RLS: object owner is identified by the first path segment matching auth.uid().
-- Storage's `storage.foldername(name)` returns the path as a text array.

drop policy if exists "resumes user read own" on storage.objects;
create policy "resumes user read own"
  on storage.objects for select
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "resumes user insert own" on storage.objects;
create policy "resumes user insert own"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "resumes user update own" on storage.objects;
create policy "resumes user update own"
  on storage.objects for update
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "resumes user delete own" on storage.objects;
create policy "resumes user delete own"
  on storage.objects for delete
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
