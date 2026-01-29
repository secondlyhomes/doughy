-- Migration: Property Vendors Tables
-- Description: Manage service providers (plumbers, cleaners, handymen, etc.)
-- Phase: Landlord Mode Enhancement - Vendors

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Vendor category/specialty
CREATE TYPE vendor_category AS ENUM (
  'plumber',
  'electrician',
  'hvac',
  'cleaner',
  'handyman',
  'locksmith',
  'pest_control',
  'landscaper',
  'appliance_repair',
  'pool_service',
  'other'
);

-- ============================================================================
-- 1. PROPERTY_VENDORS TABLE
-- ============================================================================
-- Store vendor/service provider contacts

CREATE TABLE IF NOT EXISTS property_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Optional property-specific assignment (NULL = global vendor for all properties)
  property_id UUID REFERENCES rental_properties(id) ON DELETE CASCADE,

  -- Vendor details
  category vendor_category NOT NULL DEFAULT 'other',
  name TEXT NOT NULL,
  company_name TEXT,

  -- Contact info
  phone TEXT,
  email TEXT,
  address TEXT,

  -- Preferences
  is_primary BOOLEAN DEFAULT FALSE,  -- Primary vendor for this category
  preferred_contact_method TEXT DEFAULT 'phone',  -- phone, email, sms
  availability_notes TEXT,  -- "Available weekdays 9-5", etc.

  -- Rates
  hourly_rate NUMERIC(10,2),
  service_fee NUMERIC(10,2),  -- Flat call-out fee
  payment_terms TEXT,  -- "Net 30", "COD", etc.

  -- Performance tracking
  rating INT CHECK (rating >= 1 AND rating <= 5),  -- 1-5 star rating
  total_jobs INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- License/Insurance (for compliance)
  license_number TEXT,
  license_expires DATE,
  insurance_verified BOOLEAN DEFAULT FALSE,
  insurance_expires DATE,

  -- Notes
  notes TEXT,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. VENDOR_MESSAGES TABLE
-- ============================================================================
-- Track AI-composed and sent messages to vendors

CREATE TABLE IF NOT EXISTS vendor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES property_vendors(id) ON DELETE CASCADE,

  -- Related records
  property_id UUID REFERENCES rental_properties(id) ON DELETE SET NULL,
  maintenance_id UUID REFERENCES property_maintenance(id) ON DELETE SET NULL,
  turnover_id UUID,  -- FK added in turnovers migration after table exists

  -- Message details
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'phone')),
  subject TEXT,  -- For email
  body TEXT NOT NULL,

  -- AI composition tracking
  ai_composed BOOLEAN DEFAULT FALSE,
  ai_prompt TEXT,  -- The prompt used to generate the message

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'delivered', 'read', 'responded', 'failed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  -- Response tracking
  response_received BOOLEAN DEFAULT FALSE,
  response_body TEXT,
  response_received_at TIMESTAMPTZ,

  -- Error handling
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- property_vendors indexes
CREATE INDEX idx_property_vendors_user_id ON property_vendors(user_id);
CREATE INDEX idx_property_vendors_property_id ON property_vendors(property_id);
CREATE INDEX idx_property_vendors_category ON property_vendors(category);
CREATE INDEX idx_property_vendors_is_primary ON property_vendors(is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_property_vendors_is_active ON property_vendors(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_property_vendors_last_used ON property_vendors(last_used_at DESC NULLS LAST);

-- Composite index for finding primary vendor by category
CREATE INDEX idx_property_vendors_user_category_primary
  ON property_vendors(user_id, category, is_primary)
  WHERE is_active = TRUE;

-- vendor_messages indexes
CREATE INDEX idx_vendor_messages_user_id ON vendor_messages(user_id);
CREATE INDEX idx_vendor_messages_vendor_id ON vendor_messages(vendor_id);
CREATE INDEX idx_vendor_messages_maintenance_id ON vendor_messages(maintenance_id);
CREATE INDEX idx_vendor_messages_turnover_id ON vendor_messages(turnover_id);
CREATE INDEX idx_vendor_messages_status ON vendor_messages(status);
CREATE INDEX idx_vendor_messages_created_at ON vendor_messages(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE property_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_messages ENABLE ROW LEVEL SECURITY;

-- property_vendors policies
CREATE POLICY "Users can view own vendors"
  ON property_vendors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own vendors"
  ON property_vendors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vendors"
  ON property_vendors FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vendors"
  ON property_vendors FOR DELETE
  USING (auth.uid() = user_id);

-- vendor_messages policies
CREATE POLICY "Users can view own vendor messages"
  ON vendor_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own vendor messages"
  ON vendor_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vendor messages"
  ON vendor_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vendor messages"
  ON vendor_messages FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_property_vendors_timestamp
  BEFORE UPDATE ON property_vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_messages_timestamp
  BEFORE UPDATE ON vendor_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE property_vendors IS 'Service providers (plumbers, cleaners, etc.) for property maintenance';
COMMENT ON COLUMN property_vendors.property_id IS 'NULL = global vendor available for all properties';
COMMENT ON COLUMN property_vendors.is_primary IS 'Primary/preferred vendor for this category';
COMMENT ON TABLE vendor_messages IS 'AI-composed and sent messages to vendors for scheduling and coordination';
COMMENT ON COLUMN vendor_messages.ai_composed IS 'Whether the message was AI-generated';

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS (after tables exist)
-- ============================================================================

-- Add FK from property_maintenance to property_vendors
ALTER TABLE property_maintenance
  ADD CONSTRAINT fk_property_maintenance_vendor
  FOREIGN KEY (vendor_id) REFERENCES property_vendors(id) ON DELETE SET NULL;
