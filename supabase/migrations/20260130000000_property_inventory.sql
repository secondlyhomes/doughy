-- Migration: Property Inventory Tables
-- Description: Track appliances, fixtures, furniture in rental properties
-- Phase: Landlord Mode Enhancement - Property Inventory

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Inventory item category
CREATE TYPE inventory_category AS ENUM (
  'appliance',    -- Washer, dryer, dishwasher, etc.
  'hvac',         -- AC units, furnace, water heater
  'structure',    -- Windows, doors, roof, flooring
  'plumbing',     -- Toilets, faucets, water heater
  'furniture',    -- Beds, sofas, tables
  'electronics',  -- TVs, smart devices
  'other'
);

-- Item condition
CREATE TYPE inventory_condition AS ENUM (
  'excellent',
  'good',
  'fair',
  'poor',
  'needs_replacement'
);

-- ============================================================================
-- 1. PROPERTY_INVENTORY TABLE
-- ============================================================================
-- Track all inventory items in rental properties

CREATE TABLE IF NOT EXISTS property_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES rental_properties(id) ON DELETE CASCADE,

  -- Item identification
  name TEXT NOT NULL,
  category inventory_category NOT NULL DEFAULT 'other',
  location TEXT,  -- Kitchen, Master Bedroom, Garage, etc.

  -- Product details
  brand TEXT,
  model TEXT,
  serial_number TEXT,

  -- Dates
  purchase_date DATE,
  install_date DATE,
  warranty_expires DATE,

  -- Condition tracking
  condition inventory_condition NOT NULL DEFAULT 'good',
  last_inspected_at TIMESTAMPTZ,
  inspection_notes TEXT,

  -- Financial
  purchase_price NUMERIC(10,2),
  replacement_cost NUMERIC(10,2),

  -- Photos (stored as JSON array)
  -- Format: [{ "url": "...", "caption": "...", "uploaded_at": "..." }]
  photos JSONB DEFAULT '[]'::JSONB,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_property_inventory_user_id ON property_inventory(user_id);
CREATE INDEX idx_property_inventory_property_id ON property_inventory(property_id);
CREATE INDEX idx_property_inventory_category ON property_inventory(category);
CREATE INDEX idx_property_inventory_condition ON property_inventory(condition);
CREATE INDEX idx_property_inventory_created_at ON property_inventory(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_property_inventory_property_category
  ON property_inventory(property_id, category);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE property_inventory ENABLE ROW LEVEL SECURITY;

-- Users can view their own inventory items
CREATE POLICY "Users can view own inventory items"
  ON property_inventory FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own inventory items
CREATE POLICY "Users can create own inventory items"
  ON property_inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own inventory items
CREATE POLICY "Users can update own inventory items"
  ON property_inventory FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own inventory items
CREATE POLICY "Users can delete own inventory items"
  ON property_inventory FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_property_inventory_timestamp
  BEFORE UPDATE ON property_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE property_inventory IS 'Tracks inventory items (appliances, furniture, fixtures) in rental properties';
COMMENT ON COLUMN property_inventory.photos IS 'JSON array of photo objects: [{ url, caption, uploaded_at }]';
COMMENT ON COLUMN property_inventory.location IS 'Physical location within the property (e.g., Kitchen, Master Bedroom)';
