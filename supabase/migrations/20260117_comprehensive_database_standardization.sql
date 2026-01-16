-- ============================================================================
-- COMPREHENSIVE DATABASE STANDARDIZATION (DBA-APPROVED)
-- ============================================================================
-- Purpose: Standardize all table names following DBA-approved conventions
-- Tables affected: 20
-- Breaking changes: YES (code updates required for 2 tables: deals, ai_jobs)
-- DBA Philosophy: Prefix = domain ownership, always plural, boring & literal
-- ============================================================================

BEGIN;

-- ============================================================================
-- GROUP 1: SYSTEM & INFRASTRUCTURE (5 tables - zero code impact)
-- ============================================================================

ALTER TABLE feature_flags RENAME TO system_feature_flags;
ALTER TABLE rate_limits RENAME TO system_rate_limits;
ALTER TABLE usage_logs RENAME TO system_usage_logs;
ALTER TABLE feature_usage_stats RENAME TO analytics_feature_usage_stats;
ALTER TABLE scheduled_deletions RENAME TO system_scheduled_deletions;

-- ============================================================================
-- GROUP 2: USER & AUTH DOMAIN (7 tables - zero code impact)
-- ============================================================================

ALTER TABLE mfa_pending_setup RENAME TO user_mfa_pending_setup;
ALTER TABLE mfa_recovery_codes RENAME TO user_mfa_recovery_codes;
ALTER TABLE reset_tokens RENAME TO security_reset_tokens;
ALTER TABLE onboarding_status RENAME TO user_onboarding_status;
ALTER TABLE onboarding_steps RENAME TO user_onboarding_steps;
ALTER TABLE onboarding_surveys RENAME TO user_onboarding_surveys;
ALTER TABLE reminder_states RENAME TO user_reminder_states;

-- ============================================================================
-- GROUP 3: WORKSPACE (1 table - pluralization only)
-- ============================================================================

ALTER TABLE workspace RENAME TO workspaces;

-- ============================================================================
-- GROUP 4: COMMUNICATIONS DOMAIN (2 tables - zero code impact)
-- ============================================================================

ALTER TABLE messages RENAME TO comms_messages;
ALTER TABLE scheduled_messages RENAME TO comms_scheduled_messages;

-- ============================================================================
-- GROUP 5: CALL/VOICE DOMAIN (3 tables - zero code impact)
-- ============================================================================

ALTER TABLE calls RENAME TO call_logs;
ALTER TABLE transcripts RENAME TO call_transcripts;
ALTER TABLE transcript_segments RENAME TO call_transcript_segments;

-- ============================================================================
-- GROUP 6: DEAL MANAGEMENT (NO CHANGES)
-- ============================================================================

-- Keep 'deals' as-is (DBA recommendation: clear entity name, no semantic drift)

-- ============================================================================
-- GROUP 7: AI/ASSISTANT (1 table - 10 code references)
-- ============================================================================

ALTER TABLE ai_jobs RENAME TO assistant_jobs;

-- ============================================================================
-- COMPATIBILITY VIEWS (Zero-Downtime Deployment)
-- ============================================================================

-- Create updatable views with old names for backward compatibility
-- This allows old code to continue working during code deployment

CREATE VIEW workspace AS SELECT * FROM workspaces;
CREATE VIEW messages AS SELECT * FROM comms_messages;
CREATE VIEW scheduled_messages AS SELECT * FROM comms_scheduled_messages;
CREATE VIEW calls AS SELECT * FROM call_logs;
CREATE VIEW transcripts AS SELECT * FROM call_transcripts;
CREATE VIEW transcript_segments AS SELECT * FROM call_transcript_segments;
CREATE VIEW ai_jobs AS SELECT * FROM assistant_jobs;

-- Note: For simple SELECT * FROM table views, Postgres treats them as updatable
-- INSERT, UPDATE, DELETE will work automatically on these views

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    expected_tables TEXT[] := ARRAY[
        'system_feature_flags',
        'system_rate_limits',
        'system_usage_logs',
        'analytics_feature_usage_stats',
        'system_scheduled_deletions',
        'user_mfa_pending_setup',
        'user_mfa_recovery_codes',
        'security_reset_tokens',
        'user_onboarding_status',
        'user_onboarding_steps',
        'user_onboarding_surveys',
        'user_reminder_states',
        'workspaces',
        'comms_messages',
        'comms_scheduled_messages',
        'call_logs',
        'call_transcripts',
        'call_transcript_segments',
        'assistant_jobs'
    ];
    expected_views TEXT[] := ARRAY[
        'workspace',
        'messages',
        'scheduled_messages',
        'calls',
        'transcripts',
        'transcript_segments',
        'ai_jobs'
    ];
    tbl TEXT;
    view_name TEXT;
    missing_tables TEXT[] := '{}';
    missing_views TEXT[] := '{}';
BEGIN
    -- Check all tables exist
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

    -- Check all compatibility views exist
    FOREACH view_name IN ARRAY expected_views
    LOOP
        IF NOT EXISTS (
            SELECT FROM information_schema.views
            WHERE table_schema = 'public'
            AND table_name = view_name
        ) THEN
            missing_views := array_append(missing_views, view_name);
        END IF;
    END LOOP;

    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing tables after migration: %', missing_tables;
    END IF;

    IF array_length(missing_views, 1) > 0 THEN
        RAISE EXCEPTION 'Missing compatibility views: %', missing_views;
    END IF;

    RAISE NOTICE 'All 19 tables renamed successfully ✅';
    RAISE NOTICE 'All 7 compatibility views created ✅';
END $$;

COMMIT;
