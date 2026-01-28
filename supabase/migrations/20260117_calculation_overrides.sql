-- Migration: Create Calculation Overrides Table
-- Description: Allow users to override default calculation metrics globally or per-property/deal
-- Phase: Sprint 2 - Portfolio & Creative Finance

-- ============================================================================
-- CREATE CALCULATION OVERRIDES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS re_calculation_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL CHECK(metric_name IN (
    'mao_percentage',           -- Max Allowable Offer percentage (e.g., 0.70 for 70% rule)
    'repair_buffer',            -- Additional repair cost buffer
    'closing_cost_percentage',  -- Closing cost as % of purchase price
    'holding_cost_per_month',   -- Monthly holding costs
    'arv_multiplier',           -- After Repair Value multiplier
    'profit_margin',            -- Desired profit margin
    'rehab_contingency',        -- Rehab contingency percentage
    'acquisition_cost',         -- Fixed acquisition cost
    'disposition_cost',         -- Selling/disposition cost
    'seller_finance_rate',      -- Interest rate for seller financing
    'down_payment_percentage',  -- Down payment as percentage
    'other'                     -- Custom metric
  )),
  original_value NUMERIC(10,4) NOT NULL,
  override_value NUMERIC(10,4) NOT NULL,
  property_id UUID REFERENCES re_properties(id) ON DELETE CASCADE, -- NULL = global preference
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,             -- NULL = not deal-specific
  reason TEXT,                                                      -- User's explanation (optional)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index by user for quick lookup of all overrides
CREATE INDEX idx_calc_overrides_user ON re_calculation_overrides(user_id);

-- Index by metric name
CREATE INDEX idx_calc_overrides_metric ON re_calculation_overrides(metric_name);

-- Index for property-specific overrides
CREATE INDEX idx_calc_overrides_property
  ON re_calculation_overrides(property_id)
  WHERE property_id IS NOT NULL;

-- Index for deal-specific overrides
CREATE INDEX idx_calc_overrides_deal
  ON re_calculation_overrides(deal_id)
  WHERE deal_id IS NOT NULL;

-- Composite index for querying specific metric for user
CREATE INDEX idx_calc_overrides_user_metric
  ON re_calculation_overrides(user_id, metric_name);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE re_calculation_overrides ENABLE ROW LEVEL SECURITY;

-- Users can manage their own calculation overrides
CREATE POLICY "Users can view their own calculation overrides"
  ON re_calculation_overrides FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own calculation overrides"
  ON re_calculation_overrides FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own calculation overrides"
  ON re_calculation_overrides FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own calculation overrides"
  ON re_calculation_overrides FOR DELETE
  USING (user_id = auth.uid());

-- Admins can view all calculation overrides
CREATE POLICY "Admins can view all calculation overrides"
  ON re_calculation_overrides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE re_calculation_overrides IS 'Stores user-specific overrides for calculation metrics, either globally or per-property/deal';
COMMENT ON COLUMN re_calculation_overrides.metric_name IS 'Name of the calculation metric being overridden (e.g., mao_percentage, repair_buffer)';
COMMENT ON COLUMN re_calculation_overrides.original_value IS 'Original default value before override';
COMMENT ON COLUMN re_calculation_overrides.override_value IS 'New value that overrides the default';
COMMENT ON COLUMN re_calculation_overrides.property_id IS 'If set, this override applies only to this specific property (NULL = global)';
COMMENT ON COLUMN re_calculation_overrides.deal_id IS 'If set, this override applies only to this specific deal (NULL = not deal-specific)';
COMMENT ON COLUMN re_calculation_overrides.reason IS 'Optional: User explanation for why they overrode this value';

-- ============================================================================
-- VALIDATION CONSTRAINTS
-- ============================================================================

-- Override value should be reasonable (not negative for most metrics)
ALTER TABLE re_calculation_overrides
ADD CONSTRAINT check_override_value_positive
  CHECK (
    override_value >= 0 OR
    metric_name IN ('profit_margin') -- Some metrics can be negative
  );

-- Original value should be reasonable
ALTER TABLE re_calculation_overrides
ADD CONSTRAINT check_original_value_positive
  CHECK (
    original_value >= 0 OR
    metric_name IN ('profit_margin')
  );

-- Can't have both property_id and deal_id set (must be one or the other or neither)
ALTER TABLE re_calculation_overrides
ADD CONSTRAINT check_override_scope
  CHECK (
    property_id IS NULL OR deal_id IS NULL
  );

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_calc_overrides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_calc_overrides_updated_at
  BEFORE UPDATE ON re_calculation_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_calc_overrides_updated_at();

-- Migration complete: calculation overrides table
