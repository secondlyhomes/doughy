-- Migration: Rename Investor Platform Tables
-- Phase 1: Rename re_* tables to investor_* and fix investor_* naming
-- Date: 2026-01-30
--
-- This migration renames all real estate investor tables from re_* prefix to investor_*
-- to create clear platform ownership and consistent naming.

BEGIN;

-- ============================================================================
-- STEP 1: Drop dependent views/functions that reference old table names
-- ============================================================================

-- Drop any views that might reference these tables (will recreate after)
DROP VIEW IF EXISTS public.investor_property_summary CASCADE;
DROP VIEW IF EXISTS public.re_property_summary CASCADE;

-- ============================================================================
-- STEP 2: Rename leaf tables first (tables that are NOT referenced by FKs)
-- ============================================================================

-- re_document_embeddings → investor_document_embeddings
-- (references re_property_documents)
ALTER TABLE IF EXISTS public.re_document_embeddings
  RENAME TO investor_document_embeddings;

-- re_document_processing_queue → investor_document_queue_items
-- (references re_property_documents)
ALTER TABLE IF EXISTS public.re_document_processing_queue
  RENAME TO investor_document_queue_items;

-- re_portfolio_monthly_records → investor_portfolio_monthly_records
-- (references re_portfolio_entries)
ALTER TABLE IF EXISTS public.re_portfolio_monthly_records
  RENAME TO investor_portfolio_monthly_records;

-- re_portfolio_mortgages → investor_portfolio_mortgages
-- (references re_portfolio_entries)
ALTER TABLE IF EXISTS public.re_portfolio_mortgages
  RENAME TO investor_portfolio_mortgages;

-- re_portfolio_valuations → investor_portfolio_valuations
-- (references re_properties)
ALTER TABLE IF EXISTS public.re_portfolio_valuations
  RENAME TO investor_portfolio_valuations;

-- ============================================================================
-- STEP 3: Rename child tables (referenced by some, reference others)
-- ============================================================================

-- re_property_documents → investor_property_documents
ALTER TABLE IF EXISTS public.re_property_documents
  RENAME TO investor_property_documents;

-- re_property_images → investor_property_images
ALTER TABLE IF EXISTS public.re_property_images
  RENAME TO investor_property_images;

-- re_property_analyses → investor_property_analyses
ALTER TABLE IF EXISTS public.re_property_analyses
  RENAME TO investor_property_analyses;

-- re_property_debt → investor_property_debts (fix plurality)
ALTER TABLE IF EXISTS public.re_property_debt
  RENAME TO investor_property_debts;

-- re_property_mortgages → investor_property_mortgages
ALTER TABLE IF EXISTS public.re_property_mortgages
  RENAME TO investor_property_mortgages;

-- re_comps → investor_comps
ALTER TABLE IF EXISTS public.re_comps
  RENAME TO investor_comps;

-- re_repair_estimates → investor_repair_estimates
ALTER TABLE IF EXISTS public.re_repair_estimates
  RENAME TO investor_repair_estimates;

-- re_financing_scenarios → investor_financing_scenarios
ALTER TABLE IF EXISTS public.re_financing_scenarios
  RENAME TO investor_financing_scenarios;

-- re_buying_criteria → investor_buying_criteria
ALTER TABLE IF EXISTS public.re_buying_criteria
  RENAME TO investor_buying_criteria;

-- re_lead_properties → investor_lead_properties
ALTER TABLE IF EXISTS public.re_lead_properties
  RENAME TO investor_lead_properties;

-- re_documents → investor_documents
ALTER TABLE IF EXISTS public.re_documents
  RENAME TO investor_documents;

-- re_portfolio_entries → investor_portfolio_entries
ALTER TABLE IF EXISTS public.re_portfolio_entries
  RENAME TO investor_portfolio_entries;

-- re_portfolio_groups → investor_portfolio_groups
ALTER TABLE IF EXISTS public.re_portfolio_groups
  RENAME TO investor_portfolio_groups;

