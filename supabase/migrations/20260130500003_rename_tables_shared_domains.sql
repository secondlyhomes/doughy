-- Migration: Rename Shared Domain Tables
-- Phase 4: Rename call_*, contact_*, seam_*, meta_*, postgrid_*, conversation_items tables
-- Date: 2026-01-30
--
-- This migration renames shared domain tables to use consistent prefixes:
-- - call_* → comms_call_*
-- - contact_* → crm_*
-- - seam_* → integration_seam_*
-- - meta_dm_* → integration_meta_*
-- - postgrid_* → integration_postgrid_*
-- - mail_credit_* → billing_*
-- - conversation_items → comms_*

BEGIN;

-- ============================================================================
-- STEP 1: Rename call_* tables to comms_call_*
-- ============================================================================

-- call_logs → comms_call_logs
ALTER TABLE IF EXISTS public.call_logs
  RENAME TO comms_call_logs;

-- call_transcripts → comms_call_transcripts
ALTER TABLE IF EXISTS public.call_transcripts
  RENAME TO comms_call_transcripts;

-- call_transcript_segments → comms_call_transcript_segments
ALTER TABLE IF EXISTS public.call_transcript_segments
  RENAME TO comms_call_transcript_segments;

-- ============================================================================
-- STEP 2: Rename contact_* tables to crm_*
-- ============================================================================

-- contact_opt_outs → crm_contact_opt_outs
ALTER TABLE IF EXISTS public.contact_opt_outs
  RENAME TO crm_contact_opt_outs;

-- contact_touches → crm_contact_touches
ALTER TABLE IF EXISTS public.contact_touches
  RENAME TO crm_contact_touches;

-- ============================================================================
-- STEP 3: Rename seam_* tables to integration_seam_*
-- ============================================================================

-- seam_workspaces → integration_seam_workspaces
ALTER TABLE IF EXISTS public.seam_workspaces
  RENAME TO integration_seam_workspaces;

-- seam_connected_devices → integration_seam_devices
ALTER TABLE IF EXISTS public.seam_connected_devices
  RENAME TO integration_seam_devices;

-- seam_access_codes → integration_seam_access_codes
ALTER TABLE IF EXISTS public.seam_access_codes
  RENAME TO integration_seam_access_codes;

-- seam_lock_events → integration_seam_lock_events
ALTER TABLE IF EXISTS public.seam_lock_events
  RENAME TO integration_seam_lock_events;

-- ============================================================================
-- STEP 4: Rename meta_dm_* and postgrid_* to integration_*
-- ============================================================================

-- meta_dm_credentials → integration_meta_credentials
ALTER TABLE IF EXISTS public.meta_dm_credentials
  RENAME TO integration_meta_credentials;

-- postgrid_credentials → integration_postgrid_credentials
ALTER TABLE IF EXISTS public.postgrid_credentials
  RENAME TO integration_postgrid_credentials;

-- ============================================================================
-- STEP 5: Rename billing tables
-- ============================================================================

-- mail_credit_transactions → billing_mail_credit_transactions
ALTER TABLE IF EXISTS public.mail_credit_transactions
  RENAME TO billing_mail_credit_transactions;

-- ============================================================================
-- STEP 6: Rename conversation_items
-- ============================================================================

-- conversation_items → comms_conversation_items
ALTER TABLE IF EXISTS public.conversation_items
  RENAME TO comms_conversation_items;

-- ============================================================================
-- STEP 7: Update FK constraints for comms_call_* tables
-- ============================================================================

-- comms_call_logs FKs
ALTER TABLE public.comms_call_logs
  DROP CONSTRAINT IF EXISTS calls_lead_id_fkey,
  ADD CONSTRAINT comms_call_logs_lead_id_fkey
    FOREIGN KEY (lead_id) REFERENCES public.crm_leads(id) ON DELETE SET NULL;

