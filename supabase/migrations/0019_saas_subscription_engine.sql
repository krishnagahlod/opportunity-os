-- ============================================================================
-- Migration 0019: SaaS Subscription, Entitlement Engine & Admin Controls
-- ============================================================================

-- 1. Plans Catalog
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product text NOT NULL DEFAULT 'opportunity_os',
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  price_inr integer NOT NULL DEFAULT 0, -- In paise (e.g. 29900 = ₹299)
  duration_days integer, -- NULL for lifetime / permanent
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed Base Plans
INSERT INTO public.plans (product, slug, display_name, description, price_inr, duration_days)
VALUES
  ('opportunity_os', 'free', 'Free', 'Standard access for casual opportunity discovery', 0, NULL),
  ('opportunity_os', 'iitb_free', 'IIT Bombay Partner Access', 'Full platform access with fair-use limits for verified IITB students', 0, NULL),
  ('opportunity_os', 'pro_30d', 'Pro (30 Days)', 'Full opportunity intelligence and AI outreach for 1 month', 29900, 30),
  ('opportunity_os', 'pro_90d', 'Pro (90 Days)', 'Quarterly career launch pass with priority features', 79900, 90),
  ('opportunity_os', 'pro_365d', 'Pro (1 Year)', 'Annual unlimited opportunity discovery and AI outreach', 249900, 365),
  ('opportunity_os', 'lifetime', 'Lifetime Pro', 'Permanent premium access granted by administration or special promo', 0, NULL),
  ('opportunity_os', 'admin', 'Admin Tier', 'Superuser administrative system access', 0, NULL)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price_inr = EXCLUDED.price_inr,
  duration_days = EXCLUDED.duration_days;

-- 2. Entitlements Table (Source of truth for feature access)
CREATE TABLE IF NOT EXISTS public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product text NOT NULL DEFAULT 'opportunity_os',
  plan_key text NOT NULL REFERENCES public.plans(slug) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'scheduled', 'expired', 'revoked', 'suspended')),
  source text NOT NULL DEFAULT 'system' CHECK (source IN ('iitb', 'admin', 'razorpay', 'promo', 'topmate', 'system')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz, -- NULL indicates non-expiring (e.g. free, iitb_free, lifetime)
  granted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  external_reference text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entitlements_user_product ON public.entitlements (user_id, product, status);
CREATE INDEX IF NOT EXISTS idx_entitlements_expires ON public.entitlements (expires_at);

-- 3. Subscriptions / Passes (Drop legacy placeholder table if it exists without new schema)
DROP TABLE IF EXISTS public.subscriptions CASCADE;

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product text NOT NULL DEFAULT 'opportunity_os',
  plan_key text NOT NULL REFERENCES public.plans(slug) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'razorpay',
  provider_customer_id text,
  provider_order_id text,
  provider_payment_id text,
  provider_subscription_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('created', 'pending', 'active', 'cancelled', 'expired', 'refunded')),
  started_at timestamptz NOT NULL DEFAULT now(),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz,
  cancelled_at timestamptz,
  ended_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions (user_id, product);

-- 4. Payment Transactions Ledger
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product text NOT NULL DEFAULT 'opportunity_os',
  plan_key text NOT NULL,
  amount integer NOT NULL, -- In paise
  currency text NOT NULL DEFAULT 'INR',
  provider text NOT NULL DEFAULT 'razorpay',
  provider_order_id text NOT NULL,
  provider_payment_id text,
  provider_signature text,
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'pending', 'paid', 'failed', 'refunded', 'cancelled')),
  raw_reference jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payment_transactions (provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payment_transactions (user_id);

-- 5. Feature Limits Matrix
CREATE TABLE IF NOT EXISTS public.feature_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product text NOT NULL DEFAULT 'opportunity_os',
  plan_key text NOT NULL REFERENCES public.plans(slug) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  limit_value integer NOT NULL DEFAULT -1, -- -1 = unlimited
  period text NOT NULL DEFAULT 'monthly' CHECK (period IN ('daily', 'weekly', 'monthly', 'lifetime', 'forever')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product, plan_key, feature_key)
);

