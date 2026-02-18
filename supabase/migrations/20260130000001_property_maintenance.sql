-- Migration: Property Maintenance Tables
-- Description: Track maintenance work orders, repairs, and service history
-- Phase: Landlord Mode Enhancement - Property Maintenance

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Maintenance status
CREATE TYPE maintenance_status AS ENUM (
  'reported',      -- Issue reported, awaiting review
  'scheduled',     -- Work scheduled with vendor
  'in_progress',   -- Work being done
  'completed',     -- Work finished
  'cancelled'      -- Work cancelled
);

-- Priority level
CREATE TYPE maintenance_priority AS ENUM (
  'emergency',     -- Immediate attention (water leak, no heat, etc.)
  'high',          -- Urgent but not emergency
  'medium',        -- Normal priority
  'low'            -- Can wait / minor issue
);

-- Maintenance category
CREATE TYPE maintenance_category AS ENUM (
  'plumbing',
  'electrical',
  'hvac',
  'appliance',
  'structural',
  'pest_control',
  'landscaping',
  'cleaning',
  'general',
  'other'
);

-- Who pays for the repair
CREATE TYPE maintenance_charge_to AS ENUM (
  'owner',         -- Property owner pays
  'guest',         -- Guest damage, charge to guest
  'warranty',      -- Covered by warranty
  'insurance'      -- Insurance claim
);

-- ============================================================================
-- SEQUENCE FOR WORK ORDER NUMBERS
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS work_order_number_seq START 1;

-- ============================================================================
-- 1. PROPERTY_MAINTENANCE TABLE
-- ============================================================================
-- Track maintenance work orders and repairs

CREATE TABLE IF NOT EXISTS property_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES rental_properties(id) ON DELETE CASCADE,

  -- Work order identification
  work_order_number TEXT NOT NULL DEFAULT ('WO-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('work_order_number_seq')::TEXT, 4, '0')),

  -- Issue details
  title TEXT NOT NULL,
  description TEXT,
  category maintenance_category NOT NULL DEFAULT 'general',
  location TEXT,  -- Where in the property

  -- Status and priority
  status maintenance_status NOT NULL DEFAULT 'reported',
  priority maintenance_priority NOT NULL DEFAULT 'medium',

  -- Scheduling
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Vendor assignment (FK added in 20260130000002_property_vendors.sql after vendors table exists)
  vendor_id UUID,  -- Will reference property_vendors(id)
  vendor_name TEXT,  -- Denormalized for quick display
  vendor_phone TEXT,

  -- Financial
  estimated_cost NUMERIC(10,2),
  actual_cost NUMERIC(10,2),
  charge_to maintenance_charge_to NOT NULL DEFAULT 'owner',

  -- Guest charge tracking
  is_guest_chargeable BOOLEAN DEFAULT FALSE,
  guest_charge_amount NUMERIC(10,2),
  guest_charge_approved BOOLEAN,
  guest_charge_approved_at TIMESTAMPTZ,

  -- Links to other records
  booking_id UUID REFERENCES rental_bookings(id) ON DELETE SET NULL,
  inventory_item_id UUID REFERENCES property_inventory(id) ON DELETE SET NULL,

  -- Photos (stored as JSON array)
  -- Format: [{ "url": "...", "type": "before|after|receipt", "caption": "...", "uploaded_at": "..." }]
  photos JSONB DEFAULT '[]'::JSONB,

  -- Receipt tracking
  receipt_url TEXT,
  receipt_amount NUMERIC(10,2),

  -- Notes
  notes TEXT,
  resolution_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_property_maintenance_user_id ON property_maintenance(user_id);
CREATE INDEX idx_property_maintenance_property_id ON property_maintenance(property_id);
CREATE INDEX idx_property_maintenance_status ON property_maintenance(status);
CREATE INDEX idx_property_maintenance_priority ON property_maintenance(priority);
CREATE INDEX idx_property_maintenance_category ON property_maintenance(category);
CREATE INDEX idx_property_maintenance_vendor_id ON property_maintenance(vendor_id);
CREATE INDEX idx_property_maintenance_booking_id ON property_maintenance(booking_id);
CREATE INDEX idx_property_maintenance_inventory_item_id ON property_maintenance(inventory_item_id);
CREATE INDEX idx_property_maintenance_work_order ON property_maintenance(work_order_number);
CREATE INDEX idx_property_maintenance_created_at ON property_maintenance(created_at DESC);

-- Composite index for common queries (open work orders per property)
CREATE INDEX idx_property_maintenance_property_status
  ON property_maintenance(property_id, status)
  WHERE status NOT IN ('completed', 'cancelled');

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE property_maintenance ENABLE ROW LEVEL SECURITY;

-- Users can view their own maintenance records
CREATE POLICY "Users can view own maintenance records"
  ON property_maintenance FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own maintenance records
CREATE POLICY "Users can create own maintenance records"
  ON property_maintenance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own maintenance records
CREATE POLICY "Users can update own maintenance records"
  ON property_maintenance FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own maintenance records
CREATE POLICY "Users can delete own maintenance records"
  ON property_maintenance FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_property_maintenance_timestamp
  BEFORE UPDATE ON property_maintenance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE property_maintenance IS 'Tracks maintenance work orders and repairs for rental properties';
COMMENT ON COLUMN property_maintenance.work_order_number IS 'Auto-generated work order number (WO-YYYY-####)';
COMMENT ON COLUMN property_maintenance.photos IS 'JSON array of photo objects: [{ url, type, caption, uploaded_at }]';
COMMENT ON COLUMN property_maintenance.is_guest_chargeable IS 'Whether this repair should be charged to the guest';