-- ============================================================================
-- STEP 4: Rename parent/root tables
-- ============================================================================

-- re_properties → investor_properties (main parent table)
ALTER TABLE IF EXISTS public.re_properties
  RENAME TO investor_properties;

-- deals → investor_deals_pipeline (root entity)
ALTER TABLE IF EXISTS public.deals
  RENAME TO investor_deals_pipeline;

-- deal_events → investor_deal_events
ALTER TABLE IF EXISTS public.deal_events
  RENAME TO investor_deal_events;

-- ============================================================================
-- STEP 5: Fix investor_* plurality/naming
-- ============================================================================

-- investor_ai_queue → investor_ai_queue_items
ALTER TABLE IF EXISTS public.investor_ai_queue
  RENAME TO investor_ai_queue_items;

-- investor_ai_confidence → investor_ai_confidence_settings
ALTER TABLE IF EXISTS public.investor_ai_confidence
  RENAME TO investor_ai_confidence_settings;

-- ============================================================================
-- STEP 6: Rename drip_* tables to investor_drip_*
-- ============================================================================

-- drip_campaign_steps → investor_drip_campaign_steps
ALTER TABLE IF EXISTS public.drip_campaign_steps
  RENAME TO investor_drip_campaign_steps;

-- drip_enrollments → investor_drip_enrollments
ALTER TABLE IF EXISTS public.drip_enrollments
  RENAME TO investor_drip_enrollments;

-- drip_touch_log → investor_drip_touch_logs (fix plurality)
ALTER TABLE IF EXISTS public.drip_touch_log
  RENAME TO investor_drip_touch_logs;

-- ============================================================================
-- STEP 7: Update FK constraint names to reflect new table names
-- ============================================================================

-- Update FK constraints for investor_document_embeddings
ALTER TABLE public.investor_document_embeddings
  DROP CONSTRAINT IF EXISTS re_document_embeddings_document_id_fkey,
  ADD CONSTRAINT investor_document_embeddings_document_id_fkey
    FOREIGN KEY (document_id) REFERENCES public.investor_property_documents(id) ON DELETE CASCADE;

-- Update FK constraints for investor_document_queue_items
ALTER TABLE public.investor_document_queue_items
  DROP CONSTRAINT IF EXISTS re_document_processing_queue_document_id_fkey,
  ADD CONSTRAINT investor_document_queue_items_document_id_fkey
    FOREIGN KEY (document_id) REFERENCES public.investor_property_documents(id) ON DELETE CASCADE;

-- Update FK constraints for investor_portfolio_monthly_records
ALTER TABLE public.investor_portfolio_monthly_records
  DROP CONSTRAINT IF EXISTS re_portfolio_monthly_records_portfolio_entry_id_fkey,
  ADD CONSTRAINT investor_portfolio_monthly_records_portfolio_entry_id_fkey
    FOREIGN KEY (portfolio_entry_id) REFERENCES public.investor_portfolio_entries(id) ON DELETE CASCADE;

-- Update FK constraints for investor_portfolio_mortgages
ALTER TABLE public.investor_portfolio_mortgages
  DROP CONSTRAINT IF EXISTS re_portfolio_mortgages_portfolio_entry_id_fkey,
  ADD CONSTRAINT investor_portfolio_mortgages_portfolio_entry_id_fkey
    FOREIGN KEY (portfolio_entry_id) REFERENCES public.investor_portfolio_entries(id) ON DELETE CASCADE;

-- Update FK constraints for investor_portfolio_valuations
ALTER TABLE public.investor_portfolio_valuations
  DROP CONSTRAINT IF EXISTS re_portfolio_valuations_property_id_fkey,
  ADD CONSTRAINT investor_portfolio_valuations_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.investor_properties(id) ON DELETE CASCADE;

