-- ============================================================================
-- Add quality_score to sources and create source_quality_stats view
-- ============================================================================

ALTER TABLE public.sources 
ADD COLUMN IF NOT EXISTS quality_score float NOT NULL DEFAULT 1.0;

-- Drop view if it exists in case we are replacing it
DROP VIEW IF EXISTS public.source_quality_stats;

-- Create a view that aggregates metrics per source
CREATE OR REPLACE VIEW public.source_quality_stats AS
SELECT 
  s.id as source_id,
  s.name,
  count(DISTINCT o.id) as total_opps,
  count(DISTINCT so.opportunity_id) as total_saves,
  count(DISTINCT a.opportunity_id) as total_applies,
  count(DISTINCT f.opportunity_id) as total_dismisses
FROM public.sources s
LEFT JOIN public.opportunities o ON o.source_id = s.id
LEFT JOIN public.saved_opportunities so ON so.opportunity_id = o.id
LEFT JOIN public.applications a ON a.opportunity_id = o.id
LEFT JOIN public.opportunity_feedback f ON f.opportunity_id = o.id AND f.feedback = 'not_interested'
GROUP BY s.id, s.name;
