-- Migration: Add Missing Foreign Key Indexes
-- Description: Add indexes on foreign key columns to improve JOIN performance
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys
-- Note: Using CREATE INDEX CONCURRENTLY to avoid blocking writes

-- ============================================================================
-- ai_response_outcomes foreign keys
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_response_outcomes_contact_id
  ON public.ai_response_outcomes(contact_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_response_outcomes_property_id
  ON public.ai_response_outcomes(property_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_response_outcomes_message_id
  ON public.ai_response_outcomes(message_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_response_outcomes_conversation_id
  ON public.ai_response_outcomes(conversation_id);

-- ============================================================================
-- capture_items foreign keys
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_capture_items_suggested_property_id
  ON public.capture_items(suggested_property_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_capture_items_suggested_lead_id
  ON public.capture_items(suggested_lead_id);

-- ============================================================================
-- contact_opt_outs foreign keys
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contact_opt_outs_source_touch_id
  ON public.contact_opt_outs(source_touch_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contact_opt_outs_source_campaign_id
  ON public.contact_opt_outs(source_campaign_id);

-- ============================================================================
-- conversation_items foreign keys
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_items_workspace_id
  ON public.conversation_items(workspace_id);

-- ============================================================================
-- crm_contacts foreign keys
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_contacts_active_campaign_id
  ON public.crm_contacts(active_campaign_id);

-- ============================================================================
-- crm_skip_trace_results foreign keys
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_skip_trace_results_property_id
  ON public.crm_skip_trace_results(property_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_skip_trace_results_matched_property_id
  ON public.crm_skip_trace_results(matched_property_id);

-- ============================================================================
-- drip_campaign_steps foreign keys
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drip_campaign_steps_template_id
  ON public.drip_campaign_steps(template_id);

-- ============================================================================
-- drip_enrollments foreign keys
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drip_enrollments_converted_deal_id
  ON public.drip_enrollments(converted_deal_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drip_enrollments_deal_id
  ON public.drip_enrollments(deal_id);

-- ============================================================================
-- drip_touch_log foreign keys
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drip_touch_log_step_id
  ON public.drip_touch_log(step_id);

-- ============================================================================
-- investor_ai_queue foreign keys
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_investor_ai_queue_trigger_message_id
  ON public.investor_ai_queue(trigger_message_id);

-- ============================================================================
-- investor_ai_response_outcomes foreign keys
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_investor_ai_response_outcomes_message_id
  ON public.investor_ai_response_outcomes(message_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_investor_ai_response_outcomes_queue_item_id
  ON public.investor_ai_response_outcomes(queue_item_id);

-- ============================================================================
-- investor_follow_ups foreign keys
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_investor_follow_ups_agent_id
  ON public.investor_follow_ups(agent_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_investor_follow_ups_campaign_id
  ON public.investor_follow_ups(campaign_id);

-- ============================================================================
-- mail_credit_transactions foreign keys (self-reference and touch_log)
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mail_credit_transactions_original_transaction_id
  ON public.mail_credit_transactions(original_transaction_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mail_credit_transactions_touch_log_id
  ON public.mail_credit_transactions(touch_log_id);

-- ============================================================================
-- moltbot_sync_history foreign keys
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moltbot_sync_history_source_id
  ON public.moltbot_sync_history(source_id);

-- ============================================================================
-- property_turnovers foreign keys
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_property_turnovers_maintenance_created_id
  ON public.property_turnovers(maintenance_created_id);

-- ============================================================================
-- re_portfolio_entries foreign keys
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_re_portfolio_entries_deal_id
  ON public.re_portfolio_entries(deal_id);

-- ============================================================================
-- rental_ai_queue foreign keys
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rental_ai_queue_trigger_message_id
  ON public.rental_ai_queue(trigger_message_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rental_ai_queue_sent_message_id
  ON public.rental_ai_queue(sent_message_id);

-- ============================================================================
-- seam_access_codes foreign keys
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seam_access_codes_contact_id
  ON public.seam_access_codes(contact_id);

-- ============================================================================
-- seam_lock_events foreign keys
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seam_lock_events_access_code_id
  ON public.seam_lock_events(access_code_id);

-- ============================================================================
-- vendor_messages foreign keys
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendor_messages_property_id
  ON public.vendor_messages(property_id);

-- ============================================================================
-- VERIFICATION QUERY (run after migration)
-- ============================================================================
-- SELECT
--   t.relname AS table_name,
--   i.relname AS index_name,
--   a.attname AS column_name
-- FROM pg_class t
-- JOIN pg_index ix ON t.oid = ix.indrelid
-- JOIN pg_class i ON i.oid = ix.indexrelid
-- JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
-- WHERE t.relkind = 'r'
--   AND t.relnamespace = 'public'::regnamespace
--   AND i.relname LIKE 'idx_%'
-- ORDER BY t.relname, i.relname;