-- Update FK constraints for investor_property_documents
ALTER TABLE public.investor_property_documents
  DROP CONSTRAINT IF EXISTS re_property_documents_property_id_fkey,
  DROP CONSTRAINT IF EXISTS re_property_documents_workspace_id_fkey,
  ADD CONSTRAINT investor_property_documents_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.investor_properties(id) ON DELETE CASCADE,
  ADD CONSTRAINT investor_property_documents_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Update FK constraints for investor_property_images
ALTER TABLE public.investor_property_images
  DROP CONSTRAINT IF EXISTS re_property_images_property_id_fkey,
  DROP CONSTRAINT IF EXISTS re_property_images_workspace_id_fkey,
  ADD CONSTRAINT investor_property_images_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.investor_properties(id) ON DELETE CASCADE,
  ADD CONSTRAINT investor_property_images_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Update FK constraints for investor_property_analyses
ALTER TABLE public.investor_property_analyses
  DROP CONSTRAINT IF EXISTS re_property_analyses_property_id_fkey,
  DROP CONSTRAINT IF EXISTS re_property_analyses_workspace_id_fkey,
  ADD CONSTRAINT investor_property_analyses_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.investor_properties(id) ON DELETE CASCADE,
  ADD CONSTRAINT investor_property_analyses_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Update FK constraints for investor_property_debts
ALTER TABLE public.investor_property_debts
  DROP CONSTRAINT IF EXISTS re_property_debt_property_id_fkey,
  DROP CONSTRAINT IF EXISTS re_property_debt_workspace_id_fkey,
  ADD CONSTRAINT investor_property_debts_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.investor_properties(id) ON DELETE CASCADE,
  ADD CONSTRAINT investor_property_debts_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Update FK constraints for investor_property_mortgages
ALTER TABLE public.investor_property_mortgages
  DROP CONSTRAINT IF EXISTS re_property_mortgages_property_id_fkey,
  DROP CONSTRAINT IF EXISTS re_property_mortgages_workspace_id_fkey,
  ADD CONSTRAINT investor_property_mortgages_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.investor_properties(id) ON DELETE CASCADE,
  ADD CONSTRAINT investor_property_mortgages_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Update FK constraints for investor_comps
ALTER TABLE public.investor_comps
  DROP CONSTRAINT IF EXISTS re_comps_property_id_fkey,
  DROP CONSTRAINT IF EXISTS re_comps_workspace_id_fkey,
  ADD CONSTRAINT investor_comps_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.investor_properties(id) ON DELETE CASCADE,
  ADD CONSTRAINT investor_comps_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Update FK constraints for investor_repair_estimates
ALTER TABLE public.investor_repair_estimates
  DROP CONSTRAINT IF EXISTS re_repair_estimates_property_id_fkey,
  DROP CONSTRAINT IF EXISTS re_repair_estimates_workspace_id_fkey,
  ADD CONSTRAINT investor_repair_estimates_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.investor_properties(id) ON DELETE CASCADE,
  ADD CONSTRAINT investor_repair_estimates_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Update FK constraints for investor_financing_scenarios
ALTER TABLE public.investor_financing_scenarios
  DROP CONSTRAINT IF EXISTS re_financing_scenarios_property_id_fkey,
  DROP CONSTRAINT IF EXISTS re_financing_scenarios_workspace_id_fkey,
  ADD CONSTRAINT investor_financing_scenarios_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.investor_properties(id) ON DELETE CASCADE,
  ADD CONSTRAINT investor_financing_scenarios_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Update FK constraints for investor_lead_properties
ALTER TABLE public.investor_lead_properties
  DROP CONSTRAINT IF EXISTS re_lead_properties_property_id_fkey,
  DROP CONSTRAINT IF EXISTS re_lead_properties_workspace_id_fkey,
  ADD CONSTRAINT investor_lead_properties_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.investor_properties(id) ON DELETE CASCADE,
  ADD CONSTRAINT investor_lead_properties_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Update FK constraints for investor_documents
