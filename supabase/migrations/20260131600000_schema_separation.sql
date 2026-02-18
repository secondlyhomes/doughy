-- Migration: Schema Separation (Fully Idempotent)
-- Move tables from public schema to domain-specific schemas
-- Date: 2026-01-31
--
-- This migration creates proper PostgreSQL schemas and moves tables into them.
-- Handles all possible partial application states:
-- 1. Table in public with old name → move to schema and rename
-- 2. Table in target schema with old name → just rename
-- 3. Table already in target schema with final name → skip

BEGIN;

-- ============================================================================
-- STEP 1: Create schemas (IF NOT EXISTS handles re-runs)
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS investor;
CREATE SCHEMA IF NOT EXISTS landlord;
CREATE SCHEMA IF NOT EXISTS ai;
CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS integrations;

COMMENT ON SCHEMA investor IS 'Real estate investment tables - deals, properties, campaigns, portfolio';
COMMENT ON SCHEMA landlord IS 'Rental property management tables - properties, bookings, conversations';
COMMENT ON SCHEMA ai IS 'AI/ML related tables - jobs, sessions, moltbot, capture items';
COMMENT ON SCHEMA crm IS 'Customer relationship management - contacts, leads, opt-outs';
COMMENT ON SCHEMA integrations IS 'Third-party integration tables - Seam, Gmail, Meta, PostGrid';

-- ============================================================================
-- STEP 2: Grant schema usage to roles
-- ============================================================================

GRANT USAGE ON SCHEMA investor TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA landlord TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA ai TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA crm TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA integrations TO authenticated, anon, service_role;

-- ============================================================================
-- STEP 3: Move investor tables using a helper function for idempotency
-- ============================================================================

-- Create a helper function to safely move and rename tables
CREATE OR REPLACE FUNCTION pg_temp.safe_move_table(
  source_schema TEXT,
  source_name TEXT,
  target_schema TEXT,
  target_name TEXT
) RETURNS VOID AS $$
BEGIN
  -- Case 1: Already in target schema with target name - skip
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = target_schema AND table_name = target_name) THEN
    RETURN;
  END IF;

  -- Case 2: In target schema with source name - just rename
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = target_schema AND table_name = source_name) THEN
    EXECUTE format('ALTER TABLE %I.%I RENAME TO %I', target_schema, source_name, target_name);
    RETURN;
  END IF;

  -- Case 3: In source schema - move and rename
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = source_schema AND table_name = source_name) THEN
    EXECUTE format('ALTER TABLE %I.%I SET SCHEMA %I', source_schema, source_name, target_schema);
    IF source_name != target_name THEN
      EXECUTE format('ALTER TABLE %I.%I RENAME TO %I', target_schema, source_name, target_name);
    END IF;
    RETURN;
  END IF;

  -- Table doesn't exist anywhere - that's fine, skip
END;
$$ LANGUAGE plpgsql;

