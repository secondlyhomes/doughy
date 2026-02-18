-- Migration: RPC Functions for VoIP / Calls
-- Description: Replace PostgREST cross-schema joins for calls with contacts

-- ============================================================================
-- public.get_recent_calls
-- Recent calls with contact data
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_recent_calls(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  -- Call columns
  id UUID,
  user_id UUID,
  contact_id UUID,
  phone_number TEXT,
  direction TEXT,
  status TEXT,
  twilio_call_sid TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  recording_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Flattened contact columns
  contact_first_name TEXT,
  contact_last_name TEXT,
  contact_phone TEXT,
  contact_email TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = public, crm
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.user_id,
    c.contact_id,
    c.phone_number,
    c.direction,
    c.status,
    c.twilio_call_sid,
    c.started_at,
    c.ended_at,
    c.duration_seconds,
    c.recording_url,
    c.created_at,
    c.updated_at,
    -- Contact fields
    ct.first_name AS contact_first_name,
    ct.last_name AS contact_last_name,
    ct.phone AS contact_phone,
    ct.email AS contact_email
  FROM public.calls c
  LEFT JOIN crm.contacts ct ON ct.id = c.contact_id
  WHERE c.user_id = p_user_id
  ORDER BY c.created_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_recent_calls IS
  'Fetches recent calls with contact data.';

GRANT EXECUTE ON FUNCTION public.get_recent_calls TO authenticated;
