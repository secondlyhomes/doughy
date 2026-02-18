# Database Migrations Guide

This guide explains how to set up the AI integration database schema in your Supabase project.

## Quick Setup

### Option 1: Run Full Schema (Recommended for New Projects)

```bash
# Run the complete schema file
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" < schema.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor in Supabase Dashboard
2. Copy entire `schema.sql` file
3. Run the SQL

### Option 2: Step-by-Step Migration (For Existing Projects)

Run each migration in order:

#### 1. Enable pgvector Extension

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 2. Create Tables

```sql
-- Run table creation sections from schema.sql
```

#### 3. Enable RLS

```sql
-- Run RLS policy sections from schema.sql
```

#### 4. Create Functions

```sql
-- Run function creation sections from schema.sql
```

#### 5. Set Up Triggers

```sql
-- Run trigger creation sections from schema.sql
```

## Verify Installation

After running the schema, verify everything is set up correctly:

```sql
-- Check if pgvector is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('ai_conversations', 'embeddings', 'ai_usage');

-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('ai_conversations', 'embeddings', 'ai_usage');

-- Verify match_embeddings function exists
SELECT proname FROM pg_proc WHERE proname = 'match_embeddings';
```

## Database Structure

### Tables

1. **ai_conversations** - Stores chat conversations
   - Primary fields: `id`, `user_id`, `title`, `model`, `messages`, `total_tokens`, `total_cost`
   - Indexed on: `user_id`, `created_at`, `model`

2. **embeddings** - Vector store for semantic search
   - Primary fields: `id`, `user_id`, `content`, `embedding`, `metadata`
   - Uses pgvector HNSW index for fast similarity search
   - Indexed on: `user_id`, `created_at`, `embedding`, `metadata`

3. **ai_usage** - Usage tracking for cost monitoring
   - Primary fields: `id`, `user_id`, `operation_type`, `model`, `tokens_*`, `cost`, `latency_ms`
   - Indexed on: `user_id`, `created_at`, `operation_type`, `model`

### Functions

1. **match_embeddings()** - Similarity search with threshold and filtering
2. **delete_by_metadata()** - Delete embeddings by metadata filter
3. **clear_all_embeddings()** - Clear all embeddings for current user
4. **get_usage_stats()** - Get usage statistics with aggregations

## Security

All tables have Row Level Security (RLS) enabled:

- Users can only access their own conversations
- Users can access their own embeddings + public embeddings (user_id IS NULL)
- Users can only view their own usage data

## Testing the Setup

### Test Conversations Table

```sql
-- Insert a test conversation (replace with your user_id)
INSERT INTO ai_conversations (id, user_id, title, model, messages, total_tokens, total_cost)
VALUES (
  'test-conv-1',
  'YOUR_USER_ID',
  'Test Conversation',
  'gpt-4o-mini',
  '[{"role":"user","content":"Hello"}]'::jsonb,
  10,
  0.000015
);

-- Query it back
SELECT * FROM ai_conversations WHERE id = 'test-conv-1';
```

### Test Embeddings Table

```sql
-- Insert a test embedding
INSERT INTO embeddings (id, content, embedding, metadata)
VALUES (
  'test-doc-1',
  'This is a test document about AI.',
  array_fill(0.1, ARRAY[1536])::vector,
  '{"category":"test"}'::jsonb
);

-- Test similarity search
SELECT * FROM match_embeddings(
  array_fill(0.1, ARRAY[1536])::vector,
  0.5,
  5,
  '{}'::jsonb
);
```

### Test Usage Tracking

```sql
-- Insert a test usage record
INSERT INTO ai_usage (user_id, operation_type, model, tokens_prompt, tokens_completion, tokens_total, cost)
VALUES (
  'YOUR_USER_ID',
  'chat',
  'gpt-4o-mini',
  100,
  50,
  150,
  0.000225
);

-- Get usage stats
SELECT * FROM get_usage_stats('YOUR_USER_ID');
```

## Rollback

To completely remove all AI integration tables and functions:

```sql
-- Drop tables (cascade will drop related objects)
DROP TABLE IF EXISTS ai_conversations CASCADE;
DROP TABLE IF EXISTS embeddings CASCADE;
DROP TABLE IF EXISTS ai_usage CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS match_embeddings;
DROP FUNCTION IF EXISTS delete_by_metadata;
DROP FUNCTION IF EXISTS clear_all_embeddings;
DROP FUNCTION IF EXISTS get_usage_stats;
DROP FUNCTION IF EXISTS update_updated_at;

-- Optionally remove pgvector (only if not used elsewhere)
-- DROP EXTENSION IF EXISTS vector;
```

## Performance Optimization

### Vector Index Tuning

The HNSW index has two key parameters:

- `m`: Number of connections per layer (default: 16, higher = more accurate but slower)
- `ef_construction`: Size of dynamic candidate list (default: 64, higher = more accurate but slower build)

Adjust based on your needs:

```sql
-- For faster queries (but slower inserts)
CREATE INDEX idx_embeddings_vector ON embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 32, ef_construction = 128);

-- For faster inserts (but slower queries)
CREATE INDEX idx_embeddings_vector ON embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 8, ef_construction = 32);
```

### Query Performance Tips

1. **Use appropriate match_threshold**: Higher threshold = fewer results = faster
2. **Limit results**: Don't fetch more than you need
3. **Filter by metadata first**: Use specific metadata filters to reduce search space
4. **Monitor index usage**: Check query plans with `EXPLAIN ANALYZE`

### Example: Optimize Similarity Search

```sql
-- Before optimization
SELECT * FROM match_embeddings(
  query_embedding,
  0.3,  -- Low threshold = more results
  100,  -- Many results
  '{}'  -- No filtering
);

-- After optimization
SELECT * FROM match_embeddings(
  query_embedding,
  0.7,                              -- Higher threshold
  10,                               -- Fewer results
  '{"category": "docs"}'::jsonb     -- Filter by metadata
);
```

## Troubleshooting

### pgvector Extension Not Found

```bash
# Enable pgvector in Supabase Dashboard:
# Database > Extensions > Search for "vector" > Enable
```

### RLS Preventing Access

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'embeddings';

-- Temporarily disable RLS for testing (NOT FOR PRODUCTION)
ALTER TABLE embeddings DISABLE ROW LEVEL SECURITY;
```

### Slow Similarity Searches

```sql
-- Check if HNSW index is being used
EXPLAIN ANALYZE
SELECT * FROM match_embeddings(
  array_fill(0.1, ARRAY[1536])::vector,
  0.7,
  10,
  '{}'::jsonb
);

-- Should show: "Index Scan using idx_embeddings_vector"
```

### Vector Dimension Mismatch

```sql
-- If you need different dimensions (e.g., 768 for other models)
ALTER TABLE embeddings
  ADD COLUMN embedding_768 vector(768);

-- Create separate index
CREATE INDEX idx_embeddings_vector_768 ON embeddings
  USING hnsw (embedding_768 vector_cosine_ops);
```

## Maintenance

### Vacuum and Analyze

Run periodically to maintain performance:

```sql
VACUUM ANALYZE embeddings;
VACUUM ANALYZE ai_conversations;
VACUUM ANALYZE ai_usage;
```

### Monitor Table Sizes

```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('ai_conversations', 'embeddings', 'ai_usage')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Archive Old Usage Data

```sql
-- Archive usage data older than 90 days
CREATE TABLE ai_usage_archive AS
SELECT * FROM ai_usage
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM ai_usage
WHERE created_at < NOW() - INTERVAL '90 days';
```
