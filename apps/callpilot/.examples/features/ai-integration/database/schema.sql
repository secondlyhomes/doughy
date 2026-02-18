-- AI Integration Database Schema
-- This file contains all tables needed for AI features

-- Enable pgvector extension (required for embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- AI Conversations Table
-- =============================================================================
-- Stores chat conversations with AI models
CREATE TABLE ai_conversations (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  model TEXT NOT NULL, -- 'gpt-4o-mini', 'gpt-4o', 'claude-3.5-sonnet', etc.
  messages JSONB NOT NULL DEFAULT '[]', -- Array of message objects
  total_tokens INTEGER NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for ai_conversations
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_created_at ON ai_conversations(created_at DESC);
CREATE INDEX idx_ai_conversations_model ON ai_conversations(model);

-- =============================================================================
-- Embeddings Table (Vector Store)
-- =============================================================================
-- Stores document embeddings for semantic search with pgvector
CREATE TABLE embeddings (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI embeddings are 1536-dimensional
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for embeddings
CREATE INDEX idx_embeddings_user_id ON embeddings(user_id);
CREATE INDEX idx_embeddings_created_at ON embeddings(created_at DESC);

-- Vector similarity search index (HNSW for fast approximate search)
CREATE INDEX idx_embeddings_vector ON embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- GIN index for metadata queries
CREATE INDEX idx_embeddings_metadata ON embeddings USING GIN (metadata);

-- =============================================================================
-- AI Usage Tracking Table
-- =============================================================================
-- Tracks AI API usage for cost monitoring and analytics
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL, -- 'chat', 'embedding', 'moderation', etc.
  model TEXT NOT NULL,
  tokens_prompt INTEGER NOT NULL DEFAULT 0,
  tokens_completion INTEGER NOT NULL DEFAULT 0,
  tokens_total INTEGER NOT NULL DEFAULT 0,
  cost DECIMAL(10, 6) NOT NULL DEFAULT 0.0,
  latency_ms INTEGER, -- Response time in milliseconds
  metadata JSONB DEFAULT '{}', -- Additional context (conversation_id, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for ai_usage
CREATE INDEX idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX idx_ai_usage_created_at ON ai_usage(created_at DESC);
CREATE INDEX idx_ai_usage_operation_type ON ai_usage(operation_type);
CREATE INDEX idx_ai_usage_model ON ai_usage(model);

-- =============================================================================
-- RLS Policies
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- AI Conversations Policies
CREATE POLICY "Users can view their own conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON ai_conversations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON ai_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Embeddings Policies
CREATE POLICY "Users can view their own embeddings"
  ON embeddings FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL); -- Allow NULL user_id for public docs

CREATE POLICY "Users can insert their own embeddings"
  ON embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own embeddings"
  ON embeddings FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own embeddings"
  ON embeddings FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- AI Usage Policies
CREATE POLICY "Users can view their own usage"
  ON ai_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
  ON ai_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- Functions
-- =============================================================================

-- Function: Match embeddings by similarity
-- Returns documents similar to the query embedding
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  filter_metadata jsonb DEFAULT '{}'
)
RETURNS TABLE (
  id text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    embeddings.id,
    embeddings.content,
    embeddings.metadata,
    1 - (embeddings.embedding <=> query_embedding) AS similarity
  FROM embeddings
  WHERE
    (filter_metadata = '{}' OR embeddings.metadata @> filter_metadata)
    AND (1 - (embeddings.embedding <=> query_embedding)) >= match_threshold
    AND (auth.uid() = embeddings.user_id OR embeddings.user_id IS NULL)
  ORDER BY embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function: Delete embeddings by metadata filter
CREATE OR REPLACE FUNCTION delete_by_metadata(
  filter_metadata jsonb
)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count int;
BEGIN
  WITH deleted AS (
    DELETE FROM embeddings
    WHERE
      metadata @> filter_metadata
      AND (auth.uid() = user_id OR user_id IS NULL)
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$;

-- Function: Clear all embeddings for current user
CREATE OR REPLACE FUNCTION clear_all_embeddings()
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count int;
BEGIN
  WITH deleted AS (
    DELETE FROM embeddings
    WHERE auth.uid() = user_id
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$;

-- Function: Get usage statistics for user
CREATE OR REPLACE FUNCTION get_usage_stats(
  user_uuid uuid DEFAULT auth.uid(),
  start_date timestamptz DEFAULT NOW() - INTERVAL '30 days',
  end_date timestamptz DEFAULT NOW()
)
RETURNS TABLE (
  total_requests bigint,
  total_tokens bigint,
  total_cost numeric,
  by_operation jsonb,
  by_model jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint AS total_requests,
    SUM(tokens_total)::bigint AS total_tokens,
    SUM(cost)::numeric AS total_cost,
    jsonb_object_agg(
      operation_type,
      jsonb_build_object(
        'requests', COUNT(*),
        'tokens', SUM(tokens_total),
        'cost', SUM(cost)
      )
    ) AS by_operation,
    jsonb_object_agg(
      model,
      jsonb_build_object(
        'requests', COUNT(*),
        'tokens', SUM(tokens_total),
        'cost', SUM(cost)
      )
    ) AS by_model
  FROM ai_usage
  WHERE
    user_id = user_uuid
    AND created_at BETWEEN start_date AND end_date;
END;
$$;

-- =============================================================================
-- Triggers
-- =============================================================================

-- Update updated_at timestamp on ai_conversations
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_embeddings_updated_at
  BEFORE UPDATE ON embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- Sample Data (Optional - for testing)
-- =============================================================================

-- Uncomment to insert sample embeddings for testing
/*
INSERT INTO embeddings (id, content, embedding, metadata) VALUES
  ('sample-1', 'React Native is a framework for building mobile applications.',
   array_fill(0.0, ARRAY[1536])::vector,
   '{"category": "docs", "topic": "react-native"}'),
  ('sample-2', 'Supabase is an open-source Firebase alternative.',
   array_fill(0.0, ARRAY[1536])::vector,
   '{"category": "docs", "topic": "supabase"}'),
  ('sample-3', 'PostgreSQL is a powerful open-source database.',
   array_fill(0.0, ARRAY[1536])::vector,
   '{"category": "docs", "topic": "database"}');
*/
