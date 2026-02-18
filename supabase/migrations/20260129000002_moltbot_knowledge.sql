-- Migration: MoltBot Knowledge Base Integration
-- Description: Creates tables for external knowledge sources (Fibery, Notion, Discord) and semantic search
-- Phase: MoltBot Ecosystem Expansion - Phase 3 (Knowledge Integration)

-- ============================================================================
-- ENABLE PGVECTOR EXTENSION (if not already enabled)
-- ============================================================================
-- Note: This may already be enabled. If it fails, check Supabase dashboard
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Knowledge source types
CREATE TYPE moltbot_knowledge_source_type AS ENUM (
  'fibery',        -- Fibery workspace
  'notion',        -- Notion workspace
  'google_docs',   -- Google Docs/Drive
  'discord',       -- Discord community
  'email_history', -- User's sent email history
  'manual',        -- Manually entered
  'uploaded'       -- Uploaded documents
);

-- Sync status for knowledge sources
CREATE TYPE moltbot_sync_status AS ENUM (
  'pending',       -- Initial state, not yet synced
  'syncing',       -- Currently syncing
  'synced',        -- Successfully synced
  'error',         -- Sync failed
  'paused'         -- Temporarily paused
);

-- Knowledge chunk types
CREATE TYPE moltbot_chunk_type AS ENUM (
  'property_rule',      -- Rule specific to a property
  'response_example',   -- Example response template
  'sop',               -- Standard operating procedure
  'faq',               -- Frequently asked question
  'policy',            -- General policy document
  'email_template',    -- Email template
  'community_insight', -- Insight from community discussions
  'training_material'  -- Training or onboarding material
);

-- ============================================================================
-- 1. MOLTBOT_KNOWLEDGE_SOURCES
-- ============================================================================
-- Configuration for external knowledge sources that feed into MoltBot

CREATE TABLE IF NOT EXISTS moltbot_knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Source configuration
  source_type moltbot_knowledge_source_type NOT NULL,
  name TEXT NOT NULL,                    -- Human-readable name
  description TEXT,                      -- Description of what this source contains

  -- Connection config (encrypted at rest by Supabase)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- For Fibery: { workspace_id, api_key, database_ids: [] }
  -- For Notion: { workspace_id, integration_token, database_ids: [] }
  -- For Google: { folder_id, oauth_refresh_token }
  -- For Discord: { server_id, channel_ids: [], bot_token }
  -- For Email: { include_patterns: [], exclude_patterns: [] }

  -- Sync configuration
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('manual', 'hourly', 'daily', 'weekly')),
  sync_status moltbot_sync_status DEFAULT 'pending',
  last_sync_at TIMESTAMPTZ,
  last_sync_error TEXT,
  next_sync_at TIMESTAMPTZ,

  -- Content statistics
  total_chunks INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for knowledge sources
CREATE INDEX idx_knowledge_sources_user ON moltbot_knowledge_sources(user_id) WHERE is_active = true;
CREATE INDEX idx_knowledge_sources_sync ON moltbot_knowledge_sources(next_sync_at)
  WHERE is_active = true AND sync_status != 'paused';

-- ============================================================================
-- 2. MOLTBOT_KNOWLEDGE_CHUNKS
-- ============================================================================
-- Chunked content from knowledge sources with optional embeddings for semantic search

CREATE TABLE IF NOT EXISTS moltbot_knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES moltbot_knowledge_sources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Chunk classification
  chunk_type moltbot_chunk_type NOT NULL,
  title TEXT,                            -- Title or heading
  content TEXT NOT NULL,                 -- The actual content

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  -- May include: property_id, category, tags, original_url, author, etc.

  -- Source reference
  external_id TEXT,                      -- ID in the source system
  external_url TEXT,                     -- URL in the source system
  external_path TEXT,                    -- Path/hierarchy in source

  -- Embedding for semantic search (1536 = OpenAI ada-002 dimension)
  embedding vector(1536),

  -- Token count for context window management
  token_count INTEGER,

  -- Quality and usage
  relevance_score NUMERIC(5,4) DEFAULT 1.0,
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Content hash for deduplication
  content_hash TEXT,

  -- Timestamps
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for chunk retrieval
CREATE INDEX idx_knowledge_chunks_user ON moltbot_knowledge_chunks(user_id);
CREATE INDEX idx_knowledge_chunks_source ON moltbot_knowledge_chunks(source_id);
CREATE INDEX idx_knowledge_chunks_type ON moltbot_knowledge_chunks(user_id, chunk_type);
CREATE INDEX idx_knowledge_chunks_hash ON moltbot_knowledge_chunks(source_id, content_hash);

