-- ============================================================================
-- Phase 8.x — Server-side full-text search across opportunities
--
-- Today's dashboard pulls 120 rows and filters in-memory, so a search for
-- "Goldman" or "ML intern" misses everything past row 120. This migration
-- adds a generated `search_tsv` column + GIN index so /api/search can hit
-- the entire `opportunities` table cheaply.
--
-- The vector covers the same fields the relevance score and match-pill UI
-- already read: title (heaviest weight), organization, summary, tags,
-- category. Postgres `english` config handles stemming so "interns" finds
-- "internship" and "developing" finds "developer".
--
-- Apply via: Supabase Dashboard → SQL Editor → New query → paste → Run
-- ============================================================================

alter table public.opportunities
  add column if not exists search_tsv tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')),                'A') ||
    setweight(to_tsvector('english', coalesce(organization, '')),         'B') ||
    setweight(to_tsvector('english', coalesce(summary, '')),              'C') ||
    setweight(to_tsvector('english', coalesce(category, '')),             'D') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C')
  ) stored;

create index if not exists opportunities_search_tsv_idx
  on public.opportunities using gin (search_tsv);
