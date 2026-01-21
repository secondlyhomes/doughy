-- Migration: Portfolio enhancements
-- Adds property groups, monthly financial records, and mortgage tracking

-- ============================================
-- Property groups for organizing portfolio
-- ============================================
CREATE TABLE IF NOT EXISTS re_portfolio_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT, -- optional color for visual distinction (hex code)
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

COMMENT ON TABLE re_portfolio_groups IS 'Custom groups for organizing portfolio properties (e.g., Phoenix Properties, Nebraska Properties)';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_groups_user_id ON re_portfolio_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_groups_sort_order ON re_portfolio_groups(user_id, sort_order);

-- ============================================
-- Add group reference to portfolio entries
-- ============================================
ALTER TABLE re_portfolio_entries
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES re_portfolio_groups(id) ON DELETE SET NULL;

-- Add projected financials and property manager info
ALTER TABLE re_portfolio_entries
  ADD COLUMN IF NOT EXISTS projected_monthly_rent NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS projected_monthly_expenses NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS property_manager_name TEXT,
  ADD COLUMN IF NOT EXISTS property_manager_phone TEXT,
  ADD COLUMN IF NOT EXISTS ownership_percent NUMERIC(5,2) DEFAULT 100.00
    CHECK(ownership_percent >= 0 AND ownership_percent <= 100);

-- Index for group lookups
CREATE INDEX IF NOT EXISTS idx_portfolio_entries_group_id ON re_portfolio_entries(group_id);