ALTER TABLE public.investor_documents
  DROP CONSTRAINT IF EXISTS re_documents_property_id_fkey,
  DROP CONSTRAINT IF EXISTS re_documents_deal_id_fkey,
  ADD CONSTRAINT investor_documents_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.investor_properties(id) ON DELETE CASCADE,
  ADD CONSTRAINT investor_documents_deal_id_fkey
    FOREIGN KEY (deal_id) REFERENCES public.investor_deals_pipeline(id) ON DELETE CASCADE;

-- Update FK constraints for investor_portfolio_entries
ALTER TABLE public.investor_portfolio_entries
  DROP CONSTRAINT IF EXISTS re_portfolio_entries_property_id_fkey,
  DROP CONSTRAINT IF EXISTS re_portfolio_entries_deal_id_fkey,
  DROP CONSTRAINT IF EXISTS re_portfolio_entries_group_id_fkey,
  ADD CONSTRAINT investor_portfolio_entries_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.investor_properties(id) ON DELETE CASCADE,
  ADD CONSTRAINT investor_portfolio_entries_deal_id_fkey
    FOREIGN KEY (deal_id) REFERENCES public.investor_deals_pipeline(id) ON DELETE SET NULL,
  ADD CONSTRAINT investor_portfolio_entries_group_id_fkey
    FOREIGN KEY (group_id) REFERENCES public.investor_portfolio_groups(id) ON DELETE SET NULL;

-- Update FK constraints for investor_properties
ALTER TABLE public.investor_properties
  DROP CONSTRAINT IF EXISTS re_properties_lead_id_fkey,
  DROP CONSTRAINT IF EXISTS re_properties_profile_id_fkey,
  DROP CONSTRAINT IF EXISTS re_properties_workspace_id_fkey,
  ADD CONSTRAINT investor_properties_lead_id_fkey
    FOREIGN KEY (lead_id) REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  ADD CONSTRAINT investor_properties_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT investor_properties_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Update FK constraints for investor_deals_pipeline
ALTER TABLE public.investor_deals_pipeline
  DROP CONSTRAINT IF EXISTS deals_lead_id_fkey,
  DROP CONSTRAINT IF EXISTS deals_property_id_fkey,
  ADD CONSTRAINT investor_deals_pipeline_lead_id_fkey
    FOREIGN KEY (lead_id) REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  ADD CONSTRAINT investor_deals_pipeline_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.investor_properties(id) ON DELETE SET NULL;

-- Update FK constraints for investor_deal_events
ALTER TABLE public.investor_deal_events
  DROP CONSTRAINT IF EXISTS deal_events_deal_id_fkey,
  ADD CONSTRAINT investor_deal_events_deal_id_fkey
    FOREIGN KEY (deal_id) REFERENCES public.investor_deals_pipeline(id) ON DELETE CASCADE;

-- Update FK constraints for investor_drip_campaign_steps
ALTER TABLE public.investor_drip_campaign_steps
  DROP CONSTRAINT IF EXISTS drip_campaign_steps_campaign_id_fkey,
  DROP CONSTRAINT IF EXISTS drip_campaign_steps_template_id_fkey,
  ADD CONSTRAINT investor_drip_campaign_steps_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES public.investor_campaigns(id) ON DELETE CASCADE,
  ADD CONSTRAINT investor_drip_campaign_steps_template_id_fkey
    FOREIGN KEY (template_id) REFERENCES public.investor_outreach_templates(id) ON DELETE SET NULL;

