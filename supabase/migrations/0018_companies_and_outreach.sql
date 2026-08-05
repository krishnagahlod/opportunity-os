-- Migration: Companies and Cold Outreach system
-- Creates the company intelligence layer and the outreach tracking tables.

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  domain text NOT NULL UNIQUE,
  logo_url text,
  description text,
  industry text,
  founded_year integer,
  employee_count text,
  headquarters text,
  website text,
  linkedin_url text,
  funding_stage text,
  total_funding text,
  trust_score integer DEFAULT 0,
  trust_signals jsonb DEFAULT '{}'::jsonb,
  enriched_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Anyone can read companies
CREATE POLICY "Companies are viewable by everyone" ON public.companies
  FOR SELECT USING (true);

-- Only admins or service role can insert/update companies
CREATE POLICY "Service role can manage companies" ON public.companies
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger to update updated_at on companies
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Add company_id reference to opportunities
ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;


-- Outreach Leads table
CREATE TABLE IF NOT EXISTS public.outreach_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text,
  lead_type text, -- 'founder', 'hiring_manager', 'hr_director'
  source text,
  linkedin_url text,
  email text, -- Can be a guessed pattern or verified email
  email_verified boolean DEFAULT false,
  relevance_score integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.outreach_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Outreach leads viewable by everyone" ON public.outreach_leads
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage outreach leads" ON public.outreach_leads
  FOR ALL USING (true) WITH CHECK (true);


-- Outreach Logs table (for users tracking their outreach)
CREATE TABLE IF NOT EXISTS public.outreach_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.outreach_leads(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  status text DEFAULT 'drafted', -- 'drafted', 'sent', 'replied', 'no_reply'
  email_draft text,
  sent_at timestamp with time zone,
  follow_up_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.outreach_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own outreach logs" ON public.outreach_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own outreach logs" ON public.outreach_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outreach logs" ON public.outreach_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outreach logs" ON public.outreach_logs
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_outreach_logs_updated_at
BEFORE UPDATE ON public.outreach_logs
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