-- Move investor tables
SELECT pg_temp.safe_move_table('public', 'investor_deals_pipeline', 'investor', 'deals_pipeline');
SELECT pg_temp.safe_move_table('public', 'investor_deal_events', 'investor', 'deal_events');
SELECT pg_temp.safe_move_table('public', 'investor_properties', 'investor', 'properties');
SELECT pg_temp.safe_move_table('public', 'investor_property_documents', 'investor', 'property_documents');
SELECT pg_temp.safe_move_table('public', 'investor_property_images', 'investor', 'property_images');
SELECT pg_temp.safe_move_table('public', 'investor_property_analyses', 'investor', 'property_analyses');
SELECT pg_temp.safe_move_table('public', 'investor_property_debts', 'investor', 'property_debts');
SELECT pg_temp.safe_move_table('public', 'investor_property_mortgages', 'investor', 'property_mortgages');
SELECT pg_temp.safe_move_table('public', 'investor_documents', 'investor', 'documents');
SELECT pg_temp.safe_move_table('public', 'investor_document_embeddings', 'investor', 'document_embeddings');
SELECT pg_temp.safe_move_table('public', 'investor_document_queue_items', 'investor', 'document_queue_items');
SELECT pg_temp.safe_move_table('public', 'investor_campaigns', 'investor', 'campaigns');
SELECT pg_temp.safe_move_table('public', 'investor_drip_campaign_steps', 'investor', 'drip_campaign_steps');
SELECT pg_temp.safe_move_table('public', 'investor_drip_enrollments', 'investor', 'drip_enrollments');
SELECT pg_temp.safe_move_table('public', 'investor_drip_touch_logs', 'investor', 'drip_touch_logs');
SELECT pg_temp.safe_move_table('public', 'investor_agents', 'investor', 'agents');
SELECT pg_temp.safe_move_table('public', 'investor_follow_ups', 'investor', 'follow_ups');
SELECT pg_temp.safe_move_table('public', 'investor_outreach_templates', 'investor', 'outreach_templates');
SELECT pg_temp.safe_move_table('public', 'investor_conversations', 'investor', 'conversations');
SELECT pg_temp.safe_move_table('public', 'investor_messages', 'investor', 'messages');
SELECT pg_temp.safe_move_table('public', 'investor_ai_queue_items', 'investor', 'ai_queue_items');
SELECT pg_temp.safe_move_table('public', 'investor_ai_patterns', 'investor', 'ai_patterns');
SELECT pg_temp.safe_move_table('public', 'investor_ai_confidence_settings', 'investor', 'ai_confidence_settings');
SELECT pg_temp.safe_move_table('public', 'investor_ai_response_outcomes', 'investor', 'ai_response_outcomes');
SELECT pg_temp.safe_move_table('public', 'investor_comps', 'investor', 'comps');
SELECT pg_temp.safe_move_table('public', 'investor_repair_estimates', 'investor', 'repair_estimates');
SELECT pg_temp.safe_move_table('public', 'investor_financing_scenarios', 'investor', 'financing_scenarios');
SELECT pg_temp.safe_move_table('public', 'investor_buying_criteria', 'investor', 'buying_criteria');
SELECT pg_temp.safe_move_table('public', 'investor_lead_properties', 'investor', 'lead_properties');
SELECT pg_temp.safe_move_table('public', 'investor_portfolio_entries', 'investor', 'portfolio_entries');
SELECT pg_temp.safe_move_table('public', 'investor_portfolio_groups', 'investor', 'portfolio_groups');
SELECT pg_temp.safe_move_table('public', 'investor_portfolio_monthly_records', 'investor', 'portfolio_monthly_records');
SELECT pg_temp.safe_move_table('public', 'investor_portfolio_mortgages', 'investor', 'portfolio_mortgages');
SELECT pg_temp.safe_move_table('public', 'investor_portfolio_valuations', 'investor', 'portfolio_valuations');

-- ============================================================================
-- STEP 4: Move landlord tables
-- ============================================================================

SELECT pg_temp.safe_move_table('public', 'landlord_properties', 'landlord', 'properties');
SELECT pg_temp.safe_move_table('public', 'landlord_rooms', 'landlord', 'rooms');
SELECT pg_temp.safe_move_table('public', 'landlord_bookings', 'landlord', 'bookings');
SELECT pg_temp.safe_move_table('public', 'landlord_booking_charges', 'landlord', 'booking_charges');
SELECT pg_temp.safe_move_table('public', 'landlord_deposit_settlements', 'landlord', 'deposit_settlements');
SELECT pg_temp.safe_move_table('public', 'landlord_conversations', 'landlord', 'conversations');
SELECT pg_temp.safe_move_table('public', 'landlord_messages', 'landlord', 'messages');
SELECT pg_temp.safe_move_table('public', 'landlord_ai_queue_items', 'landlord', 'ai_queue_items');
SELECT pg_temp.safe_move_table('public', 'landlord_templates', 'landlord', 'templates');
SELECT pg_temp.safe_move_table('public', 'landlord_guest_messages', 'landlord', 'guest_messages');
SELECT pg_temp.safe_move_table('public', 'landlord_guest_templates', 'landlord', 'guest_templates');
SELECT pg_temp.safe_move_table('public', 'landlord_inventory_items', 'landlord', 'inventory_items');
SELECT pg_temp.safe_move_table('public', 'landlord_maintenance_records', 'landlord', 'maintenance_records');
SELECT pg_temp.safe_move_table('public', 'landlord_turnovers', 'landlord', 'turnovers');
SELECT pg_temp.safe_move_table('public', 'landlord_turnover_templates', 'landlord', 'turnover_templates');
SELECT pg_temp.safe_move_table('public', 'landlord_vendors', 'landlord', 'vendors');
SELECT pg_temp.safe_move_table('public', 'landlord_vendor_messages', 'landlord', 'vendor_messages');
SELECT pg_temp.safe_move_table('public', 'landlord_integrations', 'landlord', 'integrations');
SELECT pg_temp.safe_move_table('public', 'landlord_email_connections', 'landlord', 'email_connections');
SELECT pg_temp.safe_move_table('public', 'landlord_settings', 'landlord', 'settings');

-- ============================================================================
-- STEP 5: Move AI tables
-- ============================================================================

