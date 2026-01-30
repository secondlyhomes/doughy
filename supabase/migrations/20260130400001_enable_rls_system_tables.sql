-- Migration: Enable RLS on System Tables
-- Description: Document extension-owned tables that cannot have RLS enabled
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public

-- ============================================================================
-- NOTE: Both spatial_ref_sys and wrappers_fdw_stats are EXTENSION-OWNED TABLES
--
-- These tables are owned by their respective extensions (postgis and wrappers)
-- and cannot be modified by application-level migrations. This is expected
-- behavior and these tables are excluded from RLS requirements.
--
-- - spatial_ref_sys: Contains public coordinate system definitions (read-only)
-- - wrappers_fdw_stats: Contains FDW statistics (internal system use)
--
-- Both tables are safe to leave without RLS as they:
-- 1. Contain no user data
-- 2. Are read-only system reference tables
-- 3. Are controlled by their respective extensions
-- ============================================================================

-- This migration is a no-op but documents the audit finding resolution.
SELECT 'Extension-owned tables (spatial_ref_sys, wrappers_fdw_stats) cannot have RLS enabled by application migrations. This is expected and acceptable.' AS note;
