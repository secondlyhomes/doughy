-- ============================================================================
-- ROLLBACK: COMPREHENSIVE DATABASE STANDARDIZATION
-- ============================================================================
-- Purpose: Rollback all table renames to original names
-- Use this if the migration needs to be reversed
-- ============================================================================

BEGIN;

-- ============================================================================
-- DROP COMPATIBILITY VIEWS FIRST
-- ============================================================================
-- Must drop views before renaming tables back to avoid name conflicts

DROP VIEW IF EXISTS ai_jobs;
DROP VIEW IF EXISTS transcript_segments;
DROP VIEW IF EXISTS transcripts;
DROP VIEW IF EXISTS calls;
DROP VIEW IF EXISTS scheduled_messages;
DROP VIEW IF EXISTS messages;
DROP VIEW IF EXISTS workspace;

-- ROLLBACK IN REVERSE ORDER (GROUP 7 → GROUP 1)

-- ============================================================================
-- GROUP 7: AI/ASSISTANT
-- ============================================================================

ALTER TABLE assistant_jobs RENAME TO ai_jobs;

-- ============================================================================
-- GROUP 6: DEAL MANAGEMENT (NO CHANGES IN FORWARD MIGRATION)
-- ============================================================================

-- 'deals' was kept as-is in forward migration, no rollback needed

-- ============================================================================
-- GROUP 5: CALL/VOICE DOMAIN
-- ============================================================================

ALTER TABLE call_transcript_segments RENAME TO transcript_segments;
ALTER TABLE call_transcripts RENAME TO transcripts;
ALTER TABLE call_logs RENAME TO calls;

-- ============================================================================
-- GROUP 4: COMMUNICATIONS DOMAIN
-- ============================================================================

ALTER TABLE comms_scheduled_messages RENAME TO scheduled_messages;
ALTER TABLE comms_messages RENAME TO messages;

-- ============================================================================
-- GROUP 3: WORKSPACE
-- ============================================================================

ALTER TABLE workspaces RENAME TO workspace;

-- ============================================================================
-- GROUP 2: USER & AUTH
-- ============================================================================

ALTER TABLE user_reminder_states RENAME TO reminder_states;
ALTER TABLE user_onboarding_surveys RENAME TO onboarding_surveys;
ALTER TABLE user_onboarding_steps RENAME TO onboarding_steps;
ALTER TABLE user_onboarding_status RENAME TO onboarding_status;
ALTER TABLE security_reset_tokens RENAME TO reset_tokens;
ALTER TABLE user_mfa_recovery_codes RENAME TO mfa_recovery_codes;
ALTER TABLE user_mfa_pending_setup RENAME TO mfa_pending_setup;

-- ============================================================================
-- GROUP 1: SYSTEM & INFRASTRUCTURE
-- ============================================================================

ALTER TABLE system_scheduled_deletions RENAME TO scheduled_deletions;
ALTER TABLE analytics_feature_usage_stats RENAME TO feature_usage_stats;
ALTER TABLE system_usage_logs RENAME TO usage_logs;
ALTER TABLE system_rate_limits RENAME TO rate_limits;
ALTER TABLE system_feature_flags RENAME TO feature_flags;

COMMIT;