-- Update FK constraints for investor_drip_enrollments
ALTER TABLE public.investor_drip_enrollments
  DROP CONSTRAINT IF EXISTS drip_enrollments_campaign_id_fkey,
  DROP CONSTRAINT IF EXISTS drip_enrollments_contact_id_fkey,
  DROP CONSTRAINT IF EXISTS drip_enrollments_deal_id_fkey,
  DROP CONSTRAINT IF EXISTS drip_enrollments_converted_deal_id_fkey,
  ADD CONSTRAINT investor_drip_enrollments_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES public.investor_campaigns(id) ON DELETE CASCADE,
  ADD CONSTRAINT investor_drip_enrollments_contact_id_fkey
    FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  ADD CONSTRAINT investor_drip_enrollments_deal_id_fkey
    FOREIGN KEY (deal_id) REFERENCES public.investor_deals(id) ON DELETE SET NULL,
  ADD CONSTRAINT investor_drip_enrollments_converted_deal_id_fkey
    FOREIGN KEY (converted_deal_id) REFERENCES public.investor_deals(id) ON DELETE SET NULL;

-- Update FK constraints for investor_drip_touch_logs
ALTER TABLE public.investor_drip_touch_logs
  DROP CONSTRAINT IF EXISTS drip_touch_log_enrollment_id_fkey,
  DROP CONSTRAINT IF EXISTS drip_touch_log_step_id_fkey,
  ADD CONSTRAINT investor_drip_touch_logs_enrollment_id_fkey
    FOREIGN KEY (enrollment_id) REFERENCES public.investor_drip_enrollments(id) ON DELETE CASCADE,
  ADD CONSTRAINT investor_drip_touch_logs_step_id_fkey
    FOREIGN KEY (step_id) REFERENCES public.investor_drip_campaign_steps(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 8: Update FKs from OTHER tables that reference renamed tables
-- ============================================================================

-- assistant_jobs → references deals (now investor_deals_pipeline)
ALTER TABLE public.assistant_jobs
  DROP CONSTRAINT IF EXISTS ai_jobs_deal_id_fkey,
  ADD CONSTRAINT ai_jobs_deal_id_fkey
    FOREIGN KEY (deal_id) REFERENCES public.investor_deals_pipeline(id) ON DELETE SET NULL;

-- capture_items → references re_properties (now investor_properties) and deals (now investor_deals_pipeline)
ALTER TABLE public.capture_items
  DROP CONSTRAINT IF EXISTS capture_items_assigned_deal_id_fkey,
  DROP CONSTRAINT IF EXISTS capture_items_assigned_property_id_fkey,
  DROP CONSTRAINT IF EXISTS capture_items_suggested_property_id_fkey,
  ADD CONSTRAINT capture_items_assigned_deal_id_fkey
    FOREIGN KEY (assigned_deal_id) REFERENCES public.investor_deals_pipeline(id) ON DELETE SET NULL,
  ADD CONSTRAINT capture_items_assigned_property_id_fkey
    FOREIGN KEY (assigned_property_id) REFERENCES public.investor_properties(id) ON DELETE SET NULL,
  ADD CONSTRAINT capture_items_suggested_property_id_fkey
    FOREIGN KEY (suggested_property_id) REFERENCES public.investor_properties(id) ON DELETE SET NULL;

-- contact_touches → references re_properties (now investor_properties) and deals (now investor_deals_pipeline)
ALTER TABLE public.contact_touches
  DROP CONSTRAINT IF EXISTS contact_touches_deal_id_fkey,
  DROP CONSTRAINT IF EXISTS contact_touches_property_id_fkey,
  ADD CONSTRAINT contact_touches_deal_id_fkey
    FOREIGN KEY (deal_id) REFERENCES public.investor_deals_pipeline(id) ON DELETE SET NULL,
  ADD CONSTRAINT contact_touches_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.investor_properties(id) ON DELETE SET NULL;

-- conversation_items → references deals (now investor_deals_pipeline)
ALTER TABLE public.conversation_items
  DROP CONSTRAINT IF EXISTS conversation_items_deal_id_fkey,
  ADD CONSTRAINT conversation_items_deal_id_fkey
    FOREIGN KEY (deal_id) REFERENCES public.investor_deals_pipeline(id) ON DELETE SET NULL;

-- investor_conversations → references re_properties (now investor_properties) and deals (now investor_deals_pipeline)
ALTER TABLE public.investor_conversations
  DROP CONSTRAINT IF EXISTS investor_conversations_property_id_fkey,
  DROP CONSTRAINT IF EXISTS investor_conversations_deal_id_fkey,
  ADD CONSTRAINT investor_conversations_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.investor_properties(id) ON DELETE SET NULL,
  ADD CONSTRAINT investor_conversations_deal_id_fkey
    FOREIGN KEY (deal_id) REFERENCES public.investor_deals_pipeline(id) ON DELETE SET NULL;

-- investor_ai_queue_items → references investor_conversations and investor_messages
ALTER TABLE public.investor_ai_queue_items
  DROP CONSTRAINT IF EXISTS investor_ai_queue_conversation_id_fkey,
  DROP CONSTRAINT IF EXISTS investor_ai_queue_trigger_message_id_fkey,
  ADD CONSTRAINT investor_ai_queue_items_conversation_id_fkey
    FOREIGN KEY (conversation_id) REFERENCES public.investor_conversations(id) ON DELETE CASCADE,
  ADD CONSTRAINT investor_ai_queue_items_trigger_message_id_fkey
    FOREIGN KEY (trigger_message_id) REFERENCES public.investor_messages(id) ON DELETE CASCADE;

-- investor_ai_response_outcomes → update constraint names
ALTER TABLE public.investor_ai_response_outcomes
  DROP CONSTRAINT IF EXISTS investor_ai_response_outcomes_queue_item_id_fkey,
  ADD CONSTRAINT investor_ai_response_outcomes_queue_item_id_fkey
    FOREIGN KEY (queue_item_id) REFERENCES public.investor_ai_queue_items(id) ON DELETE CASCADE;

-- contact_opt_outs → references drip_touch_log (now investor_drip_touch_logs)
ALTER TABLE public.contact_opt_outs
  DROP CONSTRAINT IF EXISTS contact_opt_outs_source_touch_id_fkey,
  ADD CONSTRAINT contact_opt_outs_source_touch_id_fkey
    FOREIGN KEY (source_touch_id) REFERENCES public.investor_drip_touch_logs(id) ON DELETE SET NULL;

-- mail_credit_transactions → references drip_touch_log (now investor_drip_touch_logs)
ALTER TABLE public.mail_credit_transactions
  DROP CONSTRAINT IF EXISTS mail_credit_transactions_touch_log_id_fkey,
  ADD CONSTRAINT mail_credit_transactions_touch_log_id_fkey
    FOREIGN KEY (touch_log_id) REFERENCES public.investor_drip_touch_logs(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 9: Update RLS policies
-- ============================================================================

-- Drop and recreate RLS policies for investor_properties
DROP POLICY IF EXISTS "Users can view own properties" ON public.investor_properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON public.investor_properties;
DROP POLICY IF EXISTS "Users can update own properties" ON public.investor_properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON public.investor_properties;
DROP POLICY IF EXISTS "re_properties_select_policy" ON public.investor_properties;
DROP POLICY IF EXISTS "re_properties_insert_policy" ON public.investor_properties;
DROP POLICY IF EXISTS "re_properties_update_policy" ON public.investor_properties;
DROP POLICY IF EXISTS "re_properties_delete_policy" ON public.investor_properties;

CREATE POLICY "investor_properties_select_policy" ON public.investor_properties
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = profile_id);

CREATE POLICY "investor_properties_insert_policy" ON public.investor_properties
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = profile_id);

