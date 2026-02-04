-- =============================================================================
-- Migration: Create verified_addresses table
-- Schema: public (shared infrastructure - cross-domain)
-- Purpose: Shared address lookup table for autocomplete across all domains
-- DBA: Claude (Opus 4.5)
-- Date: 2026-02-01
--
-- Key Features:
-- - Verified addresses (from OSM geocoding) are public within workspace
-- - Manual/custom addresses are private to creator
-- - Full-text search on formatted address
-- - Deduplication via unique constraint
-- =============================================================================

BEGIN;

-- Step 1: Create ENUM type for address source
-- Pattern: singular form, snake_case (per DBA conventions)
CREATE TYPE address_source AS ENUM ('openstreetmap', 'manual');

-- Step 2: Create the table
CREATE TABLE public.verified_addresses (
  -- Primary key (UUID pattern per DBA conventions)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Address fields
  formatted_address TEXT NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  county TEXT,
  country TEXT DEFAULT 'US',

  -- Geocoding
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  -- Source & verification (ENUM type per DBA conventions)
  source address_source NOT NULL,
  osm_place_id TEXT,

  -- Boolean flags (is_ prefix per DBA conventions)
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,  -- false = private custom address

  -- Count columns (_count suffix per DBA conventions)
  usage_count INTEGER DEFAULT 0,

  -- Multi-tenancy (workspace pattern per DBA conventions)
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES auth.users(id),

  -- Timestamps (TIMESTAMPTZ per DBA conventions)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Deduplication constraint
  -- Unique per workspace + formatted address + OSM place ID (for deduplication)
  CONSTRAINT unique_verified_addresses_formatted
    UNIQUE (formatted_address, workspace_id, COALESCE(osm_place_id, ''))
);

-- Step 3: Create indexes (per DBA naming conventions)
-- idx_{table}_{column}

CREATE INDEX idx_verified_addresses_workspace_id
  ON verified_addresses(workspace_id);

CREATE INDEX idx_verified_addresses_user_id
  ON verified_addresses(user_id);

-- Full-text search index for autocomplete
CREATE INDEX idx_verified_addresses_search
  ON verified_addresses
  USING gin(to_tsvector('english', formatted_address || ' ' || city || ' ' || state));

-- Partial index for public addresses (more efficient filtering)
CREATE INDEX idx_verified_addresses_is_public
  ON verified_addresses(workspace_id, is_public)
  WHERE is_public = TRUE;

-- Index for user's private addresses
CREATE INDEX idx_verified_addresses_user_private
  ON verified_addresses(user_id, is_public)
  WHERE is_public = FALSE;

-- Index for sorting by usage
CREATE INDEX idx_verified_addresses_usage
  ON verified_addresses(workspace_id, usage_count DESC);

-- Step 4: Enable RLS
ALTER TABLE verified_addresses ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies (workspace pattern per DBA conventions)
-- Pattern: "{table}_{scope}_{action}"

-- Workspace members can view public verified addresses in their workspace
CREATE POLICY "verified_addresses_workspace_public_select"
  ON verified_addresses FOR SELECT
  USING (
    is_public = TRUE
    AND workspace_id IN (SELECT user_workspace_ids())
  );

-- Users can view their own private addresses
CREATE POLICY "verified_addresses_user_private_select"
  ON verified_addresses FOR SELECT
  USING (
    is_public = FALSE
    AND user_id = auth.uid()
  );

-- Users can insert addresses in their workspace
CREATE POLICY "verified_addresses_workspace_insert"
  ON verified_addresses FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT user_workspace_ids())
    AND user_id = auth.uid()
  );

-- Users can update their own addresses
CREATE POLICY "verified_addresses_user_update"
  ON verified_addresses FOR UPDATE
  USING (user_id = auth.uid());

-- Workspace owners can delete any address in their workspace
CREATE POLICY "verified_addresses_owner_delete"
  ON verified_addresses FOR DELETE
  USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- Step 6: Auto-set trigger for workspace_id (per DBA conventions)
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.verified_addresses;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.verified_addresses
  FOR EACH ROW EXECUTE FUNCTION set_workspace_id_from_user();

-- Step 7: Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_verified_addresses_updated_at ON public.verified_addresses;
CREATE TRIGGER set_verified_addresses_updated_at
  BEFORE UPDATE ON verified_addresses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Step 8: Add column comments
COMMENT ON TABLE verified_addresses IS 'Shared address lookup table for autocomplete. Verified addresses (from geocoding) are public within workspace. Manual/custom addresses are private to creator.';
COMMENT ON COLUMN verified_addresses.formatted_address IS 'Full formatted address string for display';
COMMENT ON COLUMN verified_addresses.street_address IS 'Street number and name';
COMMENT ON COLUMN verified_addresses.city IS 'City name';
COMMENT ON COLUMN verified_addresses.state IS 'State abbreviation (2 chars)';
COMMENT ON COLUMN verified_addresses.zip IS 'ZIP/postal code';
COMMENT ON COLUMN verified_addresses.county IS 'County name (optional)';
COMMENT ON COLUMN verified_addresses.country IS 'Country code (default US)';
COMMENT ON COLUMN verified_addresses.latitude IS 'GPS latitude coordinate';
COMMENT ON COLUMN verified_addresses.longitude IS 'GPS longitude coordinate';
COMMENT ON COLUMN verified_addresses.source IS 'Address source: openstreetmap (geocoded) or manual (user-entered)';
COMMENT ON COLUMN verified_addresses.osm_place_id IS 'OpenStreetMap place ID for deduplication';
COMMENT ON COLUMN verified_addresses.is_verified IS 'TRUE if address came from geocoding API, FALSE if manually entered';
COMMENT ON COLUMN verified_addresses.is_public IS 'TRUE for verified addresses (visible to workspace), FALSE for custom/private addresses (visible only to creator)';
COMMENT ON COLUMN verified_addresses.usage_count IS 'Number of times this address has been selected';
COMMENT ON COLUMN verified_addresses.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN verified_addresses.user_id IS 'User who created this address (audit trail)';

COMMIT;