SELECT pg_temp.safe_move_table('public', 'ai_jobs', 'ai', 'jobs');
SELECT pg_temp.safe_move_table('public', 'ai_sessions', 'ai', 'sessions');
SELECT pg_temp.safe_move_table('public', 'ai_response_outcomes', 'ai', 'response_outcomes');
SELECT pg_temp.safe_move_table('public', 'ai_auto_send_rules', 'ai', 'auto_send_rules');
SELECT pg_temp.safe_move_table('public', 'ai_capture_items', 'ai', 'capture_items');
SELECT pg_temp.safe_move_table('public', 'ai_confidence_adjustments', 'ai', 'confidence_adjustments');
SELECT pg_temp.safe_move_table('public', 'ai_security_audit_log', 'ai', 'security_audit_log');

-- Moltbot tables
SELECT pg_temp.safe_move_table('public', 'ai_moltbot_security_logs', 'ai', 'moltbot_security_logs');
SELECT pg_temp.safe_move_table('public', 'ai_moltbot_rate_limits', 'ai', 'moltbot_rate_limits');
SELECT pg_temp.safe_move_table('public', 'ai_moltbot_blocked_patterns', 'ai', 'moltbot_blocked_patterns');
SELECT pg_temp.safe_move_table('public', 'ai_moltbot_blocked_ips', 'ai', 'moltbot_blocked_ips');
SELECT pg_temp.safe_move_table('public', 'ai_moltbot_user_threat_scores', 'ai', 'moltbot_user_threat_scores');
SELECT pg_temp.safe_move_table('public', 'ai_moltbot_circuit_breakers', 'ai', 'moltbot_circuit_breakers');
SELECT pg_temp.safe_move_table('public', 'ai_moltbot_security_patterns_cache', 'ai', 'moltbot_security_patterns_cache');
SELECT pg_temp.safe_move_table('public', 'ai_moltbot_user_memories', 'ai', 'moltbot_user_memories');
SELECT pg_temp.safe_move_table('public', 'ai_moltbot_episodic_memories', 'ai', 'moltbot_episodic_memories');
SELECT pg_temp.safe_move_table('public', 'ai_moltbot_knowledge_sources', 'ai', 'moltbot_knowledge_sources');
SELECT pg_temp.safe_move_table('public', 'ai_moltbot_knowledge_chunks', 'ai', 'moltbot_knowledge_chunks');
SELECT pg_temp.safe_move_table('public', 'ai_moltbot_knowledge_tags', 'ai', 'moltbot_knowledge_tags');
SELECT pg_temp.safe_move_table('public', 'ai_moltbot_knowledge_chunk_tags', 'ai', 'moltbot_knowledge_chunk_tags');
SELECT pg_temp.safe_move_table('public', 'ai_moltbot_global_knowledge', 'ai', 'moltbot_global_knowledge');
SELECT pg_temp.safe_move_table('public', 'ai_moltbot_learning_queue_items', 'ai', 'moltbot_learning_queue_items');
SELECT pg_temp.safe_move_table('public', 'ai_moltbot_sync_records', 'ai', 'moltbot_sync_records');
SELECT pg_temp.safe_move_table('public', 'ai_moltbot_response_examples', 'ai', 'moltbot_response_examples');
SELECT pg_temp.safe_move_table('public', 'ai_moltbot_email_analyses', 'ai', 'moltbot_email_analyses');

-- ============================================================================
-- STEP 6: Move CRM tables
-- ============================================================================

SELECT pg_temp.safe_move_table('public', 'crm_contacts', 'crm', 'contacts');
SELECT pg_temp.safe_move_table('public', 'crm_leads', 'crm', 'leads');
SELECT pg_temp.safe_move_table('public', 'crm_skip_trace_results', 'crm', 'skip_trace_results');
SELECT pg_temp.safe_move_table('public', 'contact_opt_outs', 'crm', 'opt_outs');
SELECT pg_temp.safe_move_table('public', 'contact_touches', 'crm', 'touches');

-- ============================================================================
-- STEP 7: Move integrations tables
-- ============================================================================

SELECT pg_temp.safe_move_table('public', 'seam_connected_devices', 'integrations', 'seam_connected_devices');
SELECT pg_temp.safe_move_table('public', 'seam_workspaces', 'integrations', 'seam_workspaces');
SELECT pg_temp.safe_move_table('public', 'seam_access_codes', 'integrations', 'seam_access_codes');
SELECT pg_temp.safe_move_table('public', 'seam_lock_events', 'integrations', 'seam_lock_events');
SELECT pg_temp.safe_move_table('public', 'user_integrations', 'integrations', 'user_integrations');
SELECT pg_temp.safe_move_table('public', 'user_gmail_tokens', 'integrations', 'gmail_tokens');
SELECT pg_temp.safe_move_table('public', 'meta_dm_credentials', 'integrations', 'meta_dm_credentials');
SELECT pg_temp.safe_move_table('public', 'postgrid_credentials', 'integrations', 'postgrid_credentials');
SELECT pg_temp.safe_move_table('public', 'mail_credit_transactions', 'integrations', 'mail_credit_transactions');