CREATE POLICY "investor_properties_update_policy" ON public.investor_properties
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = profile_id);

CREATE POLICY "investor_properties_delete_policy" ON public.investor_properties
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = profile_id);

-- Drop and recreate RLS policies for investor_deals_pipeline
DROP POLICY IF EXISTS "Users can view own deals" ON public.investor_deals_pipeline;
DROP POLICY IF EXISTS "Users can insert own deals" ON public.investor_deals_pipeline;
DROP POLICY IF EXISTS "Users can update own deals" ON public.investor_deals_pipeline;
DROP POLICY IF EXISTS "Users can delete own deals" ON public.investor_deals_pipeline;
DROP POLICY IF EXISTS "deals_select_policy" ON public.investor_deals_pipeline;
DROP POLICY IF EXISTS "deals_insert_policy" ON public.investor_deals_pipeline;
DROP POLICY IF EXISTS "deals_update_policy" ON public.investor_deals_pipeline;
DROP POLICY IF EXISTS "deals_delete_policy" ON public.investor_deals_pipeline;

CREATE POLICY "investor_deals_pipeline_select_policy" ON public.investor_deals_pipeline
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "investor_deals_pipeline_insert_policy" ON public.investor_deals_pipeline
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "investor_deals_pipeline_update_policy" ON public.investor_deals_pipeline
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "investor_deals_pipeline_delete_policy" ON public.investor_deals_pipeline
  FOR DELETE USING (auth.uid() = user_id);

