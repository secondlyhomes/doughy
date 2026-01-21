-- Migration: Create re_portfolio_entries table
-- Allows users to manually add properties to their portfolio without going through deal workflow

-- Create the portfolio entries table
CREATE TABLE IF NOT EXISTS re_portfolio_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES re_properties(id) ON DELETE CASCADE,
  acquisition_date DATE NOT NULL,
  acquisition_source TEXT NOT NULL DEFAULT 'manual' CHECK(acquisition_source IN ('deal', 'manual', 'import')),
  acquisition_price NUMERIC(12,2) NOT NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  monthly_rent NUMERIC(10,2) DEFAULT 0,
  monthly_expenses NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Add comment for documentation
COMMENT ON TABLE re_portfolio_entries IS 'Tracks properties in user portfolios with support for manual entries, deal-based entries, and imports';
COMMENT ON COLUMN re_portfolio_entries.acquisition_source IS 'How the property was added: deal (closed_won), manual (user added), import (bulk import)';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_portfolio_entries_user_id ON re_portfolio_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_entries_property_id ON re_portfolio_entries(property_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_entries_user_active ON re_portfolio_entries(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_portfolio_entries_acquisition_date ON re_portfolio_entries(acquisition_date);

-- Enable Row Level Security
ALTER TABLE re_portfolio_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own portfolio entries
CREATE POLICY "Users can view their own portfolio entries"
  ON re_portfolio_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolio entries"
  ON re_portfolio_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio entries"
  ON re_portfolio_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolio entries"
  ON re_portfolio_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_portfolio_entries_updated_at()
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

CREATE TRIGGER trigger_portfolio_entries_updated_at
  BEFORE UPDATE ON re_portfolio_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_entries_updated_at();

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Created portfolio entries table for tracking properties in user portfolios',
  jsonb_build_object(
    'migration', '20260116_portfolio_entries',
    'table', 're_portfolio_entries',
    'indexes', 4,
    'rls_policies', 4,
    'features', ARRAY['manual entries', 'deal-based entries', 'import support']
  )
);
