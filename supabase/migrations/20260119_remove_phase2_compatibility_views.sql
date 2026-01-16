-- ============================================================================
-- CLEANUP: REMOVE PHASE 2 COMPATIBILITY VIEWS
-- ============================================================================
-- Purpose: Remove temporary compatibility views after Phase 2 code migration complete
-- Deploy: 24-48 hours after Phase 2 migration
-- Requirement: All code must be updated to use new table names first
-- ============================================================================

BEGIN;

-- ============================================================================
-- DROP COMPATIBILITY VIEWS
-- ============================================================================
-- These views were created to allow zero-downtime deployment
-- Old code could continue using old table names during transition
-- Now that code is updated, we can safely remove these views

-- Batch 1: Critical tables (highest impact)
DROP VIEW IF EXISTS profiles;
DROP VIEW IF EXISTS leads;
DROP VIEW IF EXISTS contacts;
DROP VIEW IF EXISTS lead_contacts;
DROP VIEW IF EXISTS lead_notes;

-- Batch 2: Security & Email
DROP VIEW IF EXISTS oauth_tokens;
DROP VIEW IF EXISTS api_keys;
DROP VIEW IF EXISTS user_mfa;
DROP VIEW IF EXISTS email_logs;
DROP VIEW IF EXISTS email_preferences;
DROP VIEW IF EXISTS email_change_history;

-- Batch 3: Billing & Reminders
DROP VIEW IF EXISTS stripe_customers;
DROP VIEW IF EXISTS stripe_products;
DROP VIEW IF EXISTS subscription_notifications;
DROP VIEW IF EXISTS subscription_events;
DROP VIEW IF EXISTS reminder_logs;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Ensure views are gone and tables still exist

DO $$
DECLARE
    remaining_views TEXT[] := '{}';
    view_name TEXT;
    expected_views TEXT[] := ARRAY[
        'profiles', 'leads', 'contacts', 'lead_contacts', 'lead_notes',
        'oauth_tokens', 'api_keys', 'user_mfa',
        'email_logs', 'email_preferences', 'email_change_history',
        'stripe_customers', 'stripe_products',
        'subscription_notifications', 'subscription_events',
        'reminder_logs'
    ];
    expected_tables TEXT[] := ARRAY[
        'user_profiles', 'crm_leads', 'crm_contacts', 'crm_lead_contacts', 'crm_lead_notes',
        'security_oauth_tokens', 'security_api_keys', 'user_mfa_settings',
        'comms_email_logs', 'user_email_preferences', 'security_email_change_history',
        'billing_stripe_customers', 'billing_stripe_products',
        'billing_subscription_notifications', 'billing_subscription_events',
        'user_reminder_logs'
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

    RAISE NOTICE 'All 16 Phase 2 compatibility views removed successfully ✅';
    RAISE NOTICE 'All 16 renamed tables verified intact ✅';
    RAISE NOTICE 'Code must now use new table names only';
END $$;

COMMIT;
