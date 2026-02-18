-- Migration: Property Turnovers Tables
-- Description: Track checkout → clean → inspect → check-in workflow between bookings
-- Phase: Landlord Mode Enhancement - Turnovers

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Turnover status
CREATE TYPE turnover_status AS ENUM (
  'pending',            -- Turnover scheduled, awaiting checkout
  'checkout_complete',  -- Guest checked out
  'cleaning_scheduled', -- Cleaner notified/scheduled
  'cleaning_done',      -- Cleaning completed
  'inspected',          -- Post-cleaning inspection done
  'ready',              -- Property ready for next guest
  'cancelled'           -- Turnover cancelled (booking cancelled)
);

-- ============================================================================
-- 1. PROPERTY_TURNOVERS TABLE
-- ============================================================================
-- Track the turnover workflow between guest stays

CREATE TABLE IF NOT EXISTS property_turnovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES rental_properties(id) ON DELETE CASCADE,

  -- Related bookings
  checkout_booking_id UUID REFERENCES rental_bookings(id) ON DELETE SET NULL,  -- The departing guest
  checkin_booking_id UUID REFERENCES rental_bookings(id) ON DELETE SET NULL,   -- The arriving guest

  -- Timing
  checkout_at TIMESTAMPTZ NOT NULL,  -- When guest checks out
  checkin_at TIMESTAMPTZ,            -- When next guest checks in (NULL = no next booking)
  turnaround_hours INT,              -- Calculated hours between checkout and checkin

  -- Status tracking
  status turnover_status NOT NULL DEFAULT 'pending',

  -- Checkout tracking
  checkout_confirmed BOOLEAN DEFAULT FALSE,
  checkout_confirmed_at TIMESTAMPTZ,
  checkout_notes TEXT,

  -- Cleaning assignment
  cleaner_vendor_id UUID REFERENCES property_vendors(id) ON DELETE SET NULL,
  cleaning_scheduled_at TIMESTAMPTZ,
  cleaning_started_at TIMESTAMPTZ,
  cleaning_completed_at TIMESTAMPTZ,
  cleaning_notes TEXT,
  cleaning_photos JSONB DEFAULT '[]'::JSONB,  -- [{ url, caption, uploaded_at }]

  -- Inspection
  inspection_required BOOLEAN DEFAULT TRUE,
  inspection_completed_at TIMESTAMPTZ,
  inspection_passed BOOLEAN,
  inspection_notes TEXT,
  inspection_photos JSONB DEFAULT '[]'::JSONB,

  -- Issues found
  issues_found BOOLEAN DEFAULT FALSE,
  issues_description TEXT,
  maintenance_created_id UUID REFERENCES property_maintenance(id) ON DELETE SET NULL,

  -- AI messaging history
  -- Format: [{ to, to_name, channel, message, sent_at, status, response, response_at }]
  ai_messages JSONB DEFAULT '[]'::JSONB,

  -- Checklist items (customizable per property/user)
  checklist JSONB DEFAULT '[]'::JSONB,
  -- Format: [{ item: "Check linens", completed: false, completed_at: null, notes: "" }]

  -- Ready for guest
  ready_at TIMESTAMPTZ,
  ready_confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. TURNOVER_TEMPLATES TABLE
-- ============================================================================
-- Customizable turnover checklists per property or global

CREATE TABLE IF NOT EXISTS turnover_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Optional property-specific (NULL = global template)
  property_id UUID REFERENCES rental_properties(id) ON DELETE CASCADE,

  -- Template details
  name TEXT NOT NULL,
  description TEXT,

  -- Checklist items
  -- Format: [{ item: "Check all linens", required: true, category: "cleaning" }]
  checklist_items JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- Settings
  is_default BOOLEAN DEFAULT FALSE,  -- Use as default for new turnovers
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- property_turnovers indexes
CREATE INDEX idx_property_turnovers_user_id ON property_turnovers(user_id);
CREATE INDEX idx_property_turnovers_property_id ON property_turnovers(property_id);
CREATE INDEX idx_property_turnovers_checkout_booking_id ON property_turnovers(checkout_booking_id);
CREATE INDEX idx_property_turnovers_checkin_booking_id ON property_turnovers(checkin_booking_id);
CREATE INDEX idx_property_turnovers_cleaner_vendor_id ON property_turnovers(cleaner_vendor_id);
CREATE INDEX idx_property_turnovers_status ON property_turnovers(status);
CREATE INDEX idx_property_turnovers_checkout_at ON property_turnovers(checkout_at);
CREATE INDEX idx_property_turnovers_created_at ON property_turnovers(created_at DESC);

-- Composite index for upcoming turnovers
CREATE INDEX idx_property_turnovers_upcoming
  ON property_turnovers(property_id, checkout_at)
  WHERE status NOT IN ('ready', 'cancelled');

-- turnover_templates indexes
CREATE INDEX idx_turnover_templates_user_id ON turnover_templates(user_id);
CREATE INDEX idx_turnover_templates_property_id ON turnover_templates(property_id);
CREATE INDEX idx_turnover_templates_is_default ON turnover_templates(is_default) WHERE is_default = TRUE;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE property_turnovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnover_templates ENABLE ROW LEVEL SECURITY;

-- property_turnovers policies
CREATE POLICY "Users can view own turnovers"
  ON property_turnovers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own turnovers"
  ON property_turnovers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own turnovers"
  ON property_turnovers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own turnovers"
  ON property_turnovers FOR DELETE
  USING (auth.uid() = user_id);

-- turnover_templates policies
CREATE POLICY "Users can view own turnover templates"
  ON turnover_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own turnover templates"
  ON turnover_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own turnover templates"
  ON turnover_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own turnover templates"
  ON turnover_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_property_turnovers_timestamp
  BEFORE UPDATE ON property_turnovers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_turnover_templates_timestamp
  BEFORE UPDATE ON turnover_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ADD FOREIGN KEY FOR VENDOR_MESSAGES
-- ============================================================================

-- Add FK from vendor_messages to property_turnovers (deferred from vendors migration)
ALTER TABLE vendor_messages
  ADD CONSTRAINT fk_vendor_messages_turnover
  FOREIGN KEY (turnover_id) REFERENCES property_turnovers(id) ON DELETE SET NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE property_turnovers IS 'Tracks the checkout → clean → inspect → check-in workflow between guest stays';
COMMENT ON COLUMN property_turnovers.ai_messages IS 'History of AI-composed messages sent during turnover process';
COMMENT ON COLUMN property_turnovers.checklist IS 'Customizable checklist items for this specific turnover';
COMMENT ON TABLE turnover_templates IS 'Reusable turnover checklists that can be applied to new turnovers';
