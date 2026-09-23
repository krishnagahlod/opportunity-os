-- ==============================================================================
-- FIX: Infinite recursion detected in policy for relation "profiles"
-- Migration: 0021_fix_profiles_rls_recursion.sql
-- Apply via: Supabase Dashboard → SQL Editor → Run
-- ==============================================================================

-- 1. Ensure public.is_admin() helper exists as a SECURITY DEFINER function.
--    Because SECURITY DEFINER executes with the privileges of the function owner (postgres),
--    it BYPASSES Row Level Security on public.profiles and NEVER triggers recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- 2. Drop the recursive and legacy policies on public.profiles
DROP POLICY IF EXISTS "profiles_admin_manage" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_manage" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles self read" ON public.profiles;
DROP POLICY IF EXISTS "profiles self update" ON public.profiles;
DROP POLICY IF EXISTS "profiles admin read all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- 3. Create clean, non-recursive policies on public.profiles
-- Users can read their own profile; Admins can read all profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT
USING (auth.uid() = id OR public.is_admin());

-- Users can insert their own profile (matching auth.uid())
CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile; Admins can update any profile
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

-- Users can delete their own profile; Admins can delete any profile
CREATE POLICY "profiles_delete_policy" ON public.profiles
FOR DELETE
USING (auth.uid() = id OR public.is_admin());

-- 4. Replace any inline subqueries on profiles in other tables with public.is_admin()
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'source_connectors') THEN
    DROP POLICY IF EXISTS "source_connectors admin write" ON public.source_connectors;
    CREATE POLICY "source_connectors admin write" ON public.source_connectors
      FOR ALL USING (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'source_quality_daily') THEN
    DROP POLICY IF EXISTS "source_quality_daily admin write" ON public.source_quality_daily;
    CREATE POLICY "source_quality_daily admin write" ON public.source_quality_daily
      FOR ALL USING (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'plans') THEN
    DROP POLICY IF EXISTS "plans_admin_write" ON public.plans;
    CREATE POLICY "plans_admin_write" ON public.plans
      FOR ALL USING (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'entitlements') THEN
    DROP POLICY IF EXISTS "entitlements_admin_all" ON public.entitlements;
    CREATE POLICY "entitlements_admin_all" ON public.entitlements
      FOR ALL USING (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
    DROP POLICY IF EXISTS "subscriptions_admin_all" ON public.subscriptions;
    CREATE POLICY "subscriptions_admin_all" ON public.subscriptions
      FOR ALL USING (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_transactions') THEN
    DROP POLICY IF EXISTS "payments_admin_all" ON public.payment_transactions;
    CREATE POLICY "payments_admin_all" ON public.payment_transactions
      FOR ALL USING (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'feature_limits') THEN
    DROP POLICY IF EXISTS "feature_limits_admin_all" ON public.feature_limits;
    CREATE POLICY "feature_limits_admin_all" ON public.feature_limits
      FOR ALL USING (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usage_events') THEN
    DROP POLICY IF EXISTS "usage_admin_all" ON public.usage_events;
    CREATE POLICY "usage_admin_all" ON public.usage_events
      FOR ALL USING (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_sessions') THEN
    DROP POLICY IF EXISTS "sessions_admin_all" ON public.user_sessions;
    CREATE POLICY "sessions_admin_all" ON public.user_sessions
      FOR ALL USING (public.is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_audit_logs') THEN
    DROP POLICY IF EXISTS "audit_admin_all" ON public.admin_audit_logs;
    CREATE POLICY "audit_admin_all" ON public.admin_audit_logs
      FOR ALL USING (public.is_admin());
  END IF;
END $$;
