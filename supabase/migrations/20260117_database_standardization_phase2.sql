-- ============================================================================
-- DATABASE STANDARDIZATION - PHASE 2 (DBA-APPROVED)
-- ============================================================================
-- Purpose: Rename high-impact user-facing tables to follow naming conventions
-- Tables affected: 16
-- Breaking changes: YES (extensive code updates required)
-- DBA Philosophy: Prefix = domain ownership, always plural, boring & literal
-- Deploy: After Phase 1 stable in production (2-4 weeks monitoring)
-- ============================================================================

BEGIN;

-- ============================================================================
-- BATCH 1: CRITICAL USER-FACING TABLES (5 tables - HIGHEST PRIORITY)
-- ============================================================================
-- Impact: HIGH - These are the most queried tables in the system
-- profiles: Used everywhere, generic name costs mental overhead
-- CRM domain: Generic names will collide with future features

ALTER TABLE profiles RENAME TO user_profiles;
ALTER TABLE leads RENAME TO crm_leads;
ALTER TABLE contacts RENAME TO crm_contacts;
ALTER TABLE lead_contacts RENAME TO crm_lead_contacts;
ALTER TABLE lead_notes RENAME TO crm_lead_notes;

-- ============================================================================
-- BATCH 2: SECURITY & EMAIL DOMAIN (6 tables - MEDIUM PRIORITY)
-- ============================================================================
-- Impact: MEDIUM - Security boundaries and communication infrastructure

-- Security domain (3 tables)
ALTER TABLE oauth_tokens RENAME TO security_oauth_tokens;
ALTER TABLE api_keys RENAME TO security_api_keys;
ALTER TABLE user_mfa RENAME TO user_mfa_settings;

-- Email domain (3 tables) - split by ownership
ALTER TABLE email_logs RENAME TO comms_email_logs;
ALTER TABLE email_preferences RENAME TO user_email_preferences;
ALTER TABLE email_change_history RENAME TO security_email_change_history;

-- ============================================================================
-- BATCH 3: BILLING & REMINDERS (5 tables - LOW PRIORITY)
-- ============================================================================
-- Impact: LOW - Already reasonably clear, future-proofing against vendor changes

-- Billing domain (4 tables)
ALTER TABLE stripe_customers RENAME TO billing_stripe_customers;
ALTER TABLE stripe_products RENAME TO billing_stripe_products;
ALTER TABLE subscription_notifications RENAME TO billing_subscription_notifications;
ALTER TABLE subscription_events RENAME TO billing_subscription_events;

-- User reminders (1 table) - consistency with user_reminder_states (Phase 1)
ALTER TABLE reminder_logs RENAME TO user_reminder_logs;

-- ============================================================================
-- COMPATIBILITY VIEWS (Zero-Downtime Deployment)
-- ============================================================================
-- Create updatable views with old names for backward compatibility
-- This allows old code to continue working during code deployment

-- Batch 1: Critical tables
CREATE VIEW profiles AS SELECT * FROM user_profiles;
CREATE VIEW leads AS SELECT * FROM crm_leads;
CREATE VIEW contacts AS SELECT * FROM crm_contacts;
CREATE VIEW lead_contacts AS SELECT * FROM crm_lead_contacts;
CREATE VIEW lead_notes AS SELECT * FROM crm_lead_notes;

-- Batch 2: Security & Email
CREATE VIEW oauth_tokens AS SELECT * FROM security_oauth_tokens;
CREATE VIEW api_keys AS SELECT * FROM security_api_keys;
CREATE VIEW user_mfa AS SELECT * FROM user_mfa_settings;
CREATE VIEW email_logs AS SELECT * FROM comms_email_logs;
CREATE VIEW email_preferences AS SELECT * FROM user_email_preferences;
CREATE VIEW email_change_history AS SELECT * FROM security_email_change_history;

-- Batch 3: Billing & Reminders
CREATE VIEW stripe_customers AS SELECT * FROM billing_stripe_customers;
CREATE VIEW stripe_products AS SELECT * FROM billing_stripe_products;
CREATE VIEW subscription_notifications AS SELECT * FROM billing_subscription_notifications;
CREATE VIEW subscription_events AS SELECT * FROM billing_subscription_events;
CREATE VIEW reminder_logs AS SELECT * FROM user_reminder_logs;

-- Note: For simple SELECT * FROM table views, Postgres treats them as updatable
-- INSERT, UPDATE, DELETE will work automatically on these views

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    expected_tables TEXT[] := ARRAY[
        -- Batch 1
        'user_profiles',
        'crm_leads',
        'crm_contacts',
        'crm_lead_contacts',
        'crm_lead_notes',
        -- Batch 2
        'security_oauth_tokens',
        'security_api_keys',
        'user_mfa_settings',
        'comms_email_logs',
        'user_email_preferences',
        'security_email_change_history',
        -- Batch 3
        'billing_stripe_customers',
        'billing_stripe_products',
        'billing_subscription_notifications',
        'billing_subscription_events',
        'user_reminder_logs'
    ];
    expected_views TEXT[] := ARRAY[
        -- Batch 1
        'profiles',
        'leads',
        'contacts',
        'lead_contacts',
        'lead_notes',
        -- Batch 2
        'oauth_tokens',
        'api_keys',
        'user_mfa',
        'email_logs',
        'email_preferences',
        'email_change_history',
        -- Batch 3
        'stripe_customers',
        'stripe_products',
        'subscription_notifications',
        'subscription_events',
        'reminder_logs'
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

    RAISE NOTICE 'All 16 tables renamed successfully ✅';
    RAISE NOTICE 'All 16 compatibility views created ✅';
    RAISE NOTICE 'Phase 2 migration complete - monitor before deploying cleanup';
END $$;

COMMIT;
