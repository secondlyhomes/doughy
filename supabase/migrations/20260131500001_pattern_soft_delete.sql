-- Migration: Pattern Soft-Delete
-- Description: Adds soft-delete columns to ai_moltbot_blocked_patterns for audit trail preservation
-- Phase: AI Security Hardening
-- DBA Guidelines: Following docs/DATABASE_NAMING_CONVENTIONS.md

-- ============================================================================
-- 1. ADD SOFT-DELETE COLUMNS
-- ============================================================================

ALTER TABLE ai_moltbot_blocked_patterns
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for querying deleted patterns (idx_{table}_{column} pattern)
CREATE INDEX IF NOT EXISTS idx_ai_moltbot_blocked_patterns_deleted_at
  ON ai_moltbot_blocked_patterns(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- ============================================================================
-- 2. UPDATE RLS POLICIES
-- ============================================================================
-- Update existing policies to filter out soft-deleted patterns by default

-- Drop existing SELECT policy if it exists and recreate
DROP POLICY IF EXISTS "Admins can view all blocked patterns" ON ai_moltbot_blocked_patterns;

-- Admins can view active (non-deleted) patterns
CREATE POLICY "Admins can view active blocked_patterns"
  ON ai_moltbot_blocked_patterns FOR SELECT
  USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );

-- Add policy for viewing deleted patterns (for audit/restore purposes)
CREATE POLICY "Admins can view deleted blocked_patterns"
  ON ai_moltbot_blocked_patterns FOR SELECT
  USING (
    deleted_at IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update service role policy to allow soft-delete operations
DROP POLICY IF EXISTS "Service role can manage blocked patterns" ON ai_moltbot_blocked_patterns;

CREATE POLICY "Service role can manage blocked_patterns"
  ON ai_moltbot_blocked_patterns FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 3. HELPER FUNCTIONS FOR SOFT-DELETE
-- ============================================================================

-- Function to soft-delete a pattern
CREATE OR REPLACE FUNCTION soft_delete_pattern(
  p_pattern_id UUID,
  p_deleted_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE ai_moltbot_blocked_patterns
  SET
    deleted_at = NOW(),
    deleted_by = COALESCE(p_deleted_by, auth.uid()),
    is_active = false
  WHERE id = p_pattern_id
    AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$;

-- Function to restore a soft-deleted pattern
CREATE OR REPLACE FUNCTION restore_pattern(
  p_pattern_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE ai_moltbot_blocked_patterns
  SET
    deleted_at = NULL,
    deleted_by = NULL,
    is_active = true
  WHERE id = p_pattern_id
    AND deleted_at IS NOT NULL;

  RETURN FOUND;
END;
$$;

-- Function to get all patterns including soft-deleted (for admin view)
CREATE OR REPLACE FUNCTION get_all_patterns_including_deleted()
RETURNS TABLE(
  id UUID,
  pattern TEXT,
  pattern_type TEXT,
  severity moltbot_security_severity,
  description TEXT,
  is_active BOOLEAN,
  hit_count INTEGER,
  last_hit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  is_deleted BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can call this function
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    bp.id,
    bp.pattern,
    bp.pattern_type,
    bp.severity,
    bp.description,
    bp.is_active,
    bp.hit_count,
    bp.last_hit_at,
    bp.created_at,
    bp.deleted_at,
    bp.deleted_by,
    (bp.deleted_at IS NOT NULL) AS is_deleted
  FROM ai_moltbot_blocked_patterns bp
  ORDER BY bp.deleted_at NULLS FIRST, bp.created_at DESC;
END;
$$;

-- ============================================================================
-- 4. TABLE COMMENTS
-- ============================================================================

COMMENT ON COLUMN ai_moltbot_blocked_patterns.deleted_at IS 'Soft-delete timestamp; NULL means active pattern';
COMMENT ON COLUMN ai_moltbot_blocked_patterns.deleted_by IS 'User who soft-deleted this pattern';

COMMENT ON FUNCTION soft_delete_pattern IS 'Soft-deletes a pattern instead of hard-deleting to preserve audit trail';
COMMENT ON FUNCTION restore_pattern IS 'Restores a soft-deleted pattern';
COMMENT ON FUNCTION get_all_patterns_including_deleted IS 'Returns all patterns including soft-deleted ones for admin audit view';
