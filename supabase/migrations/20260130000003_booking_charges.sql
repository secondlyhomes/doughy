-- Migration: Booking Charges Tables
-- Description: Track charges, deductions, and deposit settlements for bookings
-- Phase: Landlord Mode Enhancement - Booking Charges

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Charge status
CREATE TYPE booking_charge_status AS ENUM (
  'pending',      -- Charge identified, awaiting approval
  'approved',     -- Approved for deduction
  'disputed',     -- Guest disputes the charge
  'deducted',     -- Deducted from deposit
  'waived',       -- Waived by owner
  'paid'          -- Paid directly by guest
);

-- Charge type
CREATE TYPE booking_charge_type AS ENUM (
  'damage',           -- Property damage
  'cleaning',         -- Extra cleaning required
  'missing_item',     -- Missing inventory item
  'late_checkout',    -- Late checkout fee
  'rule_violation',   -- House rule violation
  'utility_overage',  -- Excess utility usage
  'other'
);

-- ============================================================================
-- 1. BOOKING_CHARGES TABLE
-- ============================================================================
-- Track individual charges against a booking's security deposit

CREATE TABLE IF NOT EXISTS booking_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES rental_bookings(id) ON DELETE CASCADE,

  -- Link to maintenance record if applicable
  maintenance_id UUID REFERENCES property_maintenance(id) ON DELETE SET NULL,

  -- Charge details
  charge_type booking_charge_type NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,

  -- Status
  status booking_charge_status NOT NULL DEFAULT 'pending',

  -- Approval workflow
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Dispute handling
  disputed_at TIMESTAMPTZ,
  dispute_reason TEXT,
  dispute_resolved_at TIMESTAMPTZ,
  dispute_resolution TEXT,

  -- Evidence
  photos JSONB DEFAULT '[]'::JSONB,  -- [{ url, caption, uploaded_at }]
  receipt_url TEXT,

  -- Notes
  notes TEXT,
  guest_notification_sent BOOLEAN DEFAULT FALSE,
  guest_notification_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. DEPOSIT_SETTLEMENTS TABLE
-- ============================================================================
-- Track the settlement of security deposits at checkout

CREATE TABLE IF NOT EXISTS deposit_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES rental_bookings(id) ON DELETE CASCADE,

  -- Deposit amounts
  deposit_held NUMERIC(10,2) NOT NULL,  -- Original deposit amount
  total_deductions NUMERIC(10,2) DEFAULT 0,
  amount_returned NUMERIC(10,2),  -- Calculated: deposit_held - total_deductions

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'returned', 'withheld', 'disputed')),

  -- Return details
  return_method TEXT,  -- 'original_payment', 'check', 'bank_transfer', 'cash'
  return_reference TEXT,  -- Check number, transaction ID, etc.
  returned_at TIMESTAMPTZ,

  -- Itemized deductions (JSON summary)
  deductions_summary JSONB DEFAULT '[]'::JSONB,  -- [{ charge_id, description, amount }]

  -- Letter generation (for future feature)
  letter_generated BOOLEAN DEFAULT FALSE,
  letter_generated_at TIMESTAMPTZ,
  letter_url TEXT,

  -- Guest acknowledgment
  guest_acknowledged BOOLEAN DEFAULT FALSE,
  guest_acknowledged_at TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_booking_settlement UNIQUE (booking_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- booking_charges indexes
CREATE INDEX idx_booking_charges_user_id ON booking_charges(user_id);
CREATE INDEX idx_booking_charges_booking_id ON booking_charges(booking_id);
CREATE INDEX idx_booking_charges_maintenance_id ON booking_charges(maintenance_id);
CREATE INDEX idx_booking_charges_status ON booking_charges(status);
CREATE INDEX idx_booking_charges_created_at ON booking_charges(created_at DESC);

-- Composite index for pending charges by booking
CREATE INDEX idx_booking_charges_booking_pending
  ON booking_charges(booking_id, status)
  WHERE status IN ('pending', 'approved');

-- deposit_settlements indexes
CREATE INDEX idx_deposit_settlements_user_id ON deposit_settlements(user_id);
CREATE INDEX idx_deposit_settlements_booking_id ON deposit_settlements(booking_id);
CREATE INDEX idx_deposit_settlements_status ON deposit_settlements(status);
CREATE INDEX idx_deposit_settlements_created_at ON deposit_settlements(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE booking_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_settlements ENABLE ROW LEVEL SECURITY;

-- booking_charges policies
CREATE POLICY "Users can view own booking charges"
  ON booking_charges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own booking charges"
  ON booking_charges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own booking charges"
  ON booking_charges FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own booking charges"
  ON booking_charges FOR DELETE
  USING (auth.uid() = user_id);

-- deposit_settlements policies
CREATE POLICY "Users can view own deposit settlements"
  ON deposit_settlements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deposit settlements"
  ON deposit_settlements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deposit settlements"
  ON deposit_settlements FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own deposit settlements"
  ON deposit_settlements FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_booking_charges_timestamp
  BEFORE UPDATE ON booking_charges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deposit_settlements_timestamp
  BEFORE UPDATE ON deposit_settlements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate total deductions for a settlement
CREATE OR REPLACE FUNCTION calculate_settlement_deductions(p_booking_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total
  FROM booking_charges
  WHERE booking_id = p_booking_id
    AND status IN ('approved', 'deducted');

  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE booking_charges IS 'Individual charges against a booking security deposit (damage, cleaning, etc.)';
COMMENT ON TABLE deposit_settlements IS 'Settlement records for security deposit return at checkout';
COMMENT ON COLUMN deposit_settlements.deductions_summary IS 'JSON summary of all deductions: [{ charge_id, description, amount }]';
COMMENT ON COLUMN deposit_settlements.letter_url IS 'URL to generated itemized deduction letter (future feature)';
