-- ==============================================================================
-- OPPORTUNITY OS: MASTER ROW-LEVEL SECURITY & STORAGE DEFENSE-IN-DEPTH MIGRATION
-- Migration: 0020_master_security_hardening.sql
-- Apply via: Supabase Dashboard → SQL Editor → Run
-- ==============================================================================

-- 1. ENABLE ROW LEVEL SECURITY ACROSS ALL APPLICATION & PLATFORM TABLES
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.saved_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.opportunity_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.feature_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.raw_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ingestion_logs ENABLE ROW LEVEL SECURITY;

-- 2. USER ISOLATION POLICIES (Users can only read and mutate their own data)

-- Profiles: Users can read and update their own profile; admin has full access
DROP POLICY IF EXISTS "profiles_self_manage" ON public.profiles;
CREATE POLICY "profiles_self_manage" ON public.profiles
FOR ALL USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin_manage" ON public.profiles;
CREATE POLICY "profiles_admin_manage" ON public.profiles
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Saved Opportunities
DROP POLICY IF EXISTS "saved_opps_self_manage" ON public.saved_opportunities;
CREATE POLICY "saved_opps_self_manage" ON public.saved_opportunities
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Job Applications Tracker
DROP POLICY IF EXISTS "applications_self_manage" ON public.applications;
CREATE POLICY "applications_self_manage" ON public.applications
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Opportunity Feedback
DROP POLICY IF EXISTS "feedback_self_manage" ON public.opportunity_feedback;
CREATE POLICY "feedback_self_manage" ON public.opportunity_feedback
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Active User Device Sessions
DROP POLICY IF EXISTS "sessions_self_manage" ON public.user_sessions;
CREATE POLICY "sessions_self_manage" ON public.user_sessions
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. BILLING, ENTITLEMENTS & PASSES (READ-ONLY FOR CLIENTS; MUTATIONS RESTRICTED TO SERVER)

-- Entitlements: Users can read their own entitlements; cannot insert/update directly
DROP POLICY IF EXISTS "entitlements_user_read" ON public.entitlements;
CREATE POLICY "entitlements_user_read" ON public.entitlements
FOR SELECT USING (auth.uid() = user_id);

-- Subscriptions: Users can read their own subscriptions
DROP POLICY IF EXISTS "subscriptions_user_read" ON public.subscriptions;
CREATE POLICY "subscriptions_user_read" ON public.subscriptions
FOR SELECT USING (auth.uid() = user_id);

-- Payment Transactions: Users can read their own transactions
DROP POLICY IF EXISTS "payments_user_read" ON public.payment_transactions;
CREATE POLICY "payments_user_read" ON public.payment_transactions
FOR SELECT USING (auth.uid() = user_id);

-- Plans & Limits: Public read-only catalog
DROP POLICY IF EXISTS "plans_public_read" ON public.plans;
CREATE POLICY "plans_public_read" ON public.plans
FOR SELECT USING (true);

DROP POLICY IF EXISTS "limits_public_read" ON public.feature_limits;
CREATE POLICY "limits_public_read" ON public.feature_limits
FOR SELECT USING (true);

-- 4. PUBLIC DIRECTORY READ ACCESS (Opportunities & Verified Companies)
DROP POLICY IF EXISTS "opportunities_public_read" ON public.opportunities;
CREATE POLICY "opportunities_public_read" ON public.opportunities
FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "companies_public_read" ON public.companies;
CREATE POLICY "companies_public_read" ON public.companies
FOR SELECT USING (true);

-- 5. REVOKE DIRECT CLIENT MUTATIONS ON SENSITIVE TABLES
-- Revoke INSERT, UPDATE, DELETE from anon and authenticated roles on billing tables.
-- All entitlement activations and payment recordings must flow through the verified backend API.
REVOKE INSERT, UPDATE, DELETE ON public.entitlements FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.subscriptions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.payment_transactions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.plans FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.feature_limits FROM anon, authenticated;

-- Restrict internal pipelines and audit logs from browser client access completely
REVOKE ALL ON public.admin_audit_logs FROM anon, authenticated;
REVOKE ALL ON public.raw_opportunities FROM anon, authenticated;
REVOKE ALL ON public.ingestion_logs FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.sources FROM anon, authenticated;

-- 6. SUPABASE STORAGE BUCKET ROW-LEVEL SECURITY
-- Ensure resumes bucket is strictly private
UPDATE storage.buckets SET public = false WHERE id = 'resumes';

-- Enforce per-user path isolation: <user_id>/<filename>.pdf
DROP POLICY IF EXISTS "resumes_user_read_own" ON storage.objects;
CREATE POLICY "resumes_user_read_own" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "resumes_user_insert_own" ON storage.objects;
CREATE POLICY "resumes_user_insert_own" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "resumes_user_delete_own" ON storage.objects;
CREATE POLICY "resumes_user_delete_own" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