-- Seed Default Feature Limits
INSERT INTO public.feature_limits (product, plan_key, feature_key, enabled, limit_value, period)
VALUES
  -- Free Tier Limits
  ('opportunity_os', 'free', 'opportunity_feed_limit', true, 25, 'forever'),
  ('opportunity_os', 'free', 'search_query', true, 10, 'daily'),
  ('opportunity_os', 'free', 'ai_cold_outreach', true, 2, 'monthly'),
  ('opportunity_os', 'free', 'verified_contact_info', false, 0, 'forever'),
  ('opportunity_os', 'free', 'hot_leads_access', false, 0, 'forever'),
  ('opportunity_os', 'free', 'ai_action_plan', false, 0, 'forever'),
  ('opportunity_os', 'free', 'company_trust_scores', false, 0, 'forever'),
  ('opportunity_os', 'free', 'priority_instant_alerts', false, 0, 'forever'),
  
  -- IITB Free Tier (Generous Fair-Use)
  ('opportunity_os', 'iitb_free', 'opportunity_feed_limit', true, -1, 'forever'),
  ('opportunity_os', 'iitb_free', 'search_query', true, -1, 'daily'),
  ('opportunity_os', 'iitb_free', 'ai_cold_outreach', true, 50, 'monthly'),
  ('opportunity_os', 'iitb_free', 'verified_contact_info', true, 50, 'monthly'),
  ('opportunity_os', 'iitb_free', 'hot_leads_access', true, -1, 'forever'),
  ('opportunity_os', 'iitb_free', 'ai_action_plan', true, 50, 'monthly'),
  ('opportunity_os', 'iitb_free', 'company_trust_scores', true, -1, 'forever'),
  ('opportunity_os', 'iitb_free', 'priority_instant_alerts', true, -1, 'forever'),

  -- Pro Tier (30d / 90d / 365d / Lifetime)
  ('opportunity_os', 'pro_30d', 'opportunity_feed_limit', true, -1, 'forever'),
  ('opportunity_os', 'pro_30d', 'search_query', true, -1, 'daily'),
  ('opportunity_os', 'pro_30d', 'ai_cold_outreach', true, 50, 'monthly'),
  ('opportunity_os', 'pro_30d', 'verified_contact_info', true, 50, 'monthly'),
  ('opportunity_os', 'pro_30d', 'hot_leads_access', true, -1, 'forever'),
  ('opportunity_os', 'pro_30d', 'ai_action_plan', true, 50, 'monthly'),
  ('opportunity_os', 'pro_30d', 'company_trust_scores', true, -1, 'forever'),
  ('opportunity_os', 'pro_30d', 'priority_instant_alerts', true, -1, 'forever'),

  ('opportunity_os', 'pro_90d', 'opportunity_feed_limit', true, -1, 'forever'),
  ('opportunity_os', 'pro_90d', 'search_query', true, -1, 'daily'),
  ('opportunity_os', 'pro_90d', 'ai_cold_outreach', true, 50, 'monthly'),
  ('opportunity_os', 'pro_90d', 'verified_contact_info', true, 50, 'monthly'),
  ('opportunity_os', 'pro_90d', 'hot_leads_access', true, -1, 'forever'),
  ('opportunity_os', 'pro_90d', 'ai_action_plan', true, 50, 'monthly'),
  ('opportunity_os', 'pro_90d', 'company_trust_scores', true, -1, 'forever'),
  ('opportunity_os', 'pro_90d', 'priority_instant_alerts', true, -1, 'forever'),

  ('opportunity_os', 'pro_365d', 'opportunity_feed_limit', true, -1, 'forever'),
  ('opportunity_os', 'pro_365d', 'search_query', true, -1, 'daily'),
  ('opportunity_os', 'pro_365d', 'ai_cold_outreach', true, 100, 'monthly'),
  ('opportunity_os', 'pro_365d', 'verified_contact_info', true, 100, 'monthly'),
  ('opportunity_os', 'pro_365d', 'hot_leads_access', true, -1, 'forever'),
  ('opportunity_os', 'pro_365d', 'ai_action_plan', true, 100, 'monthly'),
  ('opportunity_os', 'pro_365d', 'company_trust_scores', true, -1, 'forever'),
  ('opportunity_os', 'pro_365d', 'priority_instant_alerts', true, -1, 'forever'),

  ('opportunity_os', 'lifetime', 'opportunity_feed_limit', true, -1, 'forever'),
  ('opportunity_os', 'lifetime', 'search_query', true, -1, 'daily'),
  ('opportunity_os', 'lifetime', 'ai_cold_outreach', true, 100, 'monthly'),
  ('opportunity_os', 'lifetime', 'verified_contact_info', true, 100, 'monthly'),
  ('opportunity_os', 'lifetime', 'hot_leads_access', true, -1, 'forever'),
  ('opportunity_os', 'lifetime', 'ai_action_plan', true, 100, 'monthly'),
  ('opportunity_os', 'lifetime', 'company_trust_scores', true, -1, 'forever'),
  ('opportunity_os', 'lifetime', 'priority_instant_alerts', true, -1, 'forever')
