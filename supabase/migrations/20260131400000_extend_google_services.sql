-- Migration: Extend rental_email_connections for unified Google OAuth
-- Description: Add google_services column to track which Google services are enabled
-- Date: 2026-01-31
--
-- DBA Best Practices Applied:
-- - ENUM type for google_service values (type safety)
-- - External ID naming: google_calendar_id (clarifies source)
-- - TIMESTAMPTZ for timestamp columns
-- - Proper index naming: idx_{table}_{column}
-- - GIN index for array column
-- - Idempotent operations (IF NOT EXISTS checks)
-- - Column comments for documentation
-- - Migration logged to system_logs
--
-- Background: Gmail and Google Calendar currently use separate OAuth systems.
-- This migration consolidates them by extending the working Gmail infrastructure
-- to support Calendar access with shared OAuth credentials.
--
-- Changes:
-- - Create google_service ENUM type for type safety
-- - Add google_services array to track enabled services (gmail, calendar)
-- - Add calendar_sync_token for Calendar API incremental sync
-- - Add google_calendar_id for target calendar (usually 'primary')
-- - Add last_calendar_sync_at timestamp
-- - Backfill existing rows with ['gmail'] in google_services

BEGIN;

-- ============================================================================
-- STEP 1: Create ENUM type for Google services
-- ============================================================================
-- Using ENUM for type safety - invalid service names are rejected at DB level

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'google_service') THEN
    CREATE TYPE google_service AS ENUM ('gmail', 'calendar');
    COMMENT ON TYPE google_service IS 'Google API services that can be enabled for a connection';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Add google_services column
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_email_connections' AND column_name = 'google_services'
  ) THEN
    ALTER TABLE rental_email_connections
      ADD COLUMN google_services google_service[] DEFAULT ARRAY['gmail']::google_service[];

    COMMENT ON COLUMN rental_email_connections.google_services IS
      'Array of enabled Google services for this connection (uses google_service ENUM)';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Add calendar_sync_token for incremental sync
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_email_connections' AND column_name = 'calendar_sync_token'
  ) THEN
    ALTER TABLE rental_email_connections
      ADD COLUMN calendar_sync_token TEXT;

    COMMENT ON COLUMN rental_email_connections.calendar_sync_token IS
      'Google Calendar API sync token for incremental sync';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Add google_calendar_id column (external ID naming convention)
-- ============================================================================
-- Named google_calendar_id to clarify this is an external ID from Google

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_email_connections' AND column_name = 'google_calendar_id'
  ) THEN
    ALTER TABLE rental_email_connections
      ADD COLUMN google_calendar_id TEXT DEFAULT 'primary';

    COMMENT ON COLUMN rental_email_connections.google_calendar_id IS
      'External Google Calendar ID to sync (usually "primary" for main calendar)';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Add last_calendar_sync_at timestamp
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_email_connections' AND column_name = 'last_calendar_sync_at'
  ) THEN
    ALTER TABLE rental_email_connections
      ADD COLUMN last_calendar_sync_at TIMESTAMPTZ;

    COMMENT ON COLUMN rental_email_connections.last_calendar_sync_at IS
      'When we last synced calendar events (TIMESTAMPTZ for timezone awareness)';
  END IF;
END $$;

-- ============================================================================
-- STEP 6: Backfill existing Gmail connections
-- ============================================================================

UPDATE rental_email_connections
SET google_services = ARRAY['gmail']::google_service[]
WHERE provider = 'gmail'
  AND (google_services IS NULL OR google_services = '{}');

-- ============================================================================
-- STEP 7: Create index for services lookup (GIN for array containment queries)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_rental_email_connections_google_services
  ON rental_email_connections USING GIN(google_services);

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Extended rental_email_connections for unified Google OAuth',
  jsonb_build_object(
    'migration', '20260131400000_extend_google_services',
    'enums_created', ARRAY['google_service'],
    'columns_added', ARRAY[
      'google_services',
      'calendar_sync_token',
      'google_calendar_id',
      'last_calendar_sync_at'
    ],
    'note', 'Consolidates Gmail and Calendar OAuth into single connection record with ENUM type safety'
  )
);

COMMIT;
