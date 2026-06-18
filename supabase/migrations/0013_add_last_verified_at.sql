-- ============================================================================
-- Add last_verified_at to opportunities for liveness tracking
-- ============================================================================

ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;

CREATE INDEX IF NOT EXISTS opportunities_last_verified_at_idx 
ON public.opportunities(last_verified_at ASC NULLS FIRST);
