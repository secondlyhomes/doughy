-- Migration: Create User Calculation Preferences Table
-- Description: Store user-specific default values for deal calculations
-- Phase: Sprint 3 - AI & Automation

-- ============================================================================
-- CREATE USER CALCULATION PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS re_user_calculation_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- MAO (Maximum Allowable Offer) Calculation
  mao_percentage NUMERIC(5,4) DEFAULT 0.70, -- Default 70% rule

  -- Repair and Buffer Costs
  repair_buffer NUMERIC(10,2) DEFAULT 5000, -- Default $5k buffer
  rehab_contingency_percentage NUMERIC(5,4) DEFAULT 0.10, -- Default 10% contingency

  -- Closing and Holding Costs
  closing_cost_percentage NUMERIC(5,4) DEFAULT 0.03, -- Default 3% of purchase price
  holding_cost_per_month NUMERIC(10,2) DEFAULT 2000, -- Default $2k/month
  estimated_holding_months INT DEFAULT 6, -- Default 6 months

  -- Profit and Margins
  minimum_profit_amount NUMERIC(10,2) DEFAULT 20000, -- Default $20k minimum profit
  desired_profit_percentage NUMERIC(5,4) DEFAULT 0.15, -- Default 15% of ARV

  -- Seller Financing Defaults
  default_down_payment_percentage NUMERIC(5,4) DEFAULT 0.10, -- Default 10% down
  default_interest_rate NUMERIC(5,3) DEFAULT 0.06, -- Default 6% interest
  default_term_years INT DEFAULT 30, -- Default 30-year term

  -- ARV (After Repair Value) Calculation
  arv_multiplier NUMERIC(5,4) DEFAULT 1.00, -- Default 100% (no adjustment)
  arv_confidence_level TEXT DEFAULT 'medium'
    CHECK(arv_confidence_level IN ('low', 'medium', 'high')),

  -- Additional Costs
  acquisition_cost NUMERIC(10,2) DEFAULT 0, -- Default $0 (e.g., assignment fee)
  disposition_cost NUMERIC(10,2) DEFAULT 0, -- Default $0 (e.g., selling cost)

  -- Flexible preferences (for future expansion)
  preferences JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary key already creates an index on user_id
-- No additional indexes needed for this table

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE re_user_calculation_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own calculation preferences
CREATE POLICY "Users can view their own calc preferences"
  ON re_user_calculation_preferences FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own calculation preferences
CREATE POLICY "Users can insert their own calc preferences"
  ON re_user_calculation_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own calculation preferences
CREATE POLICY "Users can update their own calc preferences"
  ON re_user_calculation_preferences FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own calculation preferences
CREATE POLICY "Users can delete their own calc preferences"
  ON re_user_calculation_preferences FOR DELETE
  USING (user_id = auth.uid());

-- Admins can view all calculation preferences
CREATE POLICY "Admins can view all calc preferences"
  ON re_user_calculation_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE re_user_calculation_preferences IS 'User-specific default values for deal analysis calculations';
COMMENT ON COLUMN re_user_calculation_preferences.mao_percentage IS 'Maximum Allowable Offer as percentage of ARV (e.g., 0.70 = 70% rule)';
COMMENT ON COLUMN re_user_calculation_preferences.repair_buffer IS 'Additional buffer added to repair estimates for unexpected costs';
COMMENT ON COLUMN re_user_calculation_preferences.rehab_contingency_percentage IS 'Percentage of repair estimate added as contingency (e.g., 0.10 = 10%)';
COMMENT ON COLUMN re_user_calculation_preferences.closing_cost_percentage IS 'Estimated closing costs as percentage of purchase price';
COMMENT ON COLUMN re_user_calculation_preferences.holding_cost_per_month IS 'Estimated monthly holding costs (utilities, insurance, etc.)';
COMMENT ON COLUMN re_user_calculation_preferences.estimated_holding_months IS 'Default estimated holding period in months';
COMMENT ON COLUMN re_user_calculation_preferences.minimum_profit_amount IS 'Minimum acceptable profit in dollars';
COMMENT ON COLUMN re_user_calculation_preferences.desired_profit_percentage IS 'Desired profit as percentage of ARV';
COMMENT ON COLUMN re_user_calculation_preferences.default_down_payment_percentage IS 'Default down payment for seller financing deals';
COMMENT ON COLUMN re_user_calculation_preferences.default_interest_rate IS 'Default interest rate for seller financing (as decimal)';
COMMENT ON COLUMN re_user_calculation_preferences.default_term_years IS 'Default loan term in years for seller financing';
COMMENT ON COLUMN re_user_calculation_preferences.arv_multiplier IS 'Multiplier for ARV adjustments (e.g., 0.95 = 95% of estimated ARV)';
COMMENT ON COLUMN re_user_calculation_preferences.arv_confidence_level IS 'Confidence level in ARV estimate: low, medium, high';
COMMENT ON COLUMN re_user_calculation_preferences.acquisition_cost IS 'Fixed acquisition costs (e.g., assignment fee, finder fee)';
COMMENT ON COLUMN re_user_calculation_preferences.disposition_cost IS 'Fixed disposition costs (e.g., selling/marketing costs)';
COMMENT ON COLUMN re_user_calculation_preferences.preferences IS 'Flexible JSONB field for additional user preferences';

