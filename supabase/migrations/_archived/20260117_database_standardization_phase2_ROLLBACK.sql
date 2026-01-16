-- ============================================================================
-- ROLLBACK: DATABASE STANDARDIZATION - PHASE 2
-- ============================================================================
-- Purpose: Rollback all Phase 2 table renames to original names
-- Use this if Phase 2 migration needs to be reversed
-- ============================================================================

BEGIN;

-- ============================================================================
-- DROP COMPATIBILITY VIEWS FIRST
-- ============================================================================
-- Must drop views before renaming tables back to avoid name conflicts

-- Batch 3: Billing & Reminders
DROP VIEW IF EXISTS reminder_logs;
DROP VIEW IF EXISTS subscription_events;
DROP VIEW IF EXISTS subscription_notifications;
DROP VIEW IF EXISTS stripe_products;
DROP VIEW IF EXISTS stripe_customers;

-- Batch 2: Security & Email
DROP VIEW IF EXISTS email_change_history;
DROP VIEW IF EXISTS email_preferences;
DROP VIEW IF EXISTS email_logs;
DROP VIEW IF EXISTS user_mfa;
DROP VIEW IF EXISTS api_keys;
DROP VIEW IF EXISTS oauth_tokens;

-- Batch 1: Critical tables
DROP VIEW IF EXISTS lead_notes;
DROP VIEW IF EXISTS lead_contacts;
DROP VIEW IF EXISTS contacts;
DROP VIEW IF EXISTS leads;
DROP VIEW IF EXISTS profiles;

-- ============================================================================
-- ROLLBACK IN REVERSE ORDER (BATCH 3 → BATCH 1)
-- ============================================================================

-- BATCH 3: BILLING & REMINDERS
ALTER TABLE user_reminder_logs RENAME TO reminder_logs;
ALTER TABLE billing_subscription_events RENAME TO subscription_events;
ALTER TABLE billing_subscription_notifications RENAME TO subscription_notifications;
ALTER TABLE billing_stripe_products RENAME TO stripe_products;
ALTER TABLE billing_stripe_customers RENAME TO stripe_customers;

-- BATCH 2: SECURITY & EMAIL DOMAIN
ALTER TABLE security_email_change_history RENAME TO email_change_history;
ALTER TABLE user_email_preferences RENAME TO email_preferences;
ALTER TABLE comms_email_logs RENAME TO email_logs;
ALTER TABLE user_mfa_settings RENAME TO user_mfa;
ALTER TABLE security_api_keys RENAME TO api_keys;
ALTER TABLE security_oauth_tokens RENAME TO oauth_tokens;

-- BATCH 1: CRITICAL USER-FACING TABLES
ALTER TABLE crm_lead_notes RENAME TO lead_notes;
ALTER TABLE crm_lead_contacts RENAME TO lead_contacts;
ALTER TABLE crm_contacts RENAME TO contacts;
ALTER TABLE crm_leads RENAME TO leads;
ALTER TABLE user_profiles RENAME TO profiles;

COMMIT;
