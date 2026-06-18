-- ============================================================================
-- Add resume_text to profiles and create resume_matches table
-- ============================================================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS resume_text text;

CREATE TABLE IF NOT EXISTS public.resume_matches (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  match_score integer NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  strengths text[] NOT NULL DEFAULT '{}',
  weaknesses text[] NOT NULL DEFAULT '{}',
  analyzed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, opportunity_id)
);

-- Enable RLS on resume_matches
ALTER TABLE public.resume_matches ENABLE ROW LEVEL SECURITY;

-- Users can read their own matches
CREATE POLICY "Users can read own resume matches" ON public.resume_matches
  FOR SELECT USING (auth.uid() = user_id);

-- Only admin/service role can insert/update matches (since it's done via API)
-- No public insert policy needed since we use service_role for AI insertion.