-- ============================================================================
-- VALIDATION CONSTRAINTS
-- ============================================================================

-- Percentages should be between 0 and 1 (0% to 100%)
ALTER TABLE re_user_calculation_preferences
ADD CONSTRAINT check_mao_percentage
  CHECK (mao_percentage >= 0 AND mao_percentage <= 1),
ADD CONSTRAINT check_rehab_contingency
  CHECK (rehab_contingency_percentage >= 0 AND rehab_contingency_percentage <= 1),
ADD CONSTRAINT check_closing_cost
  CHECK (closing_cost_percentage >= 0 AND closing_cost_percentage <= 0.20),
ADD CONSTRAINT check_down_payment
  CHECK (default_down_payment_percentage >= 0 AND default_down_payment_percentage <= 1),
ADD CONSTRAINT check_desired_profit
  CHECK (desired_profit_percentage >= 0 AND desired_profit_percentage <= 1),
ADD CONSTRAINT check_arv_multiplier
  CHECK (arv_multiplier > 0 AND arv_multiplier <= 2);

-- Interest rate should be reasonable (0% to 20%)
ALTER TABLE re_user_calculation_preferences
ADD CONSTRAINT check_interest_rate
  CHECK (default_interest_rate >= 0 AND default_interest_rate <= 0.20);

-- Numeric values should be non-negative
ALTER TABLE re_user_calculation_preferences
ADD CONSTRAINT check_repair_buffer
  CHECK (repair_buffer >= 0),
ADD CONSTRAINT check_holding_cost
  CHECK (holding_cost_per_month >= 0),
ADD CONSTRAINT check_minimum_profit
  CHECK (minimum_profit_amount >= 0),
ADD CONSTRAINT check_acquisition_cost
  CHECK (acquisition_cost >= 0),
ADD CONSTRAINT check_disposition_cost
  CHECK (disposition_cost >= 0);

-- Integer values should be reasonable
ALTER TABLE re_user_calculation_preferences
ADD CONSTRAINT check_holding_months
  CHECK (estimated_holding_months > 0 AND estimated_holding_months <= 120),
ADD CONSTRAINT check_term_years
  CHECK (default_term_years > 0 AND default_term_years <= 50);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_calc_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_calc_prefs_updated_at
  BEFORE UPDATE ON re_user_calculation_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_calc_prefs_updated_at();

-- ============================================================================
-- AUTO-CREATE PREFERENCES ON PROFILE CREATION
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_calc_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default calculation preferences for new user
  INSERT INTO re_user_calculation_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_calc_preferences
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_calc_preferences();

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Created user calculation preferences table with default values',
  jsonb_build_object(
    'migration', '20260118_user_calc_preferences',
    'table', 're_user_calculation_preferences',
    'rls_policies', 5,
    'check_constraints', 14,
    'triggers', 2,
    'default_values', jsonb_build_object(
      'mao_percentage', 0.70,
      'repair_buffer', 5000,
      'closing_cost_percentage', 0.03,
      'holding_cost_per_month', 2000,
      'minimum_profit_amount', 20000,
      'default_interest_rate', 0.06
    ),
    'auto_created', 'Preferences auto-created when user signs up'
  )
);
