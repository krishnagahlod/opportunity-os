-- ============================================================================
-- Fix: "infinite recursion detected in policy for relation profiles"
-- Root cause: the admin-check policies on profiles/sources/opportunities
-- ran `select ... from public.profiles ...` inside the policy body, which
-- re-triggered RLS evaluation on `profiles` → infinite loop.
--
-- Fix: move the admin check into a SECURITY DEFINER function. SECURITY DEFINER
-- runs with the function owner's privileges and bypasses RLS, so the subquery
-- inside the function does NOT re-enter policy evaluation.
-- ============================================================================

-- 1) Admin-check helper, runs as owner (bypasses RLS on the inner select)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- 2) profiles: collapse self-read + admin-read-all into one non-recursive policy
drop policy if exists "profiles self read"       on public.profiles;
drop policy if exists "profiles admin read all"  on public.profiles;

create policy "profiles read"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- (self-update policy was fine — it doesn't touch profiles in its body)

-- 3) sources: replace recursive admin-write with is_admin() call
drop policy if exists "sources admin write" on public.sources;
create policy "sources admin write"
  on public.sources for all
  using (public.is_admin())
  with check (public.is_admin());

-- 4) opportunities: replace recursive admin-write with is_admin() call
drop policy if exists "opportunities admin write" on public.opportunities;
create policy "opportunities admin write"
  on public.opportunities for all
  using (public.is_admin())
  with check (public.is_admin());
