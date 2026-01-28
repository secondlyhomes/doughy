-- Migration: Create rental support tables
-- Description: Platform settings, integrations, and crm_contacts extensions
-- Phase: Zone 2 - Database Foundation
-- Note: Enables multi-platform support and external integrations

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Platform type
CREATE TYPE user_platform AS ENUM ('investor', 'landlord');

-- Contact type (for landlord platform use)
CREATE TYPE crm_contact_type AS ENUM (
  'lead',      -- Potential guest/tenant
  'guest',     -- Current or past guest
  'tenant',    -- Long-term tenant
  'vendor',    -- Service provider
  'personal'   -- Personal contact
);

-- Contact source
CREATE TYPE crm_contact_source AS ENUM (
  'furnishedfinder',
  'airbnb',
  'turbotenant',
  'zillow',
  'facebook',
  'whatsapp',
  'direct',
  'referral',
  'craigslist',
  'other'
);

-- Contact status
CREATE TYPE crm_contact_status AS ENUM (
  'new',
  'contacted',
  'qualified',
  'active',
  'inactive',
  'archived'
);

-- Integration status
CREATE TYPE rental_integration_status AS ENUM (
  'connected',
  'disconnected',
  'error',
  'pending'
);

-- ============================================================================
-- 1. USER_PLATFORM_SETTINGS TABLE
-- ============================================================================
-- Which platforms (investor/landlord) user has enabled
CREATE TABLE IF NOT EXISTS user_platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Platform selection
  enabled_platforms user_platform[] NOT NULL DEFAULT ARRAY['investor']::user_platform[],
  active_platform user_platform NOT NULL DEFAULT 'investor',

  -- Onboarding
  completed_investor_onboarding BOOLEAN DEFAULT FALSE,
  completed_landlord_onboarding BOOLEAN DEFAULT FALSE,

  -- Landlord-specific settings
  landlord_settings JSONB DEFAULT '{}'::JSONB,
  -- Expected: {
  --   "default_ai_enabled": true,
  --   "auto_respond_threshold": 90,
  --   "notification_preferences": {...}
  -- }

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one row per user
  CONSTRAINT unique_user_platform_settings UNIQUE (user_id)
);

-- Indexes for user_platform_settings
CREATE INDEX idx_user_platform_settings_user_id ON user_platform_settings(user_id);
CREATE INDEX idx_user_platform_settings_active ON user_platform_settings(active_platform);

-- ============================================================================
-- 2. EXTEND CRM_CONTACTS TABLE
-- ============================================================================
-- Add columns for Landlord platform (contact_type, source, score, etc.)

-- Add contact_types column (array for multiple types)
ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS contact_types crm_contact_type[] DEFAULT ARRAY[]::crm_contact_type[];

-- Add source column
ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS source crm_contact_source;

-- Add status column
ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS status crm_contact_status DEFAULT 'new';

-- Add score column (0-100 lead score)
ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS score INT CHECK(score >= 0 AND score <= 100);

-- Add tags column
ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add metadata column for flexible data
ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;

-- Add user_id column if it doesn't exist (for RLS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_contacts' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE crm_contacts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_crm_contacts_user_id ON crm_contacts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON crm_contacts(status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_source ON crm_contacts(source) WHERE source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_contacts_score ON crm_contacts(score) WHERE score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crm_contacts_contact_types ON crm_contacts USING GIN(contact_types);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_tags ON crm_contacts USING GIN(tags);

-- ============================================================================
-- 3. RENTAL_INTEGRATIONS TABLE
-- ============================================================================
-- External platform connections (FurnishedFinder, Airbnb, etc.)
CREATE TABLE IF NOT EXISTS rental_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Integration details
  platform rental_platform NOT NULL,
  name TEXT, -- User-friendly name

  -- Authentication
  status rental_integration_status NOT NULL DEFAULT 'disconnected',
  credentials JSONB, -- Encrypted credentials (tokens, API keys)
  -- Note: Credentials should be encrypted at application level

  -- Configuration
  settings JSONB DEFAULT '{}'::JSONB,
  -- Platform-specific settings

  -- Sync settings
  sync_enabled BOOLEAN DEFAULT TRUE,
  sync_frequency_minutes INT DEFAULT 15,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_sync_error TEXT,

  -- Stats
  messages_synced INT DEFAULT 0,
  contacts_synced INT DEFAULT 0,
  bookings_synced INT DEFAULT 0,

  -- Timestamps
  connected_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One integration per platform per user
  CONSTRAINT unique_user_platform_integration UNIQUE (user_id, platform)
);

-- Indexes for rental_integrations
CREATE INDEX idx_rental_integrations_user_id ON rental_integrations(user_id);
CREATE INDEX idx_rental_integrations_platform ON rental_integrations(platform);
CREATE INDEX idx_rental_integrations_status ON rental_integrations(status);
CREATE INDEX idx_rental_integrations_sync ON rental_integrations(user_id, sync_enabled) WHERE sync_enabled = TRUE;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE user_platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_integrations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================================
CREATE TRIGGER trigger_user_platform_settings_updated_at
  BEFORE UPDATE ON user_platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_rental_integrations_updated_at
  BEFORE UPDATE ON rental_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Get or create platform settings
-- ============================================================================
CREATE OR REPLACE FUNCTION get_or_create_platform_settings(p_user_id UUID)
RETURNS user_platform_settings AS $$
DECLARE
  settings user_platform_settings;
BEGIN
  -- Try to get existing settings
  SELECT * INTO settings
  FROM user_platform_settings
  WHERE user_id = p_user_id;

  -- Create if not exists
  IF NOT FOUND THEN
    INSERT INTO user_platform_settings (user_id)
    VALUES (p_user_id)
    RETURNING * INTO settings;
  END IF;

  RETURN settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Switch active platform
-- ============================================================================
CREATE OR REPLACE FUNCTION switch_platform(p_user_id UUID, p_platform user_platform)
RETURNS user_platform_settings AS $$
DECLARE
  settings user_platform_settings;
BEGIN
  UPDATE user_platform_settings
  SET
    active_platform = p_platform,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND p_platform = ANY(enabled_platforms)
  RETURNING * INTO settings;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Platform % is not enabled for this user', p_platform;
  END IF;

  RETURN settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================
INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Created rental support tables and extended crm_contacts',
  jsonb_build_object(
    'migration', '20260127_rental_support_tables',
    'tables_created', ARRAY['user_platform_settings', 'rental_integrations'],
    'tables_modified', ARRAY['crm_contacts'],
    'enums_created', ARRAY['user_platform', 'crm_contact_type', 'crm_contact_source', 'crm_contact_status', 'rental_integration_status'],
    'functions_created', ARRAY['get_or_create_platform_settings', 'switch_platform'],
    'note', 'Multi-platform support and integrations - Zone 2'
  )
);