-- comms_call_transcripts FKs
ALTER TABLE public.comms_call_transcripts
  DROP CONSTRAINT IF EXISTS transcripts_lead_id_fkey,
  ADD CONSTRAINT comms_call_transcripts_lead_id_fkey
    FOREIGN KEY (lead_id) REFERENCES public.crm_leads(id) ON DELETE SET NULL;

-- comms_call_transcript_segments FKs
ALTER TABLE public.comms_call_transcript_segments
  DROP CONSTRAINT IF EXISTS transcript_segments_transcript_id_fkey,
  ADD CONSTRAINT comms_call_transcript_segments_transcript_id_fkey
    FOREIGN KEY (transcript_id) REFERENCES public.comms_call_transcripts(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 8: Update FK constraints for crm_* tables
-- ============================================================================

-- crm_contact_opt_outs FKs
ALTER TABLE public.crm_contact_opt_outs
  DROP CONSTRAINT IF EXISTS contact_opt_outs_contact_id_fkey,
  DROP CONSTRAINT IF EXISTS contact_opt_outs_source_campaign_id_fkey,
  DROP CONSTRAINT IF EXISTS contact_opt_outs_source_touch_id_fkey,
  ADD CONSTRAINT crm_contact_opt_outs_contact_id_fkey
    FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  ADD CONSTRAINT crm_contact_opt_outs_source_campaign_id_fkey
    FOREIGN KEY (source_campaign_id) REFERENCES public.investor_campaigns(id) ON DELETE SET NULL,
  ADD CONSTRAINT crm_contact_opt_outs_source_touch_id_fkey
    FOREIGN KEY (source_touch_id) REFERENCES public.investor_drip_touch_logs(id) ON DELETE SET NULL;

-- crm_contact_touches FKs
ALTER TABLE public.crm_contact_touches
  DROP CONSTRAINT IF EXISTS contact_touches_lead_id_fkey,
  DROP CONSTRAINT IF EXISTS contact_touches_deal_id_fkey,
  DROP CONSTRAINT IF EXISTS contact_touches_property_id_fkey,
  ADD CONSTRAINT crm_contact_touches_lead_id_fkey
    FOREIGN KEY (lead_id) REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  ADD CONSTRAINT crm_contact_touches_deal_id_fkey
    FOREIGN KEY (deal_id) REFERENCES public.investor_deals_pipeline(id) ON DELETE SET NULL,
  ADD CONSTRAINT crm_contact_touches_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.investor_properties(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 9: Update FK constraints for integration_seam_* tables
-- ============================================================================

-- integration_seam_devices FKs
ALTER TABLE public.integration_seam_devices
  DROP CONSTRAINT IF EXISTS seam_connected_devices_property_id_fkey,
  ADD CONSTRAINT integration_seam_devices_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.landlord_properties(id) ON DELETE CASCADE;

-- integration_seam_access_codes FKs
ALTER TABLE public.integration_seam_access_codes
  DROP CONSTRAINT IF EXISTS seam_access_codes_device_id_fkey,
  DROP CONSTRAINT IF EXISTS seam_access_codes_booking_id_fkey,
  DROP CONSTRAINT IF EXISTS seam_access_codes_contact_id_fkey,
  ADD CONSTRAINT integration_seam_access_codes_device_id_fkey
    FOREIGN KEY (device_id) REFERENCES public.integration_seam_devices(id) ON DELETE CASCADE,
  ADD CONSTRAINT integration_seam_access_codes_booking_id_fkey
    FOREIGN KEY (booking_id) REFERENCES public.landlord_bookings(id) ON DELETE SET NULL,
  ADD CONSTRAINT integration_seam_access_codes_contact_id_fkey
    FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL;

-- integration_seam_lock_events FKs
ALTER TABLE public.integration_seam_lock_events
  DROP CONSTRAINT IF EXISTS seam_lock_events_device_id_fkey,
  DROP CONSTRAINT IF EXISTS seam_lock_events_access_code_id_fkey,
  ADD CONSTRAINT integration_seam_lock_events_device_id_fkey
    FOREIGN KEY (device_id) REFERENCES public.integration_seam_devices(id) ON DELETE CASCADE,
  ADD CONSTRAINT integration_seam_lock_events_access_code_id_fkey
    FOREIGN KEY (access_code_id) REFERENCES public.integration_seam_access_codes(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 10: Update FK constraints for billing tables
-- ============================================================================

-- billing_mail_credit_transactions FKs
ALTER TABLE public.billing_mail_credit_transactions
  DROP CONSTRAINT IF EXISTS mail_credit_transactions_original_transaction_id_fkey,
  DROP CONSTRAINT IF EXISTS mail_credit_transactions_touch_log_id_fkey,
  ADD CONSTRAINT billing_mail_credit_transactions_original_transaction_id_fkey
    FOREIGN KEY (original_transaction_id) REFERENCES public.billing_mail_credit_transactions(id) ON DELETE SET NULL,
  ADD CONSTRAINT billing_mail_credit_transactions_touch_log_id_fkey
    FOREIGN KEY (touch_log_id) REFERENCES public.investor_drip_touch_logs(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 11: Update FK constraints for comms_conversation_items
-- ============================================================================

-- comms_conversation_items FKs
ALTER TABLE public.comms_conversation_items
  DROP CONSTRAINT IF EXISTS conversation_items_deal_id_fkey,
  DROP CONSTRAINT IF EXISTS conversation_items_lead_id_fkey,
  DROP CONSTRAINT IF EXISTS conversation_items_workspace_id_fkey,
  ADD CONSTRAINT comms_conversation_items_deal_id_fkey
    FOREIGN KEY (deal_id) REFERENCES public.investor_deals_pipeline(id) ON DELETE SET NULL,
  ADD CONSTRAINT comms_conversation_items_lead_id_fkey
    FOREIGN KEY (lead_id) REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  ADD CONSTRAINT comms_conversation_items_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 12: Update RLS policies
-- ============================================================================

-- RLS for comms_call_logs
DROP POLICY IF EXISTS "call_logs_select_policy" ON public.comms_call_logs;
DROP POLICY IF EXISTS "call_logs_insert_policy" ON public.comms_call_logs;
DROP POLICY IF EXISTS "call_logs_update_policy" ON public.comms_call_logs;
DROP POLICY IF EXISTS "call_logs_delete_policy" ON public.comms_call_logs;

CREATE POLICY "comms_call_logs_select_policy" ON public.comms_call_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "comms_call_logs_insert_policy" ON public.comms_call_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comms_call_logs_update_policy" ON public.comms_call_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "comms_call_logs_delete_policy" ON public.comms_call_logs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for comms_call_transcripts
DROP POLICY IF EXISTS "call_transcripts_select_policy" ON public.comms_call_transcripts;
DROP POLICY IF EXISTS "call_transcripts_insert_policy" ON public.comms_call_transcripts;
DROP POLICY IF EXISTS "call_transcripts_update_policy" ON public.comms_call_transcripts;
DROP POLICY IF EXISTS "call_transcripts_delete_policy" ON public.comms_call_transcripts;

CREATE POLICY "comms_call_transcripts_select_policy" ON public.comms_call_transcripts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "comms_call_transcripts_insert_policy" ON public.comms_call_transcripts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comms_call_transcripts_update_policy" ON public.comms_call_transcripts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "comms_call_transcripts_delete_policy" ON public.comms_call_transcripts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for comms_call_transcript_segments
DROP POLICY IF EXISTS "call_transcript_segments_select_policy" ON public.comms_call_transcript_segments;
DROP POLICY IF EXISTS "call_transcript_segments_insert_policy" ON public.comms_call_transcript_segments;
DROP POLICY IF EXISTS "call_transcript_segments_update_policy" ON public.comms_call_transcript_segments;
DROP POLICY IF EXISTS "call_transcript_segments_delete_policy" ON public.comms_call_transcript_segments;

CREATE POLICY "comms_call_transcript_segments_select_policy" ON public.comms_call_transcript_segments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "comms_call_transcript_segments_insert_policy" ON public.comms_call_transcript_segments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comms_call_transcript_segments_update_policy" ON public.comms_call_transcript_segments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "comms_call_transcript_segments_delete_policy" ON public.comms_call_transcript_segments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for crm_contact_opt_outs
DROP POLICY IF EXISTS "contact_opt_outs_select_policy" ON public.crm_contact_opt_outs;
DROP POLICY IF EXISTS "contact_opt_outs_insert_policy" ON public.crm_contact_opt_outs;
DROP POLICY IF EXISTS "contact_opt_outs_update_policy" ON public.crm_contact_opt_outs;
DROP POLICY IF EXISTS "contact_opt_outs_delete_policy" ON public.crm_contact_opt_outs;

CREATE POLICY "crm_contact_opt_outs_select_policy" ON public.crm_contact_opt_outs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "crm_contact_opt_outs_insert_policy" ON public.crm_contact_opt_outs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "crm_contact_opt_outs_update_policy" ON public.crm_contact_opt_outs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "crm_contact_opt_outs_delete_policy" ON public.crm_contact_opt_outs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for crm_contact_touches
DROP POLICY IF EXISTS "contact_touches_select_policy" ON public.crm_contact_touches;
DROP POLICY IF EXISTS "contact_touches_insert_policy" ON public.crm_contact_touches;
DROP POLICY IF EXISTS "contact_touches_update_policy" ON public.crm_contact_touches;
DROP POLICY IF EXISTS "contact_touches_delete_policy" ON public.crm_contact_touches;

CREATE POLICY "crm_contact_touches_select_policy" ON public.crm_contact_touches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "crm_contact_touches_insert_policy" ON public.crm_contact_touches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "crm_contact_touches_update_policy" ON public.crm_contact_touches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "crm_contact_touches_delete_policy" ON public.crm_contact_touches
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for integration_seam_workspaces
DROP POLICY IF EXISTS "seam_workspaces_select_policy" ON public.integration_seam_workspaces;
DROP POLICY IF EXISTS "seam_workspaces_insert_policy" ON public.integration_seam_workspaces;
DROP POLICY IF EXISTS "seam_workspaces_update_policy" ON public.integration_seam_workspaces;
DROP POLICY IF EXISTS "seam_workspaces_delete_policy" ON public.integration_seam_workspaces;

CREATE POLICY "integration_seam_workspaces_select_policy" ON public.integration_seam_workspaces
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "integration_seam_workspaces_insert_policy" ON public.integration_seam_workspaces
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "integration_seam_workspaces_update_policy" ON public.integration_seam_workspaces
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "integration_seam_workspaces_delete_policy" ON public.integration_seam_workspaces
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for integration_seam_devices
DROP POLICY IF EXISTS "seam_connected_devices_select_policy" ON public.integration_seam_devices;
DROP POLICY IF EXISTS "seam_connected_devices_insert_policy" ON public.integration_seam_devices;
DROP POLICY IF EXISTS "seam_connected_devices_update_policy" ON public.integration_seam_devices;
DROP POLICY IF EXISTS "seam_connected_devices_delete_policy" ON public.integration_seam_devices;

CREATE POLICY "integration_seam_devices_select_policy" ON public.integration_seam_devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "integration_seam_devices_insert_policy" ON public.integration_seam_devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "integration_seam_devices_update_policy" ON public.integration_seam_devices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "integration_seam_devices_delete_policy" ON public.integration_seam_devices
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for integration_seam_access_codes
DROP POLICY IF EXISTS "seam_access_codes_select_policy" ON public.integration_seam_access_codes;
DROP POLICY IF EXISTS "seam_access_codes_insert_policy" ON public.integration_seam_access_codes;
DROP POLICY IF EXISTS "seam_access_codes_update_policy" ON public.integration_seam_access_codes;
DROP POLICY IF EXISTS "seam_access_codes_delete_policy" ON public.integration_seam_access_codes;

CREATE POLICY "integration_seam_access_codes_select_policy" ON public.integration_seam_access_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "integration_seam_access_codes_insert_policy" ON public.integration_seam_access_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "integration_seam_access_codes_update_policy" ON public.integration_seam_access_codes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "integration_seam_access_codes_delete_policy" ON public.integration_seam_access_codes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for integration_seam_lock_events
DROP POLICY IF EXISTS "seam_lock_events_select_policy" ON public.integration_seam_lock_events;
DROP POLICY IF EXISTS "seam_lock_events_insert_policy" ON public.integration_seam_lock_events;
DROP POLICY IF EXISTS "seam_lock_events_update_policy" ON public.integration_seam_lock_events;
DROP POLICY IF EXISTS "seam_lock_events_delete_policy" ON public.integration_seam_lock_events;

CREATE POLICY "integration_seam_lock_events_select_policy" ON public.integration_seam_lock_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "integration_seam_lock_events_insert_policy" ON public.integration_seam_lock_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "integration_seam_lock_events_update_policy" ON public.integration_seam_lock_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "integration_seam_lock_events_delete_policy" ON public.integration_seam_lock_events
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for integration_meta_credentials
DROP POLICY IF EXISTS "meta_dm_credentials_select_policy" ON public.integration_meta_credentials;
DROP POLICY IF EXISTS "meta_dm_credentials_insert_policy" ON public.integration_meta_credentials;
DROP POLICY IF EXISTS "meta_dm_credentials_update_policy" ON public.integration_meta_credentials;
DROP POLICY IF EXISTS "meta_dm_credentials_delete_policy" ON public.integration_meta_credentials;

CREATE POLICY "integration_meta_credentials_select_policy" ON public.integration_meta_credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "integration_meta_credentials_insert_policy" ON public.integration_meta_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "integration_meta_credentials_update_policy" ON public.integration_meta_credentials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "integration_meta_credentials_delete_policy" ON public.integration_meta_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for integration_postgrid_credentials
DROP POLICY IF EXISTS "postgrid_credentials_select_policy" ON public.integration_postgrid_credentials;
DROP POLICY IF EXISTS "postgrid_credentials_insert_policy" ON public.integration_postgrid_credentials;
DROP POLICY IF EXISTS "postgrid_credentials_update_policy" ON public.integration_postgrid_credentials;
DROP POLICY IF EXISTS "postgrid_credentials_delete_policy" ON public.integration_postgrid_credentials;

CREATE POLICY "integration_postgrid_credentials_select_policy" ON public.integration_postgrid_credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "integration_postgrid_credentials_insert_policy" ON public.integration_postgrid_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "integration_postgrid_credentials_update_policy" ON public.integration_postgrid_credentials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "integration_postgrid_credentials_delete_policy" ON public.integration_postgrid_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for billing_mail_credit_transactions
DROP POLICY IF EXISTS "mail_credit_transactions_select_policy" ON public.billing_mail_credit_transactions;
DROP POLICY IF EXISTS "mail_credit_transactions_insert_policy" ON public.billing_mail_credit_transactions;
DROP POLICY IF EXISTS "mail_credit_transactions_update_policy" ON public.billing_mail_credit_transactions;
DROP POLICY IF EXISTS "mail_credit_transactions_delete_policy" ON public.billing_mail_credit_transactions;

CREATE POLICY "billing_mail_credit_transactions_select_policy" ON public.billing_mail_credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "billing_mail_credit_transactions_insert_policy" ON public.billing_mail_credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "billing_mail_credit_transactions_update_policy" ON public.billing_mail_credit_transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "billing_mail_credit_transactions_delete_policy" ON public.billing_mail_credit_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for comms_conversation_items
DROP POLICY IF EXISTS "conversation_items_select_policy" ON public.comms_conversation_items;
DROP POLICY IF EXISTS "conversation_items_insert_policy" ON public.comms_conversation_items;
DROP POLICY IF EXISTS "conversation_items_update_policy" ON public.comms_conversation_items;
DROP POLICY IF EXISTS "conversation_items_delete_policy" ON public.comms_conversation_items;

CREATE POLICY "comms_conversation_items_select_policy" ON public.comms_conversation_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "comms_conversation_items_insert_policy" ON public.comms_conversation_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comms_conversation_items_update_policy" ON public.comms_conversation_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "comms_conversation_items_delete_policy" ON public.comms_conversation_items
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 13: Rename indexes
-- ============================================================================

ALTER INDEX IF EXISTS call_logs_pkey RENAME TO comms_call_logs_pkey;
ALTER INDEX IF EXISTS call_transcripts_pkey RENAME TO comms_call_transcripts_pkey;
ALTER INDEX IF EXISTS call_transcript_segments_pkey RENAME TO comms_call_transcript_segments_pkey;
ALTER INDEX IF EXISTS contact_opt_outs_pkey RENAME TO crm_contact_opt_outs_pkey;
ALTER INDEX IF EXISTS contact_touches_pkey RENAME TO crm_contact_touches_pkey;
ALTER INDEX IF EXISTS seam_workspaces_pkey RENAME TO integration_seam_workspaces_pkey;
ALTER INDEX IF EXISTS seam_connected_devices_pkey RENAME TO integration_seam_devices_pkey;
ALTER INDEX IF EXISTS seam_access_codes_pkey RENAME TO integration_seam_access_codes_pkey;
ALTER INDEX IF EXISTS seam_lock_events_pkey RENAME TO integration_seam_lock_events_pkey;
ALTER INDEX IF EXISTS meta_dm_credentials_pkey RENAME TO integration_meta_credentials_pkey;
ALTER INDEX IF EXISTS postgrid_credentials_pkey RENAME TO integration_postgrid_credentials_pkey;
ALTER INDEX IF EXISTS mail_credit_transactions_pkey RENAME TO billing_mail_credit_transactions_pkey;
ALTER INDEX IF EXISTS conversation_items_pkey RENAME TO comms_conversation_items_pkey;

-- ============================================================================
-- STEP 14: Add comments
-- ============================================================================

COMMENT ON TABLE public.comms_call_logs IS 'Call logs (formerly call_logs)';
COMMENT ON TABLE public.comms_call_transcripts IS 'Call transcripts (formerly call_transcripts)';
COMMENT ON TABLE public.comms_call_transcript_segments IS 'Call transcript segments (formerly call_transcript_segments)';
COMMENT ON TABLE public.crm_contact_opt_outs IS 'Contact opt-outs (formerly contact_opt_outs)';
COMMENT ON TABLE public.crm_contact_touches IS 'Contact touch history (formerly contact_touches)';
COMMENT ON TABLE public.integration_seam_workspaces IS 'Seam workspaces (formerly seam_workspaces)';
COMMENT ON TABLE public.integration_seam_devices IS 'Seam connected devices (formerly seam_connected_devices)';
COMMENT ON TABLE public.integration_seam_access_codes IS 'Seam access codes (formerly seam_access_codes)';
COMMENT ON TABLE public.integration_seam_lock_events IS 'Seam lock events (formerly seam_lock_events)';
COMMENT ON TABLE public.integration_meta_credentials IS 'Meta DM credentials (formerly meta_dm_credentials)';
COMMENT ON TABLE public.integration_postgrid_credentials IS 'PostGrid credentials (formerly postgrid_credentials)';
COMMENT ON TABLE public.billing_mail_credit_transactions IS 'Mail credit transactions (formerly mail_credit_transactions)';
COMMENT ON TABLE public.comms_conversation_items IS 'Conversation items (formerly conversation_items)';

COMMIT;