-- ============================================================================
-- STEP 8: Grant table permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA investor TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA investor TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA investor TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA landlord TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA landlord TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA landlord TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ai TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA ai TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA ai TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA crm TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA crm TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA crm TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA integrations TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA integrations TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA integrations TO service_role;

-- ============================================================================
-- STEP 9: Grant sequence permissions
-- ============================================================================

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA investor TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA landlord TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ai TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA crm TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA integrations TO authenticated;

-- ============================================================================
-- STEP 10: Set default privileges for future tables
-- ============================================================================

ALTER DEFAULT PRIVILEGES IN SCHEMA investor GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA landlord GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA ai GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA crm GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA integrations GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA investor GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA landlord GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ai GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA crm GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA integrations GRANT ALL ON TABLES TO service_role;

-- ============================================================================
-- STEP 11: Create backward compatibility views in public schema
-- ============================================================================

-- Create a helper function for safe view creation
CREATE OR REPLACE FUNCTION pg_temp.create_compat_view(
  source_schema TEXT,
  source_table TEXT,
  view_name TEXT
) RETURNS VOID AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = source_schema AND table_name = source_table) THEN
    -- Drop existing view first (views can be dropped without issue)
    EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_name);
    -- Now create the view
    EXECUTE format('CREATE VIEW public.%I AS SELECT * FROM %I.%I', view_name, source_schema, source_table);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Investor views
SELECT pg_temp.create_compat_view('investor', 'deals_pipeline', 'investor_deals_pipeline');
SELECT pg_temp.create_compat_view('investor', 'properties', 'investor_properties');
SELECT pg_temp.create_compat_view('investor', 'campaigns', 'investor_campaigns');
SELECT pg_temp.create_compat_view('investor', 'drip_campaign_steps', 'investor_drip_campaign_steps');
SELECT pg_temp.create_compat_view('investor', 'drip_enrollments', 'investor_drip_enrollments');
SELECT pg_temp.create_compat_view('investor', 'drip_touch_logs', 'investor_drip_touch_logs');
SELECT pg_temp.create_compat_view('investor', 'conversations', 'investor_conversations');
SELECT pg_temp.create_compat_view('investor', 'messages', 'investor_messages');

-- Landlord views
SELECT pg_temp.create_compat_view('landlord', 'properties', 'landlord_properties');
SELECT pg_temp.create_compat_view('landlord', 'rooms', 'landlord_rooms');
SELECT pg_temp.create_compat_view('landlord', 'bookings', 'landlord_bookings');
SELECT pg_temp.create_compat_view('landlord', 'conversations', 'landlord_conversations');
SELECT pg_temp.create_compat_view('landlord', 'messages', 'landlord_messages');
SELECT pg_temp.create_compat_view('landlord', 'ai_queue_items', 'landlord_ai_queue_items');
SELECT pg_temp.create_compat_view('landlord', 'templates', 'landlord_templates');
SELECT pg_temp.create_compat_view('landlord', 'inventory_items', 'landlord_inventory_items');
SELECT pg_temp.create_compat_view('landlord', 'turnovers', 'landlord_turnovers');
SELECT pg_temp.create_compat_view('landlord', 'vendors', 'landlord_vendors');
SELECT pg_temp.create_compat_view('landlord', 'booking_charges', 'landlord_booking_charges');

-- AI views
SELECT pg_temp.create_compat_view('ai', 'jobs', 'ai_jobs');
SELECT pg_temp.create_compat_view('ai', 'response_outcomes', 'ai_response_outcomes');
SELECT pg_temp.create_compat_view('ai', 'moltbot_user_memories', 'ai_moltbot_user_memories');
SELECT pg_temp.create_compat_view('ai', 'moltbot_knowledge_sources', 'ai_moltbot_knowledge_sources');

-- CRM views
SELECT pg_temp.create_compat_view('crm', 'contacts', 'crm_contacts');
SELECT pg_temp.create_compat_view('crm', 'leads', 'crm_leads');
SELECT pg_temp.create_compat_view('crm', 'opt_outs', 'contact_opt_outs');
SELECT pg_temp.create_compat_view('crm', 'touches', 'contact_touches');

-- Integrations views
SELECT pg_temp.create_compat_view('integrations', 'seam_connected_devices', 'seam_connected_devices');
SELECT pg_temp.create_compat_view('integrations', 'seam_access_codes', 'seam_access_codes');
SELECT pg_temp.create_compat_view('integrations', 'gmail_tokens', 'user_gmail_tokens');
SELECT pg_temp.create_compat_view('integrations', 'meta_dm_credentials', 'meta_dm_credentials');
SELECT pg_temp.create_compat_view('integrations', 'postgrid_credentials', 'postgrid_credentials');

COMMIT;
