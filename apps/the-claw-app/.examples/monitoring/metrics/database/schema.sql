/**
 * App Metrics Database Schema
 *
 * Database schema for storing performance metrics, analytics events,
 * and custom application metrics.
 *
 * Usage:
 * 1. Run this in Supabase SQL Editor
 * 2. Enable Row Level Security (RLS)
 * 3. Grant appropriate permissions
 */

-- ============================================================================
-- App Metrics Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metric details
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT DEFAULT 'ms',

  -- Contextual data
  tags JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for performance
  CONSTRAINT valid_metric_value CHECK (metric_value >= 0)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_app_metrics_name
  ON app_metrics(metric_name);

CREATE INDEX IF NOT EXISTS idx_app_metrics_created_at
  ON app_metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_metrics_user_id
  ON app_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_app_metrics_name_created_at
  ON app_metrics(metric_name, created_at DESC);

-- GIN index for JSONB tag queries
CREATE INDEX IF NOT EXISTS idx_app_metrics_tags
  ON app_metrics USING GIN (tags);

-- Composite index for common filtered queries
CREATE INDEX IF NOT EXISTS idx_app_metrics_name_tags_created_at
  ON app_metrics(metric_name, created_at DESC)
  WHERE tags IS NOT NULL;

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE app_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own metrics
CREATE POLICY "Users can insert their own metrics"
  ON app_metrics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can view their own metrics
CREATE POLICY "Users can view their own metrics"
  ON app_metrics
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Admins can view all metrics (optional)
CREATE POLICY "Admins can view all metrics"
  ON app_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- Performance Metrics View
-- ============================================================================

CREATE OR REPLACE VIEW performance_metrics_summary AS
SELECT
  metric_name,
  COUNT(*) as sample_count,
  ROUND(AVG(metric_value)::numeric, 2) as avg_value,
  ROUND(MIN(metric_value)::numeric, 2) as min_value,
  ROUND(MAX(metric_value)::numeric, 2) as max_value,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY metric_value) as p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) as p95,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY metric_value) as p99,
  metric_unit,
  DATE_TRUNC('day', created_at) as date
FROM app_metrics
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY metric_name, metric_unit, DATE_TRUNC('day', created_at)
ORDER BY date DESC, metric_name;

-- ============================================================================
-- Screen Load Metrics View
-- ============================================================================

CREATE OR REPLACE VIEW screen_load_metrics AS
SELECT
  tags->>'screen' as screen_name,
  COUNT(*) as load_count,
  ROUND(AVG(metric_value)::numeric, 2) as avg_load_time,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY metric_value) as p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) as p95,
  DATE_TRUNC('hour', created_at) as hour
FROM app_metrics
WHERE metric_name = 'screen_load'
  AND created_at > NOW() - INTERVAL '24 hours'
  AND tags->>'screen' IS NOT NULL
GROUP BY tags->>'screen', DATE_TRUNC('hour', created_at)
ORDER BY hour DESC, avg_load_time DESC;

-- ============================================================================
-- API Performance View
-- ============================================================================

CREATE OR REPLACE VIEW api_performance_metrics AS
SELECT
  tags->>'endpoint' as endpoint,
  tags->>'method' as method,
  COUNT(*) as request_count,
  ROUND(AVG(metric_value)::numeric, 2) as avg_latency,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY metric_value) as p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) as p95,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY metric_value) as p99,
  COUNT(*) FILTER (WHERE tags->>'success' = 'true') as success_count,
  COUNT(*) FILTER (WHERE tags->>'success' = 'false') as error_count,
  DATE_TRUNC('hour', created_at) as hour
FROM app_metrics
WHERE metric_name LIKE 'api_%'
  AND created_at > NOW() - INTERVAL '24 hours'
  AND tags->>'endpoint' IS NOT NULL
GROUP BY tags->>'endpoint', tags->>'method', DATE_TRUNC('hour', created_at)
ORDER BY hour DESC, avg_latency DESC;

-- ============================================================================
-- User Performance Metrics View
-- ============================================================================

CREATE OR REPLACE VIEW user_performance_metrics AS
SELECT
  user_id,
  tags->>'platform' as platform,
  COUNT(*) as metric_count,
  AVG(CASE WHEN metric_name = 'fps' THEN metric_value END) as avg_fps,
  AVG(CASE WHEN metric_name = 'memory_usage' THEN metric_value END) as avg_memory_mb,
  AVG(CASE WHEN metric_name = 'screen_load' THEN metric_value END) as avg_screen_load_ms,
  DATE_TRUNC('day', created_at) as date
FROM app_metrics
WHERE created_at > NOW() - INTERVAL '7 days'
  AND user_id IS NOT NULL
GROUP BY user_id, tags->>'platform', DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- ============================================================================
-- Slow Operations View
-- ============================================================================

CREATE OR REPLACE VIEW slow_operations AS
SELECT
  metric_name,
  metric_value as duration_ms,
  tags,
  metadata,
  created_at,
  user_id
FROM app_metrics
WHERE metric_value > 2000  -- Slower than 2 seconds
  AND metric_unit = 'ms'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY metric_value DESC
LIMIT 100;

-- ============================================================================
-- Helper Functions
-- ============================================================================

/**
 * Get metric statistics for a given time period
 *
 * Usage:
 * SELECT * FROM get_metric_stats('screen_load', '24 hours');
 */
