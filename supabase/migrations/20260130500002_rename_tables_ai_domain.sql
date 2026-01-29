-- Migration: Rename AI Domain Tables
-- Phase 3: Rename moltbot_* and assistant_* tables to ai_* prefixes
-- Date: 2026-01-30
--
-- This migration renames AI-related tables to use consistent ai_* and ai_moltbot_* prefixes.

BEGIN;

-- ============================================================================
-- STEP 1: Rename assistant_* tables to ai_*
-- ============================================================================

-- assistant_jobs → ai_jobs
ALTER TABLE IF EXISTS public.assistant_jobs
  RENAME TO ai_jobs;

-- assistant_sessions → ai_sessions
ALTER TABLE IF EXISTS public.assistant_sessions
  RENAME TO ai_sessions;

-- ============================================================================
-- STEP 2: Rename moltbot_* tables to ai_moltbot_*
-- ============================================================================

-- Leaf tables first (no FKs pointing to them)
ALTER TABLE IF EXISTS public.moltbot_user_memory
  RENAME TO ai_moltbot_user_memories;

ALTER TABLE IF EXISTS public.moltbot_episodic_memory
  RENAME TO ai_moltbot_episodic_memories;

ALTER TABLE IF EXISTS public.moltbot_global_knowledge
  RENAME TO ai_moltbot_global_knowledge;

ALTER TABLE IF EXISTS public.moltbot_response_examples
  RENAME TO ai_moltbot_response_examples;

ALTER TABLE IF EXISTS public.moltbot_blocked_patterns
  RENAME TO ai_moltbot_blocked_patterns;

ALTER TABLE IF EXISTS public.moltbot_email_analysis
  RENAME TO ai_moltbot_email_analyses;

ALTER TABLE IF EXISTS public.moltbot_security_log
  RENAME TO ai_moltbot_security_logs;

ALTER TABLE IF EXISTS public.moltbot_ip_blocklist
  RENAME TO ai_moltbot_blocked_ips;

ALTER TABLE IF EXISTS public.moltbot_rate_limits
  RENAME TO ai_moltbot_rate_limits;

ALTER TABLE IF EXISTS public.moltbot_learning_queue
  RENAME TO ai_moltbot_learning_queue_items;

ALTER TABLE IF EXISTS public.moltbot_sync_history
  RENAME TO ai_moltbot_sync_records;

-- Child tables (reference moltbot_knowledge_sources)
ALTER TABLE IF EXISTS public.moltbot_knowledge_chunk_tags
  RENAME TO ai_moltbot_knowledge_chunk_tags;

ALTER TABLE IF EXISTS public.moltbot_knowledge_chunks
  RENAME TO ai_moltbot_knowledge_chunks;

-- Parent table
ALTER TABLE IF EXISTS public.moltbot_knowledge_sources
  RENAME TO ai_moltbot_knowledge_sources;

ALTER TABLE IF EXISTS public.moltbot_knowledge_tags
  RENAME TO ai_moltbot_knowledge_tags;

-- ============================================================================
-- STEP 3: Rename orphan AI tables
-- ============================================================================

-- auto_send_rules → ai_auto_send_rules
ALTER TABLE IF EXISTS public.auto_send_rules
  RENAME TO ai_auto_send_rules;

-- capture_items → ai_capture_items
ALTER TABLE IF EXISTS public.capture_items
  RENAME TO ai_capture_items;

-- ============================================================================
-- STEP 4: Update FK constraints for ai_jobs
-- ============================================================================

