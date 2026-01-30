-- Migration: Fix Timestamp Columns to Use TIMESTAMPTZ
-- Description: Convert timestamp columns to timestamptz for proper timezone handling
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0016_timestamp_without_timezone

-- ============================================================================
-- user_profiles.created_at
-- Converting from timestamp without time zone to timestamptz
-- ============================================================================

ALTER TABLE public.user_profiles
  ALTER COLUMN created_at TYPE timestamptz
  USING created_at AT TIME ZONE 'UTC';

-- ============================================================================
-- NOTE: comms_messages already uses timestamptz for all timestamp columns
-- No changes needed for that table.
-- ============================================================================

-- ============================================================================
-- VERIFICATION QUERY (run after migration)
-- ============================================================================
-- SELECT
--   table_name,
--   column_name,
--   data_type,
--   udt_name
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'user_profiles'
--   AND column_name = 'created_at';