ON CONFLICT (product, plan_key, feature_key) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  limit_value = EXCLUDED.limit_value,
  period = EXCLUDED.period;

-- 6. Usage Events Aggregate Table
CREATE TABLE IF NOT EXISTS public.usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product text NOT NULL DEFAULT 'opportunity_os',
  feature_key text NOT NULL,
  period_key text NOT NULL, -- e.g. "2026-08-23" or "2026-08" or "lifetime"
  count integer NOT NULL DEFAULT 0,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product, feature_key, period_key)
);

CREATE INDEX IF NOT EXISTS idx_usage_user_feature ON public.usage_events (user_id, feature_key, period_key);

-- 7. User Sessions & Device Tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token_hash text NOT NULL,
  device_hash text,
  device_name text,
  user_agent text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions (user_id, revoked_at);

-- 8. Admin Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  product text NOT NULL DEFAULT 'opportunity_os',
  action text NOT NULL,
  before_state jsonb,
  after_state jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_target ON public.admin_audit_logs (target_user_id);

-- 9. Atomic Usage Consumption Procedure (Prevents Race Conditions)
CREATE OR REPLACE FUNCTION public.consume_feature_quota(
  p_user_id uuid,
  p_feature_key text,
  p_period_key text,
  p_cost integer DEFAULT 1,
  p_limit integer DEFAULT -1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_count integer := 0;
  v_new_count integer := 0;
  v_allowed boolean := false;
BEGIN
  -- Unlimited check
  IF p_limit = -1 THEN
    INSERT INTO public.usage_events (user_id, product, feature_key, period_key, count, last_used_at, updated_at)
    VALUES (p_user_id, 'opportunity_os', p_feature_key, p_period_key, p_cost, now(), now())
    ON CONFLICT (user_id, product, feature_key, period_key)
    DO UPDATE SET
      count = usage_events.count + p_cost,
      last_used_at = now(),
      updated_at = now()
    RETURNING count INTO v_new_count;

    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', -1,
      'limit', -1,
      'consumed', v_new_count
    );
  END IF;

  -- Lock row or insert initial record
  INSERT INTO public.usage_events (user_id, product, feature_key, period_key, count, last_used_at, updated_at)
  VALUES (p_user_id, 'opportunity_os', p_feature_key, p_period_key, 0, now(), now())
  ON CONFLICT (user_id, product, feature_key, period_key) DO NOTHING;

  -- Select with row lock
  SELECT count INTO v_current_count
  FROM public.usage_events
  WHERE user_id = p_user_id AND product = 'opportunity_os' AND feature_key = p_feature_key AND period_key = p_period_key
  FOR UPDATE;

  IF (v_current_count + p_cost) <= p_limit THEN
    UPDATE public.usage_events
    SET count = count + p_cost,
        last_used_at = now(),
        updated_at = now()
    WHERE user_id = p_user_id AND product = 'opportunity_os' AND feature_key = p_feature_key AND period_key = p_period_key
    RETURNING count INTO v_new_count;

    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', p_limit - v_new_count,
      'limit', p_limit,
      'consumed', v_new_count
    );
  ELSE
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', GREATEST(0, p_limit - v_current_count),
      'limit', p_limit,
      'consumed', v_current_count
    );
  END IF;
