-- Migration: Add Missing user_id Indexes
-- Description: Add indexes on user_id columns critical for RLS policy performance
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0002_auth_rls_initplan
-- Note: RLS policies that filter by auth.uid() = user_id need indexes for performance

-- ============================================================================
-- Critical: Tables used in RLS policies filtering by user_id
-- Without these indexes, every RLS check does a full table scan
-- ============================================================================

-- conversation_items
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_items_user_id
  ON public.conversation_items(user_id);

-- moltbot_blocked_patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moltbot_blocked_patterns_user_id
  ON public.moltbot_blocked_patterns(user_id);

-- moltbot_email_analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moltbot_email_analysis_user_id
  ON public.moltbot_email_analysis(user_id);

-- moltbot_learning_queue
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moltbot_learning_queue_user_id
  ON public.moltbot_learning_queue(user_id);

-- moltbot_sync_history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moltbot_sync_history_user_id
  ON public.moltbot_sync_history(user_id);

-- re_properties
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_re_properties_user_id
  ON public.re_properties(user_id);

-- seam_access_codes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seam_access_codes_user_id
  ON public.seam_access_codes(user_id);

-- seam_lock_events
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seam_lock_events_user_id
  ON public.seam_lock_events(user_id);

-- ============================================================================
-- Additional user_id indexes for commonly queried tables
-- These improve general query performance beyond just RLS
-- ============================================================================

-- rental_ai_queue (frequently queried by user)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rental_ai_queue_user_id
  ON public.rental_ai_queue(user_id);

-- investor_ai_queue (frequently queried by user)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_investor_ai_queue_user_id
  ON public.investor_ai_queue(user_id);

-- moltbot_user_memory (core user data)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moltbot_user_memory_user_id
  ON public.moltbot_user_memory(user_id);

-- moltbot_episodic_memory (frequently queried by contact)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moltbot_episodic_memory_user_id
  ON public.moltbot_episodic_memory(user_id);

-- moltbot_knowledge_chunks (vector search + user filter)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moltbot_knowledge_chunks_user_id
  ON public.moltbot_knowledge_chunks(user_id);

-- moltbot_knowledge_sources
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moltbot_knowledge_sources_user_id
  ON public.moltbot_knowledge_sources(user_id);

-- ============================================================================
-- VERIFICATION QUERY (run after migration)
-- ============================================================================
-- SELECT
--   t.relname AS table_name,
--   i.relname AS index_name
-- FROM pg_class t
-- JOIN pg_index ix ON t.oid = ix.indrelid
-- JOIN pg_class i ON i.oid = ix.indexrelid
-- JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
-- WHERE t.relkind = 'r'
--   AND t.relnamespace = 'public'::regnamespace
--   AND a.attname = 'user_id'
-- ORDER BY t.relname;