CREATE OR REPLACE FUNCTION get_metric_stats(
  p_metric_name TEXT,
  p_interval INTERVAL DEFAULT '24 hours'
)
RETURNS TABLE (
  metric_name TEXT,
  sample_count BIGINT,
  avg_value NUMERIC,
  min_value NUMERIC,
  max_value NUMERIC,
  p50 NUMERIC,
  p95 NUMERIC,
  p99 NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_metric_name,
    COUNT(*),
    ROUND(AVG(m.metric_value)::numeric, 2),
    ROUND(MIN(m.metric_value)::numeric, 2),
    ROUND(MAX(m.metric_value)::numeric, 2),
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY m.metric_value),
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY m.metric_value),
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY m.metric_value)
  FROM app_metrics m
  WHERE m.metric_name = p_metric_name
    AND m.created_at > NOW() - p_interval;
END;
$$ LANGUAGE plpgsql;

/**
 * Get top N slowest operations
 *
 * Usage:
 * SELECT * FROM get_slowest_operations('screen_load', 10);
 */
CREATE OR REPLACE FUNCTION get_slowest_operations(
  p_metric_name TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  metric_value NUMERIC,
  tags JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.metric_value,
    m.tags,
    m.metadata,
    m.created_at
  FROM app_metrics m
  WHERE m.metric_name = p_metric_name
  ORDER BY m.metric_value DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

/**
 * Clean up old metrics (run periodically)
 *
 * Usage:
 * SELECT cleanup_old_metrics(90); -- Delete metrics older than 90 days
 */
CREATE OR REPLACE FUNCTION cleanup_old_metrics(
  p_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM app_metrics
  WHERE created_at < NOW() - (p_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Automated Cleanup Job (Optional)
-- ============================================================================

/**
 * Create a cron job to automatically clean up old metrics
 * Requires pg_cron extension
 *
 * Uncomment below to enable:
 */

-- -- Install pg_cron (run once as superuser)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- -- Schedule cleanup job (runs daily at 3 AM)
-- SELECT cron.schedule(
--   'cleanup-old-metrics',
--   '0 3 * * *',
--   $$ SELECT cleanup_old_metrics(90); $$
-- );

-- ============================================================================
-- Sample Queries
-- ============================================================================

/**
 * Example queries to analyze metrics
 */

-- Get average screen load time by screen
-- SELECT
--   tags->>'screen' as screen_name,
--   ROUND(AVG(metric_value)::numeric, 2) as avg_load_time,
--   COUNT(*) as sample_count
-- FROM app_metrics
-- WHERE metric_name = 'screen_load'
--   AND created_at > NOW() - INTERVAL '7 days'
-- GROUP BY tags->>'screen'
-- ORDER BY avg_load_time DESC;

-- Get FPS over time
-- SELECT
--   DATE_TRUNC('hour', created_at) as hour,
--   ROUND(AVG(metric_value)::numeric, 2) as avg_fps,
--   ROUND(MIN(metric_value)::numeric, 2) as min_fps
-- FROM app_metrics
-- WHERE metric_name = 'fps'
--   AND created_at > NOW() - INTERVAL '24 hours'
-- GROUP BY hour
-- ORDER BY hour DESC;

-- Get slowest API endpoints
-- SELECT
--   tags->>'endpoint' as endpoint,
--   ROUND(AVG(metric_value)::numeric, 2) as avg_latency,
--   PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) as p95,
--   COUNT(*) as request_count
-- FROM app_metrics
-- WHERE metric_name LIKE 'api_%'
--   AND created_at > NOW() - INTERVAL '24 hours'
-- GROUP BY tags->>'endpoint'
-- ORDER BY avg_latency DESC;

-- Get platform comparison
-- SELECT
--   tags->>'platform' as platform,
--   AVG(CASE WHEN metric_name = 'screen_load' THEN metric_value END) as avg_screen_load,
--   AVG(CASE WHEN metric_name = 'fps' THEN metric_value END) as avg_fps,
--   COUNT(DISTINCT user_id) as user_count
-- FROM app_metrics
-- WHERE created_at > NOW() - INTERVAL '7 days'
-- GROUP BY tags->>'platform';

-- ============================================================================
-- Grants
-- ============================================================================

-- Grant permissions (adjust as needed)
GRANT SELECT ON performance_metrics_summary TO authenticated;
GRANT SELECT ON screen_load_metrics TO authenticated;
GRANT SELECT ON api_performance_metrics TO authenticated;
GRANT SELECT ON user_performance_metrics TO authenticated;
GRANT SELECT ON slow_operations TO authenticated;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE app_metrics IS 'Stores application performance and custom metrics';
COMMENT ON COLUMN app_metrics.metric_name IS 'Name of the metric (e.g., screen_load, fps, api_latency)';
COMMENT ON COLUMN app_metrics.metric_value IS 'Numeric value of the metric';
COMMENT ON COLUMN app_metrics.metric_unit IS 'Unit of measurement (e.g., ms, MB, fps)';
COMMENT ON COLUMN app_metrics.tags IS 'Contextual tags for filtering and grouping';
COMMENT ON COLUMN app_metrics.metadata IS 'Additional metadata for the metric';

COMMENT ON VIEW performance_metrics_summary IS 'Aggregated performance metrics with percentiles';
COMMENT ON VIEW screen_load_metrics IS 'Screen load time metrics grouped by screen';
COMMENT ON VIEW api_performance_metrics IS 'API performance metrics grouped by endpoint';
COMMENT ON VIEW user_performance_metrics IS 'Per-user performance metrics';
COMMENT ON VIEW slow_operations IS 'Operations that exceeded performance thresholds';

COMMENT ON FUNCTION get_metric_stats IS 'Get statistical summary for a specific metric';
COMMENT ON FUNCTION get_slowest_operations IS 'Get the slowest operations for a metric';
COMMENT ON FUNCTION cleanup_old_metrics IS 'Delete metrics older than specified days';