END;
$$;

-- 10. Auto-Provision Entitlement Trigger (Assigns iitb_free or free)
CREATE OR REPLACE FUNCTION public.handle_profile_entitlement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan text;
  v_source text;
BEGIN
  -- Determine initial plan
  IF NEW.email IS NOT NULL AND NEW.email ILIKE '%@iitb.ac.in' THEN
    v_plan := 'iitb_free';
    v_source := 'iitb';
  ELSE
    v_plan := 'free';
    v_source := 'system';
  END IF;

  -- Insert if not already assigned
  IF NOT EXISTS (
    SELECT 1 FROM public.entitlements
    WHERE user_id = NEW.id AND product = 'opportunity_os' AND status = 'active'
  ) THEN
    INSERT INTO public.entitlements (user_id, product, plan_key, status, source, starts_at, expires_at)
    VALUES (NEW.id, 'opportunity_os', v_plan, 'active', v_source, now(), NULL);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_profile_entitlement ON public.profiles;
CREATE TRIGGER tr_profile_entitlement
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_entitlement();

-- 11. Backfill Existing Profiles with Default Entitlements
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, email FROM public.profiles LOOP
    IF r.email IS NOT NULL AND r.email ILIKE '%@iitb.ac.in' THEN
      INSERT INTO public.entitlements (user_id, product, plan_key, status, source, starts_at, expires_at)
      VALUES (r.id, 'opportunity_os', 'iitb_free', 'active', 'iitb', now(), NULL)
      ON CONFLICT DO NOTHING;
    ELSE
      INSERT INTO public.entitlements (user_id, product, plan_key, status, source, starts_at, expires_at)
      VALUES (r.id, 'opportunity_os', 'free', 'active', 'system', now(), NULL)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- 12. Row Level Security (RLS) Policies
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plans_read_all" ON public.plans;
CREATE POLICY "plans_read_all" ON public.plans FOR SELECT USING (true);
DROP POLICY IF EXISTS "plans_admin_write" ON public.plans;
CREATE POLICY "plans_admin_write" ON public.plans FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "entitlements_self_read" ON public.entitlements;
CREATE POLICY "entitlements_self_read" ON public.entitlements FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "entitlements_admin_all" ON public.entitlements;
CREATE POLICY "entitlements_admin_all" ON public.entitlements FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_self_read" ON public.subscriptions;
CREATE POLICY "subscriptions_self_read" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "subscriptions_admin_all" ON public.subscriptions;
CREATE POLICY "subscriptions_admin_all" ON public.subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_self_read" ON public.payment_transactions;
CREATE POLICY "payments_self_read" ON public.payment_transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "payments_admin_all" ON public.payment_transactions;
CREATE POLICY "payments_admin_all" ON public.payment_transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

ALTER TABLE public.feature_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feature_limits_read_all" ON public.feature_limits;
CREATE POLICY "feature_limits_read_all" ON public.feature_limits FOR SELECT USING (true);
DROP POLICY IF EXISTS "feature_limits_admin_all" ON public.feature_limits;
CREATE POLICY "feature_limits_admin_all" ON public.feature_limits FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usage_self_read" ON public.usage_events;
CREATE POLICY "usage_self_read" ON public.usage_events FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "usage_admin_all" ON public.usage_events;
CREATE POLICY "usage_admin_all" ON public.usage_events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sessions_self_all" ON public.user_sessions;
CREATE POLICY "sessions_self_all" ON public.user_sessions FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "sessions_admin_all" ON public.user_sessions;
CREATE POLICY "sessions_admin_all" ON public.user_sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_admin_all" ON public.admin_audit_logs;
CREATE POLICY "audit_admin_all" ON public.admin_audit_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