-- ai_jobs → references investor_deals_pipeline (already updated in investor migration)
-- Just rename the constraint for consistency
ALTER TABLE public.ai_jobs
  DROP CONSTRAINT IF EXISTS ai_jobs_deal_id_fkey,
  ADD CONSTRAINT ai_jobs_deal_id_fkey
    FOREIGN KEY (deal_id) REFERENCES public.investor_deals_pipeline(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 5: Update FK constraints for moltbot knowledge tables
-- ============================================================================

-- ai_moltbot_knowledge_chunks → references ai_moltbot_knowledge_sources
ALTER TABLE public.ai_moltbot_knowledge_chunks
  DROP CONSTRAINT IF EXISTS moltbot_knowledge_chunks_source_id_fkey,
  ADD CONSTRAINT ai_moltbot_knowledge_chunks_source_id_fkey
    FOREIGN KEY (source_id) REFERENCES public.ai_moltbot_knowledge_sources(id) ON DELETE CASCADE;

-- ai_moltbot_knowledge_chunk_tags → references ai_moltbot_knowledge_chunks and ai_moltbot_knowledge_tags
ALTER TABLE public.ai_moltbot_knowledge_chunk_tags
  DROP CONSTRAINT IF EXISTS moltbot_knowledge_chunk_tags_chunk_id_fkey,
  DROP CONSTRAINT IF EXISTS moltbot_knowledge_chunk_tags_tag_id_fkey,
  ADD CONSTRAINT ai_moltbot_knowledge_chunk_tags_chunk_id_fkey
    FOREIGN KEY (chunk_id) REFERENCES public.ai_moltbot_knowledge_chunks(id) ON DELETE CASCADE,
  ADD CONSTRAINT ai_moltbot_knowledge_chunk_tags_tag_id_fkey
    FOREIGN KEY (tag_id) REFERENCES public.ai_moltbot_knowledge_tags(id) ON DELETE CASCADE;

-- ai_moltbot_sync_records → references ai_moltbot_knowledge_sources
ALTER TABLE public.ai_moltbot_sync_records
  DROP CONSTRAINT IF EXISTS moltbot_sync_history_source_id_fkey,
  ADD CONSTRAINT ai_moltbot_sync_records_source_id_fkey
    FOREIGN KEY (source_id) REFERENCES public.ai_moltbot_knowledge_sources(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 6: Update FK constraints for ai_capture_items
-- ============================================================================

-- ai_capture_items → references investor_properties and investor_deals_pipeline
ALTER TABLE public.ai_capture_items
  DROP CONSTRAINT IF EXISTS capture_items_assigned_deal_id_fkey,
  DROP CONSTRAINT IF EXISTS capture_items_assigned_property_id_fkey,
  DROP CONSTRAINT IF EXISTS capture_items_suggested_property_id_fkey,
  DROP CONSTRAINT IF EXISTS capture_items_assigned_lead_id_fkey,
  DROP CONSTRAINT IF EXISTS capture_items_suggested_lead_id_fkey,
  ADD CONSTRAINT ai_capture_items_assigned_deal_id_fkey
    FOREIGN KEY (assigned_deal_id) REFERENCES public.investor_deals_pipeline(id) ON DELETE SET NULL,
  ADD CONSTRAINT ai_capture_items_assigned_property_id_fkey
    FOREIGN KEY (assigned_property_id) REFERENCES public.investor_properties(id) ON DELETE SET NULL,
  ADD CONSTRAINT ai_capture_items_suggested_property_id_fkey
    FOREIGN KEY (suggested_property_id) REFERENCES public.investor_properties(id) ON DELETE SET NULL,
  ADD CONSTRAINT ai_capture_items_assigned_lead_id_fkey
    FOREIGN KEY (assigned_lead_id) REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  ADD CONSTRAINT ai_capture_items_suggested_lead_id_fkey
    FOREIGN KEY (suggested_lead_id) REFERENCES public.crm_leads(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 7: Update FK constraints for ai_auto_send_rules
-- ============================================================================

-- ai_auto_send_rules → references landlord_properties and landlord_guest_templates
ALTER TABLE public.ai_auto_send_rules
  DROP CONSTRAINT IF EXISTS auto_send_rules_property_id_fkey,
  DROP CONSTRAINT IF EXISTS auto_send_rules_template_id_fkey,
  ADD CONSTRAINT ai_auto_send_rules_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.landlord_properties(id) ON DELETE CASCADE,
  ADD CONSTRAINT ai_auto_send_rules_template_id_fkey
    FOREIGN KEY (template_id) REFERENCES public.landlord_guest_templates(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 8: Update RLS policies for AI tables
-- ============================================================================

-- RLS for ai_jobs
DROP POLICY IF EXISTS "assistant_jobs_select_policy" ON public.ai_jobs;
DROP POLICY IF EXISTS "assistant_jobs_insert_policy" ON public.ai_jobs;
DROP POLICY IF EXISTS "assistant_jobs_update_policy" ON public.ai_jobs;
DROP POLICY IF EXISTS "assistant_jobs_delete_policy" ON public.ai_jobs;

CREATE POLICY "ai_jobs_select_policy" ON public.ai_jobs
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "ai_jobs_insert_policy" ON public.ai_jobs
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "ai_jobs_update_policy" ON public.ai_jobs
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "ai_jobs_delete_policy" ON public.ai_jobs
  FOR DELETE USING (auth.uid() = created_by);

-- RLS for ai_sessions
DROP POLICY IF EXISTS "assistant_sessions_select_policy" ON public.ai_sessions;
DROP POLICY IF EXISTS "assistant_sessions_insert_policy" ON public.ai_sessions;
DROP POLICY IF EXISTS "assistant_sessions_update_policy" ON public.ai_sessions;
DROP POLICY IF EXISTS "assistant_sessions_delete_policy" ON public.ai_sessions;

CREATE POLICY "ai_sessions_select_policy" ON public.ai_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_sessions_insert_policy" ON public.ai_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_sessions_update_policy" ON public.ai_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ai_sessions_delete_policy" ON public.ai_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for ai_moltbot_user_memories
DROP POLICY IF EXISTS "moltbot_user_memory_select_policy" ON public.ai_moltbot_user_memories;
DROP POLICY IF EXISTS "moltbot_user_memory_insert_policy" ON public.ai_moltbot_user_memories;
DROP POLICY IF EXISTS "moltbot_user_memory_update_policy" ON public.ai_moltbot_user_memories;
DROP POLICY IF EXISTS "moltbot_user_memory_delete_policy" ON public.ai_moltbot_user_memories;

CREATE POLICY "ai_moltbot_user_memories_select_policy" ON public.ai_moltbot_user_memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_moltbot_user_memories_insert_policy" ON public.ai_moltbot_user_memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_moltbot_user_memories_update_policy" ON public.ai_moltbot_user_memories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ai_moltbot_user_memories_delete_policy" ON public.ai_moltbot_user_memories
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for ai_moltbot_episodic_memories
DROP POLICY IF EXISTS "moltbot_episodic_memory_select_policy" ON public.ai_moltbot_episodic_memories;
DROP POLICY IF EXISTS "moltbot_episodic_memory_insert_policy" ON public.ai_moltbot_episodic_memories;
DROP POLICY IF EXISTS "moltbot_episodic_memory_update_policy" ON public.ai_moltbot_episodic_memories;
DROP POLICY IF EXISTS "moltbot_episodic_memory_delete_policy" ON public.ai_moltbot_episodic_memories;

CREATE POLICY "ai_moltbot_episodic_memories_select_policy" ON public.ai_moltbot_episodic_memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_moltbot_episodic_memories_insert_policy" ON public.ai_moltbot_episodic_memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_moltbot_episodic_memories_update_policy" ON public.ai_moltbot_episodic_memories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ai_moltbot_episodic_memories_delete_policy" ON public.ai_moltbot_episodic_memories
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for ai_moltbot_security_logs
DROP POLICY IF EXISTS "moltbot_security_log_select_policy" ON public.ai_moltbot_security_logs;
DROP POLICY IF EXISTS "moltbot_security_log_insert_policy" ON public.ai_moltbot_security_logs;
DROP POLICY IF EXISTS "moltbot_security_log_update_policy" ON public.ai_moltbot_security_logs;
DROP POLICY IF EXISTS "moltbot_security_log_delete_policy" ON public.ai_moltbot_security_logs;

CREATE POLICY "ai_moltbot_security_logs_select_policy" ON public.ai_moltbot_security_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_moltbot_security_logs_insert_policy" ON public.ai_moltbot_security_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_moltbot_security_logs_update_policy" ON public.ai_moltbot_security_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ai_moltbot_security_logs_delete_policy" ON public.ai_moltbot_security_logs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for ai_moltbot_rate_limits
DROP POLICY IF EXISTS "moltbot_rate_limits_select_policy" ON public.ai_moltbot_rate_limits;
DROP POLICY IF EXISTS "moltbot_rate_limits_insert_policy" ON public.ai_moltbot_rate_limits;
DROP POLICY IF EXISTS "moltbot_rate_limits_update_policy" ON public.ai_moltbot_rate_limits;
DROP POLICY IF EXISTS "moltbot_rate_limits_delete_policy" ON public.ai_moltbot_rate_limits;

CREATE POLICY "ai_moltbot_rate_limits_select_policy" ON public.ai_moltbot_rate_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_moltbot_rate_limits_insert_policy" ON public.ai_moltbot_rate_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_moltbot_rate_limits_update_policy" ON public.ai_moltbot_rate_limits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ai_moltbot_rate_limits_delete_policy" ON public.ai_moltbot_rate_limits
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for ai_auto_send_rules
DROP POLICY IF EXISTS "auto_send_rules_select_policy" ON public.ai_auto_send_rules;
DROP POLICY IF EXISTS "auto_send_rules_insert_policy" ON public.ai_auto_send_rules;
DROP POLICY IF EXISTS "auto_send_rules_update_policy" ON public.ai_auto_send_rules;
DROP POLICY IF EXISTS "auto_send_rules_delete_policy" ON public.ai_auto_send_rules;

CREATE POLICY "ai_auto_send_rules_select_policy" ON public.ai_auto_send_rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_auto_send_rules_insert_policy" ON public.ai_auto_send_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_auto_send_rules_update_policy" ON public.ai_auto_send_rules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ai_auto_send_rules_delete_policy" ON public.ai_auto_send_rules
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for ai_capture_items
DROP POLICY IF EXISTS "capture_items_select_policy" ON public.ai_capture_items;
DROP POLICY IF EXISTS "capture_items_insert_policy" ON public.ai_capture_items;
DROP POLICY IF EXISTS "capture_items_update_policy" ON public.ai_capture_items;
DROP POLICY IF EXISTS "capture_items_delete_policy" ON public.ai_capture_items;

CREATE POLICY "ai_capture_items_select_policy" ON public.ai_capture_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_capture_items_insert_policy" ON public.ai_capture_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_capture_items_update_policy" ON public.ai_capture_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ai_capture_items_delete_policy" ON public.ai_capture_items
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for ai_moltbot_knowledge_sources
DROP POLICY IF EXISTS "moltbot_knowledge_sources_select_policy" ON public.ai_moltbot_knowledge_sources;
DROP POLICY IF EXISTS "moltbot_knowledge_sources_insert_policy" ON public.ai_moltbot_knowledge_sources;
DROP POLICY IF EXISTS "moltbot_knowledge_sources_update_policy" ON public.ai_moltbot_knowledge_sources;
DROP POLICY IF EXISTS "moltbot_knowledge_sources_delete_policy" ON public.ai_moltbot_knowledge_sources;

CREATE POLICY "ai_moltbot_knowledge_sources_select_policy" ON public.ai_moltbot_knowledge_sources
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_moltbot_knowledge_sources_insert_policy" ON public.ai_moltbot_knowledge_sources
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_moltbot_knowledge_sources_update_policy" ON public.ai_moltbot_knowledge_sources
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ai_moltbot_knowledge_sources_delete_policy" ON public.ai_moltbot_knowledge_sources
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for ai_moltbot_knowledge_chunks
DROP POLICY IF EXISTS "moltbot_knowledge_chunks_select_policy" ON public.ai_moltbot_knowledge_chunks;
DROP POLICY IF EXISTS "moltbot_knowledge_chunks_insert_policy" ON public.ai_moltbot_knowledge_chunks;
DROP POLICY IF EXISTS "moltbot_knowledge_chunks_update_policy" ON public.ai_moltbot_knowledge_chunks;
DROP POLICY IF EXISTS "moltbot_knowledge_chunks_delete_policy" ON public.ai_moltbot_knowledge_chunks;

CREATE POLICY "ai_moltbot_knowledge_chunks_select_policy" ON public.ai_moltbot_knowledge_chunks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_moltbot_knowledge_chunks_insert_policy" ON public.ai_moltbot_knowledge_chunks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_moltbot_knowledge_chunks_update_policy" ON public.ai_moltbot_knowledge_chunks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ai_moltbot_knowledge_chunks_delete_policy" ON public.ai_moltbot_knowledge_chunks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 9: Rename indexes
-- ============================================================================

ALTER INDEX IF EXISTS assistant_jobs_pkey RENAME TO ai_jobs_pkey;
ALTER INDEX IF EXISTS assistant_jobs_user_id_idx RENAME TO ai_jobs_user_id_idx;
ALTER INDEX IF EXISTS assistant_sessions_pkey RENAME TO ai_sessions_pkey;
ALTER INDEX IF EXISTS assistant_sessions_user_id_idx RENAME TO ai_sessions_user_id_idx;

ALTER INDEX IF EXISTS moltbot_user_memory_pkey RENAME TO ai_moltbot_user_memories_pkey;
ALTER INDEX IF EXISTS moltbot_episodic_memory_pkey RENAME TO ai_moltbot_episodic_memories_pkey;
ALTER INDEX IF EXISTS moltbot_security_log_pkey RENAME TO ai_moltbot_security_logs_pkey;
ALTER INDEX IF EXISTS moltbot_rate_limits_pkey RENAME TO ai_moltbot_rate_limits_pkey;
ALTER INDEX IF EXISTS moltbot_knowledge_sources_pkey RENAME TO ai_moltbot_knowledge_sources_pkey;
ALTER INDEX IF EXISTS moltbot_knowledge_chunks_pkey RENAME TO ai_moltbot_knowledge_chunks_pkey;
ALTER INDEX IF EXISTS moltbot_knowledge_tags_pkey RENAME TO ai_moltbot_knowledge_tags_pkey;
ALTER INDEX IF EXISTS moltbot_knowledge_chunk_tags_pkey RENAME TO ai_moltbot_knowledge_chunk_tags_pkey;

-- ============================================================================
-- STEP 10: Add comments
-- ============================================================================

COMMENT ON TABLE public.ai_jobs IS 'AI assistant jobs (formerly assistant_jobs)';
COMMENT ON TABLE public.ai_sessions IS 'AI assistant sessions (formerly assistant_sessions)';
COMMENT ON TABLE public.ai_moltbot_user_memories IS 'MoltBot user-specific memories (formerly moltbot_user_memory)';
COMMENT ON TABLE public.ai_moltbot_episodic_memories IS 'MoltBot episodic memories (formerly moltbot_episodic_memory)';
COMMENT ON TABLE public.ai_moltbot_global_knowledge IS 'MoltBot global knowledge base (formerly moltbot_global_knowledge)';
COMMENT ON TABLE public.ai_moltbot_security_logs IS 'MoltBot security logs (formerly moltbot_security_log)';
COMMENT ON TABLE public.ai_moltbot_rate_limits IS 'MoltBot rate limiting (formerly moltbot_rate_limits)';
COMMENT ON TABLE public.ai_moltbot_blocked_patterns IS 'MoltBot blocked response patterns (formerly moltbot_blocked_patterns)';
COMMENT ON TABLE public.ai_moltbot_blocked_ips IS 'MoltBot blocked IPs (formerly moltbot_ip_blocklist)';
COMMENT ON TABLE public.ai_moltbot_knowledge_sources IS 'MoltBot knowledge sources (formerly moltbot_knowledge_sources)';
COMMENT ON TABLE public.ai_moltbot_knowledge_chunks IS 'MoltBot knowledge chunks (formerly moltbot_knowledge_chunks)';
COMMENT ON TABLE public.ai_moltbot_knowledge_tags IS 'MoltBot knowledge tags (formerly moltbot_knowledge_tags)';
COMMENT ON TABLE public.ai_moltbot_knowledge_chunk_tags IS 'MoltBot knowledge chunk tag associations (formerly moltbot_knowledge_chunk_tags)';
COMMENT ON TABLE public.ai_moltbot_sync_records IS 'MoltBot sync history (formerly moltbot_sync_history)';
COMMENT ON TABLE public.ai_moltbot_learning_queue_items IS 'MoltBot learning queue (formerly moltbot_learning_queue)';
COMMENT ON TABLE public.ai_moltbot_response_examples IS 'MoltBot response examples (formerly moltbot_response_examples)';
COMMENT ON TABLE public.ai_moltbot_email_analyses IS 'MoltBot email analysis results (formerly moltbot_email_analysis)';
COMMENT ON TABLE public.ai_auto_send_rules IS 'AI auto-send rules for guest messaging (formerly auto_send_rules)';
COMMENT ON TABLE public.ai_capture_items IS 'AI captured items from conversations (formerly capture_items)';

COMMIT;
