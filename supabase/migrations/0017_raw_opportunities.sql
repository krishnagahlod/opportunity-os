-- Migration: Create raw_opportunities table for decoupled ingestion
-- Description: Acts as a staging area for incoming scraper listings before AI processing

CREATE TABLE IF NOT EXISTS raw_opportunities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id uuid REFERENCES sources(id) ON DELETE CASCADE,
  source_url text NOT NULL UNIQUE,
  raw_data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'processed', 'failed', 'duplicate'
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

-- Index for the processor to quickly find pending rows
CREATE INDEX IF NOT EXISTS idx_raw_opportunities_status ON raw_opportunities(status);
