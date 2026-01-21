-- Migration: Create Portfolio Valuations Table
-- Description: Track property valuations over time from multiple sources
-- Phase: Sprint 2 - Portfolio & Creative Finance

-- ============================================================================
-- CREATE PORTFOLIO VALUATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS re_portfolio_valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES re_properties(id) ON DELETE CASCADE,
  valuation_date DATE NOT NULL,
  estimated_value NUMERIC(12,2) NOT NULL,
  source TEXT CHECK(source IN ('zillow', 'manual', 'appraisal', 'redfin', 'rentcast', 'cma', 'tax_assessment', 'other')),
  notes TEXT,
  metadata JSONB DEFAULT '{}', -- Store additional API response data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_portfolio_valuations_property ON re_portfolio_valuations(property_id);
CREATE INDEX idx_portfolio_valuations_date ON re_portfolio_valuations(valuation_date DESC);
CREATE INDEX idx_portfolio_valuations_source ON re_portfolio_valuations(source);

-- Composite index for latest valuation queries
CREATE INDEX idx_portfolio_valuations_property_date ON re_portfolio_valuations(property_id, valuation_date DESC);

-- UNIQUE constraint: One valuation per property per date per source
CREATE UNIQUE INDEX idx_portfolio_valuations_unique
  ON re_portfolio_valuations(property_id, valuation_date, source);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE re_portfolio_valuations ENABLE ROW LEVEL SECURITY;

-- Users can view valuations for their own properties
CREATE POLICY "Users can view valuations for their properties"
  ON re_portfolio_valuations FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM re_properties WHERE user_id = auth.uid()
    )
  );

-- Users can insert valuations for their own properties
CREATE POLICY "Users can insert valuations for their properties"
  ON re_portfolio_valuations FOR INSERT
  WITH CHECK (
    property_id IN (
      SELECT id FROM re_properties WHERE user_id = auth.uid()
    )
  );

-- Users can update valuations for their own properties
CREATE POLICY "Users can update valuations for their properties"
  ON re_portfolio_valuations FOR UPDATE
  USING (
    property_id IN (
      SELECT id FROM re_properties WHERE user_id = auth.uid()
    )
  );

-- Users can delete valuations for their own properties
CREATE POLICY "Users can delete valuations for their properties"
  ON re_portfolio_valuations FOR DELETE
  USING (
    property_id IN (
      SELECT id FROM re_properties WHERE user_id = auth.uid()
    )
  );

-- Admins can view all valuations
CREATE POLICY "Admins can view all valuations"
  ON re_portfolio_valuations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE re_portfolio_valuations IS 'Track property valuations over time from multiple sources (Zillow, manual appraisals, etc.)';
COMMENT ON COLUMN re_portfolio_valuations.source IS 'Source of valuation: zillow, manual, appraisal, redfin, rentcast, cma, tax_assessment, other';
COMMENT ON COLUMN re_portfolio_valuations.notes IS 'Optional notes about this valuation';
COMMENT ON COLUMN re_portfolio_valuations.metadata IS 'JSONB field for storing additional data from API responses';
COMMENT ON COLUMN re_portfolio_valuations.estimated_value IS 'Estimated property value in dollars';

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_portfolio_valuations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_portfolio_valuations_updated_at
  BEFORE UPDATE ON re_portfolio_valuations
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_valuations_updated_at();

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Created portfolio valuations table for tracking property values over time',
  jsonb_build_object(
    'migration', '20260117_portfolio_valuations',
    'table', 're_portfolio_valuations',
    'indexes', 5,
    'rls_policies', 5,
    'supported_sources', ARRAY['zillow', 'manual', 'appraisal', 'redfin', 'rentcast', 'other']
  )
);
