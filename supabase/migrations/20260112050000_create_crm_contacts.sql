-- Migration: Create crm_contacts table
-- Description: Central contacts table for CRM and Landlord platforms
-- Phase: Zone 2 - Database Foundation
-- Note: This table is shared between RE Investor and Landlord platforms

-- ============================================================================
-- CRM_CONTACTS TABLE
-- ============================================================================
-- Central contacts table - used by both investor leads and landlord guests
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic info
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  emails JSONB DEFAULT '{}',  -- Additional emails: {"work": "x@y.com", "personal": "z@w.com"}
  phone TEXT,
  phones JSONB DEFAULT '{}',  -- Additional phones: {"mobile": "123", "home": "456"}

  -- Business info
  company TEXT,
  job_title TEXT,

  -- Address
  address JSONB DEFAULT '{}',  -- {"line1": "", "line2": "", "city": "", "state": "", "zip": "", "country": ""}
  city TEXT,
  state TEXT,
  zip TEXT,

  -- Tags and notes
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,

  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_crm_contacts_user_id ON crm_contacts(user_id);
CREATE INDEX idx_crm_contacts_email ON crm_contacts(email) WHERE email IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_crm_contacts_phone ON crm_contacts(phone) WHERE phone IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_crm_contacts_created_at ON crm_contacts(created_at DESC);
CREATE INDEX idx_crm_contacts_tags ON crm_contacts USING GIN(tags) WHERE is_deleted = FALSE;

-- Enable RLS
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own contacts"
  ON crm_contacts FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts"
  ON crm_contacts FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON crm_contacts FOR UPDATE
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON crm_contacts FOR DELETE
  USING (user_id IS NULL OR auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_crm_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_crm_contacts_updated_at
  BEFORE UPDATE ON crm_contacts
  FOR EACH ROW EXECUTE FUNCTION update_crm_contacts_updated_at();