-- ============================================
-- Monthly financial records
-- ============================================
CREATE TABLE IF NOT EXISTS re_portfolio_monthly_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_entry_id UUID NOT NULL REFERENCES re_portfolio_entries(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of month (YYYY-MM-01)
  rent_collected NUMERIC(10,2) DEFAULT 0,
  expenses JSONB DEFAULT '{}', -- {mortgage_piti, property_tax, insurance, hoa, repairs, utilities, property_management, other, total}
  occupancy_status TEXT CHECK(occupancy_status IN ('occupied', 'vacant', 'partial')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(portfolio_entry_id, month)
);

COMMENT ON TABLE re_portfolio_monthly_records IS 'Monthly financial records for tracking actual income/expenses vs projections';
COMMENT ON COLUMN re_portfolio_monthly_records.month IS 'First day of the month (YYYY-MM-01)';
COMMENT ON COLUMN re_portfolio_monthly_records.expenses IS 'JSON breakdown: {mortgage_piti, property_tax, insurance, hoa, repairs, utilities, property_management, other, total}';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_monthly_records_entry_id ON re_portfolio_monthly_records(portfolio_entry_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_monthly_records_month ON re_portfolio_monthly_records(month);
CREATE INDEX IF NOT EXISTS idx_portfolio_monthly_records_entry_month ON re_portfolio_monthly_records(portfolio_entry_id, month DESC);

-- ============================================
-- Mortgage/debt tracking
-- ============================================
CREATE TABLE IF NOT EXISTS re_portfolio_mortgages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_entry_id UUID NOT NULL REFERENCES re_portfolio_entries(id) ON DELETE CASCADE,
  lender_name TEXT,
  loan_type TEXT CHECK(loan_type IN ('conventional', 'fha', 'va', 'seller_finance', 'hard_money', 'heloc', 'other')),
  original_balance NUMERIC(12,2) NOT NULL,
  current_balance NUMERIC(12,2) NOT NULL,
  interest_rate NUMERIC(5,3) NOT NULL, -- e.g., 6.875
  monthly_payment NUMERIC(10,2) NOT NULL,
  start_date DATE NOT NULL,
  maturity_date DATE,
  term_months INT, -- Original loan term in months
  is_primary BOOLEAN DEFAULT TRUE,
  escrow_amount NUMERIC(10,2), -- Monthly escrow for taxes/insurance
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE re_portfolio_mortgages IS 'Mortgage and debt tracking for portfolio properties';
COMMENT ON COLUMN re_portfolio_mortgages.interest_rate IS 'Annual interest rate as percentage (e.g., 6.875 for 6.875%)';
COMMENT ON COLUMN re_portfolio_mortgages.is_primary IS 'Whether this is the primary mortgage vs secondary/HELOC';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_mortgages_entry_id ON re_portfolio_mortgages(portfolio_entry_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_mortgages_primary ON re_portfolio_mortgages(portfolio_entry_id, is_primary) WHERE is_primary = TRUE;

-- ============================================
-- RLS Policies for new tables
-- ============================================

-- re_portfolio_groups RLS
ALTER TABLE re_portfolio_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own portfolio groups"
  ON re_portfolio_groups
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolio groups"
  ON re_portfolio_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio groups"
  ON re_portfolio_groups
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolio groups"
  ON re_portfolio_groups
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- re_portfolio_monthly_records RLS
ALTER TABLE re_portfolio_monthly_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own monthly records"
  ON re_portfolio_monthly_records
  FOR SELECT
  TO authenticated
  USING (
    portfolio_entry_id IN (
      SELECT id FROM re_portfolio_entries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own monthly records"
  ON re_portfolio_monthly_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    portfolio_entry_id IN (
      SELECT id FROM re_portfolio_entries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own monthly records"
  ON re_portfolio_monthly_records
  FOR UPDATE
  TO authenticated
  USING (
    portfolio_entry_id IN (
      SELECT id FROM re_portfolio_entries WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    portfolio_entry_id IN (
      SELECT id FROM re_portfolio_entries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own monthly records"
  ON re_portfolio_monthly_records
  FOR DELETE
  TO authenticated
  USING (
    portfolio_entry_id IN (
      SELECT id FROM re_portfolio_entries WHERE user_id = auth.uid()
    )
  );

-- re_portfolio_mortgages RLS
ALTER TABLE re_portfolio_mortgages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mortgages"
  ON re_portfolio_mortgages
  FOR SELECT
  TO authenticated
  USING (
    portfolio_entry_id IN (
      SELECT id FROM re_portfolio_entries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own mortgages"
  ON re_portfolio_mortgages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    portfolio_entry_id IN (
      SELECT id FROM re_portfolio_entries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own mortgages"
  ON re_portfolio_mortgages
  FOR UPDATE
  TO authenticated
  USING (
    portfolio_entry_id IN (
      SELECT id FROM re_portfolio_entries WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    portfolio_entry_id IN (
      SELECT id FROM re_portfolio_entries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own mortgages"
  ON re_portfolio_mortgages
  FOR DELETE
  TO authenticated
  USING (
    portfolio_entry_id IN (
      SELECT id FROM re_portfolio_entries WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- Updated_at triggers
-- ============================================

CREATE OR REPLACE FUNCTION update_portfolio_groups_updated_at()
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

CREATE TRIGGER trigger_portfolio_groups_updated_at
  BEFORE UPDATE ON re_portfolio_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_groups_updated_at();

CREATE OR REPLACE FUNCTION update_portfolio_monthly_records_updated_at()
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

CREATE TRIGGER trigger_portfolio_monthly_records_updated_at
  BEFORE UPDATE ON re_portfolio_monthly_records
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_monthly_records_updated_at();

CREATE OR REPLACE FUNCTION update_portfolio_mortgages_updated_at()
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

CREATE TRIGGER trigger_portfolio_mortgages_updated_at
  BEFORE UPDATE ON re_portfolio_mortgages
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_mortgages_updated_at();

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Added portfolio enhancements: property groups, monthly records, and mortgage tracking',
  jsonb_build_object(
    'migration', '20260118_portfolio_enhancements',
    'tables_created', ARRAY['re_portfolio_groups', 're_portfolio_monthly_records', 're_portfolio_mortgages'],
    'columns_added', ARRAY['group_id', 'projected_monthly_rent', 'projected_monthly_expenses', 'property_manager_name', 'property_manager_phone', 'ownership_percent'],
    'rls_policies', 12
  )
);