-- HNSW index for fast approximate nearest neighbor search on embeddings
-- Using cosine distance (<=>) for normalized embeddings
CREATE INDEX idx_knowledge_chunks_embedding ON moltbot_knowledge_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- 3. MOLTBOT_KNOWLEDGE_TAGS
-- ============================================================================
-- Tags for organizing and filtering knowledge chunks

CREATE TABLE IF NOT EXISTS moltbot_knowledge_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tag definition
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,                            -- Hex color for UI

  -- Usage
  use_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_tag UNIQUE (user_id, name)
);

-- Junction table for chunk-tag relationships
CREATE TABLE IF NOT EXISTS moltbot_knowledge_chunk_tags (
  chunk_id UUID NOT NULL REFERENCES moltbot_knowledge_chunks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES moltbot_knowledge_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (chunk_id, tag_id)
);

-- Indexes for tag lookups
CREATE INDEX idx_chunk_tags_chunk ON moltbot_knowledge_chunk_tags(chunk_id);
CREATE INDEX idx_chunk_tags_tag ON moltbot_knowledge_chunk_tags(tag_id);

-- ============================================================================
-- 4. MOLTBOT_SYNC_HISTORY
-- ============================================================================
-- History of sync operations for debugging and monitoring

CREATE TABLE IF NOT EXISTS moltbot_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES moltbot_knowledge_sources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Sync results
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  chunks_added INTEGER DEFAULT 0,
  chunks_updated INTEGER DEFAULT 0,
  chunks_deleted INTEGER DEFAULT 0,
  error_message TEXT,
  error_details JSONB,

  -- Duration
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for sync history lookups
CREATE INDEX idx_sync_history_source ON moltbot_sync_history(source_id, created_at DESC);

-- ============================================================================
-- 5. MOLTBOT_EMAIL_ANALYSIS
-- ============================================================================
-- Analysis results from user's email history for learning writing style

CREATE TABLE IF NOT EXISTS moltbot_email_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Analysis type
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('writing_style', 'response_pattern', 'topic_coverage')),

  -- Results
  results JSONB NOT NULL,
  -- For writing_style: { formality: 0-1, greeting_patterns: [], sign_off_patterns: [], avg_length: int }
  -- For response_pattern: { topic, common_responses: [], success_indicators: [] }
  -- For topic_coverage: { topics: [{ name, frequency, avg_response_time }] }

  -- Sample size
  emails_analyzed INTEGER,
  date_range_start DATE,
  date_range_end DATE,

  -- Status
  confidence NUMERIC(5,4),
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email analysis
CREATE INDEX idx_email_analysis_user ON moltbot_email_analysis(user_id, analysis_type) WHERE is_active = true;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE moltbot_knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE moltbot_knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE moltbot_knowledge_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE moltbot_knowledge_chunk_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE moltbot_sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE moltbot_email_analysis ENABLE ROW LEVEL SECURITY;

-- Knowledge sources: Users can only access their own
CREATE POLICY "Users can view own knowledge sources"
  ON moltbot_knowledge_sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own knowledge sources"
  ON moltbot_knowledge_sources FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to knowledge sources"
  ON moltbot_knowledge_sources FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Knowledge chunks: Users can only access their own
CREATE POLICY "Users can view own knowledge chunks"
  ON moltbot_knowledge_chunks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own knowledge chunks"
  ON moltbot_knowledge_chunks FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to knowledge chunks"
  ON moltbot_knowledge_chunks FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Knowledge tags: Users can only access their own
CREATE POLICY "Users can view own tags"
  ON moltbot_knowledge_tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tags"
  ON moltbot_knowledge_tags FOR ALL
  USING (auth.uid() = user_id);

-- Chunk tags: Access via chunk ownership
CREATE POLICY "Users can manage chunk tags for own chunks"
  ON moltbot_knowledge_chunk_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM moltbot_knowledge_chunks c
      WHERE c.id = chunk_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to chunk tags"
  ON moltbot_knowledge_chunk_tags FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Sync history: Users can only view their own
CREATE POLICY "Users can view own sync history"
  ON moltbot_sync_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages sync history"
  ON moltbot_sync_history FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Email analysis: Users can only access their own
