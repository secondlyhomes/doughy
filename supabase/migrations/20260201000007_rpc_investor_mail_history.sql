-- Migration: RPC Functions for Investor Mail History
-- Description: Replace PostgREST cross-schema joins for mail history

-- ============================================================================
-- investor.get_mail_history
-- Mail touch logs with enrollment and contact data
-- ============================================================================
CREATE OR REPLACE FUNCTION investor.get_mail_history(
  p_user_id UUID,
  p_status TEXT DEFAULT NULL,
  p_mail_piece_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  -- Touch log columns
  id UUID,
  user_id UUID,
  enrollment_id UUID,
  step_id UUID,
  channel TEXT,
  status TEXT,
  executed_at TIMESTAMPTZ,
  response_at TIMESTAMPTZ,
  error_message TEXT,
  mail_piece_type TEXT,
  mail_cost NUMERIC,
  mail_tracking_id TEXT,
  mail_carrier TEXT,
  mail_expected_delivery DATE,
  postgrid_letter_id TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Flattened contact columns (via enrollment)
  contact_id UUID,
  contact_first_name TEXT,
  contact_last_name TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = investor, crm, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.user_id,
    t.enrollment_id,
    t.step_id,
    t.channel,
    t.status,
    t.executed_at,
    t.response_at,
    t.error_message,
    t.mail_piece_type,
    t.mail_cost,
    t.mail_tracking_id,
    t.mail_carrier,
    t.mail_expected_delivery,
    t.postgrid_letter_id,
    t.created_at,
    t.updated_at,
    -- Contact fields
    e.contact_id AS contact_id,
    c.first_name AS contact_first_name,
    c.last_name AS contact_last_name
  FROM investor.drip_touch_logs t
  LEFT JOIN investor.drip_enrollments e ON e.id = t.enrollment_id
  LEFT JOIN crm.contacts c ON c.id = e.contact_id
  WHERE t.user_id = p_user_id
    AND t.channel = 'direct_mail'
    AND (p_status IS NULL OR t.status = p_status)
    AND (p_mail_piece_type IS NULL OR t.mail_piece_type = p_mail_piece_type)
  ORDER BY t.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION investor.get_mail_history IS
  'Fetches mail history with enrollment and contact data.';

GRANT EXECUTE ON FUNCTION investor.get_mail_history TO authenticated;


-- ============================================================================
-- investor.get_mail_history_stats
-- Aggregate stats for mail history
-- ============================================================================
CREATE OR REPLACE FUNCTION investor.get_mail_history_stats(
  p_user_id UUID
)
RETURNS TABLE (
  total_sent BIGINT,
  total_delivered BIGINT,
  total_failed BIGINT,
  total_pending BIGINT,
  total_cost NUMERIC
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = investor, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'sent') AS total_sent,
    COUNT(*) FILTER (WHERE status = 'delivered') AS total_delivered,
    COUNT(*) FILTER (WHERE status IN ('failed', 'bounced')) AS total_failed,
    COUNT(*) FILTER (WHERE status IN ('pending', 'sending')) AS total_pending,
    COALESCE(SUM(mail_cost), 0) AS total_cost
  FROM investor.drip_touch_logs
  WHERE user_id = p_user_id
    AND channel = 'direct_mail';
END;
$$;

COMMENT ON FUNCTION investor.get_mail_history_stats IS
  'Returns aggregate stats for direct mail history.';

GRANT EXECUTE ON FUNCTION investor.get_mail_history_stats TO authenticated;