-- Drop and recreate RLS policies for investor_deal_events
DROP POLICY IF EXISTS "deal_events_select_policy" ON public.investor_deal_events;
DROP POLICY IF EXISTS "deal_events_insert_policy" ON public.investor_deal_events;
DROP POLICY IF EXISTS "deal_events_update_policy" ON public.investor_deal_events;
DROP POLICY IF EXISTS "deal_events_delete_policy" ON public.investor_deal_events;

CREATE POLICY "investor_deal_events_select_policy" ON public.investor_deal_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "investor_deal_events_insert_policy" ON public.investor_deal_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "investor_deal_events_update_policy" ON public.investor_deal_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "investor_deal_events_delete_policy" ON public.investor_deal_events
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for investor_drip_campaign_steps
DROP POLICY IF EXISTS "drip_campaign_steps_select_policy" ON public.investor_drip_campaign_steps;
DROP POLICY IF EXISTS "drip_campaign_steps_insert_policy" ON public.investor_drip_campaign_steps;
DROP POLICY IF EXISTS "drip_campaign_steps_update_policy" ON public.investor_drip_campaign_steps;
DROP POLICY IF EXISTS "drip_campaign_steps_delete_policy" ON public.investor_drip_campaign_steps;

CREATE POLICY "investor_drip_campaign_steps_select_policy" ON public.investor_drip_campaign_steps
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "investor_drip_campaign_steps_insert_policy" ON public.investor_drip_campaign_steps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "investor_drip_campaign_steps_update_policy" ON public.investor_drip_campaign_steps
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "investor_drip_campaign_steps_delete_policy" ON public.investor_drip_campaign_steps
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for investor_drip_enrollments
DROP POLICY IF EXISTS "drip_enrollments_select_policy" ON public.investor_drip_enrollments;
DROP POLICY IF EXISTS "drip_enrollments_insert_policy" ON public.investor_drip_enrollments;
DROP POLICY IF EXISTS "drip_enrollments_update_policy" ON public.investor_drip_enrollments;
DROP POLICY IF EXISTS "drip_enrollments_delete_policy" ON public.investor_drip_enrollments;

CREATE POLICY "investor_drip_enrollments_select_policy" ON public.investor_drip_enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "investor_drip_enrollments_insert_policy" ON public.investor_drip_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "investor_drip_enrollments_update_policy" ON public.investor_drip_enrollments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "investor_drip_enrollments_delete_policy" ON public.investor_drip_enrollments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for investor_drip_touch_logs
DROP POLICY IF EXISTS "drip_touch_log_select_policy" ON public.investor_drip_touch_logs;
DROP POLICY IF EXISTS "drip_touch_log_insert_policy" ON public.investor_drip_touch_logs;
DROP POLICY IF EXISTS "drip_touch_log_update_policy" ON public.investor_drip_touch_logs;
DROP POLICY IF EXISTS "drip_touch_log_delete_policy" ON public.investor_drip_touch_logs;