CREATE POLICY "Users can view own email analysis"
  ON moltbot_email_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages email analysis"
  ON moltbot_email_analysis FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to search knowledge chunks semantically
CREATE OR REPLACE FUNCTION search_knowledge_chunks(
  p_user_id UUID,
  p_query_embedding vector(1536),
  p_chunk_types moltbot_chunk_type[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 5,
  p_similarity_threshold NUMERIC DEFAULT 0.7
)
RETURNS TABLE(
  id UUID,
  chunk_type moltbot_chunk_type,
  title TEXT,
  content TEXT,
  metadata JSONB,
  similarity NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.chunk_type,
    kc.title,
    kc.content,
    kc.metadata,
    (1 - (kc.embedding <=> p_query_embedding))::NUMERIC as similarity
  FROM moltbot_knowledge_chunks kc
  WHERE kc.user_id = p_user_id
    AND kc.embedding IS NOT NULL
    AND (p_chunk_types IS NULL OR kc.chunk_type = ANY(p_chunk_types))
    AND (1 - (kc.embedding <=> p_query_embedding)) >= p_similarity_threshold
  ORDER BY kc.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$;

-- Function to search knowledge chunks by keyword (fallback when no embeddings)
CREATE OR REPLACE FUNCTION search_knowledge_keyword(
  p_user_id UUID,
  p_query TEXT,
  p_chunk_types moltbot_chunk_type[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  chunk_type moltbot_chunk_type,
  title TEXT,
  content TEXT,
  metadata JSONB,
  relevance REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.chunk_type,
    kc.title,
    kc.content,
    kc.metadata,
    ts_rank(
      to_tsvector('english', COALESCE(kc.title, '') || ' ' || kc.content),
      plainto_tsquery('english', p_query)
    ) as relevance
  FROM moltbot_knowledge_chunks kc
  WHERE kc.user_id = p_user_id
    AND (p_chunk_types IS NULL OR kc.chunk_type = ANY(p_chunk_types))
    AND (
      to_tsvector('english', COALESCE(kc.title, '') || ' ' || kc.content)
      @@ plainto_tsquery('english', p_query)
    )
  ORDER BY relevance DESC
  LIMIT p_limit;
END;
$$;

-- Function to get knowledge context for AI
CREATE OR REPLACE FUNCTION get_knowledge_context(
  p_user_id UUID,
  p_query_embedding vector(1536) DEFAULT NULL,
  p_query_text TEXT DEFAULT NULL,
  p_chunk_types moltbot_chunk_type[] DEFAULT NULL,
  p_max_tokens INTEGER DEFAULT 2000,
  p_limit INTEGER DEFAULT 5
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_context TEXT := '';
  v_total_tokens INTEGER := 0;
  v_chunk RECORD;
BEGIN
  -- Try semantic search first if embedding provided
  IF p_query_embedding IS NOT NULL THEN
    FOR v_chunk IN
      SELECT title, content, token_count
      FROM search_knowledge_chunks(p_user_id, p_query_embedding, p_chunk_types, p_limit, 0.6)
    LOOP
      IF v_total_tokens + COALESCE(v_chunk.token_count, 0) > p_max_tokens THEN
        EXIT;
      END IF;

      IF v_chunk.title IS NOT NULL THEN
        v_context := v_context || '## ' || v_chunk.title || E'\n';
      END IF;
      v_context := v_context || v_chunk.content || E'\n\n';
      v_total_tokens := v_total_tokens + COALESCE(v_chunk.token_count, 0);
    END LOOP;
  END IF;

  -- Fall back to keyword search if no embedding or no results
  IF v_context = '' AND p_query_text IS NOT NULL THEN
    FOR v_chunk IN
      SELECT title, content, 0 as token_count
      FROM search_knowledge_keyword(p_user_id, p_query_text, p_chunk_types, p_limit)
    LOOP
      -- Estimate tokens as ~4 chars per token
      IF v_total_tokens + (LENGTH(v_chunk.content) / 4) > p_max_tokens THEN
        EXIT;
      END IF;

      IF v_chunk.title IS NOT NULL THEN
        v_context := v_context || '## ' || v_chunk.title || E'\n';
      END IF;
      v_context := v_context || v_chunk.content || E'\n\n';
      v_total_tokens := v_total_tokens + (LENGTH(v_chunk.content) / 4);
    END LOOP;
  END IF;

  RETURN v_context;
END;
$$;

-- Function to record chunk usage
CREATE OR REPLACE FUNCTION record_chunk_usage(p_chunk_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE moltbot_knowledge_chunks
  SET
    use_count = use_count + 1,
    last_used_at = NOW()
  WHERE id = p_chunk_id;
END;
$$;

-- Function to get sources due for sync
CREATE OR REPLACE FUNCTION get_sources_due_for_sync(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  source_type moltbot_knowledge_source_type,
  name TEXT,
  config JSONB,
  last_sync_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ks.id,
    ks.user_id,
    ks.source_type,
    ks.name,
    ks.config,
    ks.last_sync_at
  FROM moltbot_knowledge_sources ks
  WHERE ks.is_active = true
    AND ks.sync_status != 'syncing'
    AND ks.sync_status != 'paused'
    AND (
      ks.next_sync_at IS NULL
      OR ks.next_sync_at <= NOW()
    )
  ORDER BY ks.next_sync_at ASC NULLS FIRST
  LIMIT p_limit;
END;
$$;

-- Function to update source sync status
CREATE OR REPLACE FUNCTION update_source_sync_status(
  p_source_id UUID,
  p_status moltbot_sync_status,
  p_error TEXT DEFAULT NULL,
  p_chunks_count INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_sync TIMESTAMPTZ;
  v_frequency TEXT;
BEGIN
  -- Get the sync frequency
  SELECT sync_frequency INTO v_frequency
  FROM moltbot_knowledge_sources
  WHERE id = p_source_id;

  -- Calculate next sync time based on frequency
  IF p_status = 'synced' THEN
    CASE v_frequency
      WHEN 'hourly' THEN v_next_sync := NOW() + INTERVAL '1 hour';
      WHEN 'daily' THEN v_next_sync := NOW() + INTERVAL '1 day';
      WHEN 'weekly' THEN v_next_sync := NOW() + INTERVAL '1 week';
      ELSE v_next_sync := NULL; -- manual
    END CASE;
  ELSIF p_status = 'error' THEN
    -- Retry after 1 hour on error
    v_next_sync := NOW() + INTERVAL '1 hour';
  END IF;

  UPDATE moltbot_knowledge_sources
  SET
    sync_status = p_status,
    last_sync_at = CASE WHEN p_status IN ('synced', 'error') THEN NOW() ELSE last_sync_at END,
    last_sync_error = p_error,
    next_sync_at = v_next_sync,
    total_chunks = COALESCE(p_chunks_count, total_chunks),
    updated_at = NOW()
  WHERE id = p_source_id;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at on knowledge sources
CREATE OR REPLACE FUNCTION update_knowledge_source_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_knowledge_source_updated_at
  BEFORE UPDATE ON moltbot_knowledge_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_source_updated_at();

-- Update updated_at on knowledge chunks
CREATE TRIGGER trigger_knowledge_chunks_updated_at
  BEFORE UPDATE ON moltbot_knowledge_chunks
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_source_updated_at();

-- Update updated_at on email analysis
CREATE TRIGGER trigger_email_analysis_updated_at
  BEFORE UPDATE ON moltbot_email_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_source_updated_at();

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE moltbot_knowledge_sources IS 'Configuration for external knowledge sources (Fibery, Notion, Discord, etc.)';
COMMENT ON TABLE moltbot_knowledge_chunks IS 'Chunked content from knowledge sources with optional embeddings for semantic search';
COMMENT ON TABLE moltbot_knowledge_tags IS 'Tags for organizing and filtering knowledge chunks';
COMMENT ON TABLE moltbot_knowledge_chunk_tags IS 'Junction table for chunk-tag relationships';
COMMENT ON TABLE moltbot_sync_history IS 'History of sync operations for knowledge sources';
COMMENT ON TABLE moltbot_email_analysis IS 'Analysis results from user email history for learning writing style';

COMMENT ON FUNCTION search_knowledge_chunks IS 'Search knowledge chunks using vector similarity (semantic search)';
COMMENT ON FUNCTION search_knowledge_keyword IS 'Search knowledge chunks using full-text keyword search';
COMMENT ON FUNCTION get_knowledge_context IS 'Get formatted knowledge context for AI prompts with token limit';
COMMENT ON FUNCTION record_chunk_usage IS 'Record that a knowledge chunk was used in a response';
COMMENT ON FUNCTION get_sources_due_for_sync IS 'Get knowledge sources that need to be synced';
COMMENT ON FUNCTION update_source_sync_status IS 'Update sync status for a knowledge source';
