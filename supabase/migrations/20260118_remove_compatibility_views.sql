-- ============================================================================
-- CLEANUP: REMOVE COMPATIBILITY VIEWS
-- ============================================================================
-- Purpose: Remove temporary compatibility views after code migration complete
-- Deploy: 24-48 hours after Phase 1 migration (20260117)
-- Requirement: All code must be updated to use new table names first
-- ============================================================================

BEGIN;

-- ============================================================================
-- DROP COMPATIBILITY VIEWS
-- ============================================================================
-- These views were created to allow zero-downtime deployment
-- Old code could continue using old table names during transition
-- Now that code is updated, we can safely remove these views

DROP VIEW IF EXISTS ai_jobs;
DROP VIEW IF EXISTS transcript_segments;
DROP VIEW IF EXISTS transcripts;
DROP VIEW IF EXISTS calls;
DROP VIEW IF EXISTS scheduled_messages;
DROP VIEW IF EXISTS messages;
DROP VIEW IF EXISTS workspace;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Ensure views are gone and tables still exist

DO $$
DECLARE
    remaining_views TEXT[] := '{}';
    view_name TEXT;
    expected_views TEXT[] := ARRAY[
        'workspace',
        'messages',
        'scheduled_messages',
        'calls',
        'transcripts',
        'transcript_segments',
        'ai_jobs'
    ];
    expected_tables TEXT[] := ARRAY[
        'workspaces',
        'comms_messages',
        'comms_scheduled_messages',
        'call_logs',
        'call_transcripts',
        'call_transcript_segments',
        'assistant_jobs'
    ];
    tbl TEXT;
    missing_tables TEXT[] := '{}';
BEGIN
    -- Check that views are gone
    FOREACH view_name IN ARRAY expected_views
    LOOP
        IF EXISTS (
            SELECT FROM information_schema.views
            WHERE table_schema = 'public'
            AND table_name = view_name
        ) THEN
            remaining_views := array_append(remaining_views, view_name);
        END IF;
    END LOOP;

    -- Check that tables still exist
    FOREACH tbl IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = tbl
        ) THEN
            missing_tables := array_append(missing_tables, tbl);
        END IF;
    END LOOP;

    IF array_length(remaining_views, 1) > 0 THEN
        RAISE EXCEPTION 'Failed to drop compatibility views: %', remaining_views;
    END IF;

    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Tables missing after view cleanup: %', missing_tables;
    END IF;

    RAISE NOTICE 'All 7 compatibility views removed successfully ✅';
    RAISE NOTICE 'All 7 renamed tables verified intact ✅';
    RAISE NOTICE 'Code must now use new table names only';
END $$;

COMMIT;