CREATE POLICY "investor_drip_touch_logs_select_policy" ON public.investor_drip_touch_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "investor_drip_touch_logs_insert_policy" ON public.investor_drip_touch_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "investor_drip_touch_logs_update_policy" ON public.investor_drip_touch_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "investor_drip_touch_logs_delete_policy" ON public.investor_drip_touch_logs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for investor_ai_queue_items
DROP POLICY IF EXISTS "investor_ai_queue_select_policy" ON public.investor_ai_queue_items;
DROP POLICY IF EXISTS "investor_ai_queue_insert_policy" ON public.investor_ai_queue_items;
DROP POLICY IF EXISTS "investor_ai_queue_update_policy" ON public.investor_ai_queue_items;
DROP POLICY IF EXISTS "investor_ai_queue_delete_policy" ON public.investor_ai_queue_items;

CREATE POLICY "investor_ai_queue_items_select_policy" ON public.investor_ai_queue_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "investor_ai_queue_items_insert_policy" ON public.investor_ai_queue_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "investor_ai_queue_items_update_policy" ON public.investor_ai_queue_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "investor_ai_queue_items_delete_policy" ON public.investor_ai_queue_items
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 10: Update index names (optional but good for consistency)
-- ============================================================================

-- Rename indexes for investor_properties
ALTER INDEX IF EXISTS re_properties_pkey RENAME TO investor_properties_pkey;
ALTER INDEX IF EXISTS re_properties_user_id_idx RENAME TO investor_properties_user_id_idx;
ALTER INDEX IF EXISTS re_properties_workspace_id_idx RENAME TO investor_properties_workspace_id_idx;
ALTER INDEX IF EXISTS re_properties_lead_id_idx RENAME TO investor_properties_lead_id_idx;

-- Rename indexes for investor_deals_pipeline
ALTER INDEX IF EXISTS deals_pkey RENAME TO investor_deals_pipeline_pkey;
ALTER INDEX IF EXISTS deals_user_id_idx RENAME TO investor_deals_pipeline_user_id_idx;
ALTER INDEX IF EXISTS deals_property_id_idx RENAME TO investor_deals_pipeline_property_id_idx;

-- Rename indexes for drip tables
ALTER INDEX IF EXISTS drip_campaign_steps_pkey RENAME TO investor_drip_campaign_steps_pkey;
ALTER INDEX IF EXISTS drip_enrollments_pkey RENAME TO investor_drip_enrollments_pkey;
ALTER INDEX IF EXISTS drip_touch_log_pkey RENAME TO investor_drip_touch_logs_pkey;

-- ============================================================================
-- STEP 11: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE public.investor_properties IS 'Properties being analyzed or purchased by investors (formerly re_properties)';
COMMENT ON TABLE public.investor_deals_pipeline IS 'Active deals in the investor pipeline (formerly deals)';
COMMENT ON TABLE public.investor_deal_events IS 'Event timeline for investor deals (formerly deal_events)';
COMMENT ON TABLE public.investor_drip_campaign_steps IS 'Steps in investor drip campaigns (formerly drip_campaign_steps)';
COMMENT ON TABLE public.investor_drip_enrollments IS 'Contact enrollments in drip campaigns (formerly drip_enrollments)';
COMMENT ON TABLE public.investor_drip_touch_logs IS 'Log of campaign touches sent (formerly drip_touch_log)';
COMMENT ON TABLE public.investor_ai_queue_items IS 'AI response queue for investor conversations (formerly investor_ai_queue)';
COMMENT ON TABLE public.investor_ai_confidence_settings IS 'AI confidence settings for investor platform (formerly investor_ai_confidence)';

COMMIT;
