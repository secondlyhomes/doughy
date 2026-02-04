-- Migration: RPC Functions for CRM Skip Trace
-- Description: Replace PostgREST cross-schema joins for skip trace results

-- ============================================================================
-- crm.get_skip_trace_results
-- Skip trace results with contact, lead, and property data
-- ============================================================================
CREATE OR REPLACE FUNCTION crm.get_skip_trace_results(
  p_user_id UUID,
  p_contact_id UUID DEFAULT NULL,
  p_lead_id UUID DEFAULT NULL,
  p_property_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  -- Skip trace result columns
  id UUID,
  user_id UUID,
  contact_id UUID,
  lead_id UUID,
  property_id UUID,
  matched_property_id UUID,
  status TEXT,
  input_first_name TEXT,
  input_last_name TEXT,
  input_address TEXT,
  input_city TEXT,
  input_state TEXT,
  input_zip TEXT,
  phones JSONB,
  emails JSONB,
  addresses JSONB,
  properties_owned JSONB,
  data_points JSONB,
  match_confidence INTEGER,
  credits_used INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Flattened contact columns
  contact_first_name TEXT,
  contact_last_name TEXT,
  -- Flattened lead columns
  lead_name TEXT,
  -- Flattened property columns (source property)
  property_address TEXT,
  property_city TEXT,
  property_state TEXT,
  -- Flattened matched property columns
  matched_property_address TEXT,
  matched_property_city TEXT,
  matched_property_state TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = crm, investor, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.user_id,
    s.contact_id,
    s.lead_id,
    s.property_id,
    s.matched_property_id,
    s.status,
    s.input_first_name,
    s.input_last_name,
    s.input_address,
    s.input_city,
    s.input_state,
    s.input_zip,
    s.phones,
    s.emails,
    s.addresses,
    s.properties_owned,
    s.data_points,
    s.match_confidence,
    s.credits_used,
    s.error_message,
    s.created_at,
    s.updated_at,
    -- Contact fields
    c.first_name AS contact_first_name,
    c.last_name AS contact_last_name,
    -- Lead fields
    l.name AS lead_name,
    -- Property fields
    p.address_line_1 AS property_address,
    p.city AS property_city,
    p.state AS property_state,
    -- Matched property fields
    mp.address_line_1 AS matched_property_address,
    mp.city AS matched_property_city,
    mp.state AS matched_property_state
  FROM crm.skip_trace_results s
  LEFT JOIN crm.contacts c ON c.id = s.contact_id
  LEFT JOIN crm.leads l ON l.id = s.lead_id
  LEFT JOIN investor.properties p ON p.id = s.property_id
  LEFT JOIN investor.properties mp ON mp.id = s.matched_property_id
  WHERE s.user_id = p_user_id
    AND (p_contact_id IS NULL OR s.contact_id = p_contact_id)
    AND (p_lead_id IS NULL OR s.lead_id = p_lead_id)
    AND (p_property_id IS NULL OR s.property_id = p_property_id)
  ORDER BY s.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION crm.get_skip_trace_results IS
  'Fetches skip trace results with contact, lead, and property data.';

GRANT EXECUTE ON FUNCTION crm.get_skip_trace_results TO authenticated;


-- ============================================================================
-- crm.get_skip_trace_result_by_id
-- Single skip trace result with full relations
-- ============================================================================
CREATE OR REPLACE FUNCTION crm.get_skip_trace_result_by_id(
  p_result_id UUID
)
RETURNS TABLE (
  -- Skip trace result columns
  id UUID,
  user_id UUID,
  contact_id UUID,
  lead_id UUID,
  property_id UUID,
  matched_property_id UUID,
  status TEXT,
  input_first_name TEXT,
  input_last_name TEXT,
  input_address TEXT,
  input_city TEXT,
  input_state TEXT,
  input_zip TEXT,
  phones JSONB,
  emails JSONB,
  addresses JSONB,
  properties_owned JSONB,
  data_points JSONB,
  match_confidence INTEGER,
  credits_used INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Flattened contact columns
  contact_first_name TEXT,
  contact_last_name TEXT,
  -- Flattened lead columns
  lead_name TEXT,
  -- Flattened property columns (source property)
  property_address TEXT,
  property_city TEXT,
  property_state TEXT,
  -- Flattened matched property columns
  matched_property_address TEXT,
  matched_property_city TEXT,
  matched_property_state TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = crm, investor, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.user_id,
    s.contact_id,
    s.lead_id,
    s.property_id,
    s.matched_property_id,
    s.status,
    s.input_first_name,
    s.input_last_name,
    s.input_address,
    s.input_city,
    s.input_state,
    s.input_zip,
    s.phones,
    s.emails,
    s.addresses,
    s.properties_owned,
    s.data_points,
    s.match_confidence,
    s.credits_used,
    s.error_message,
    s.created_at,
    s.updated_at,
    -- Contact fields
    c.first_name AS contact_first_name,
    c.last_name AS contact_last_name,
    -- Lead fields
    l.name AS lead_name,
    -- Property fields
    p.address_line_1 AS property_address,
    p.city AS property_city,
    p.state AS property_state,
    -- Matched property fields
    mp.address_line_1 AS matched_property_address,
    mp.city AS matched_property_city,
    mp.state AS matched_property_state
  FROM crm.skip_trace_results s
  LEFT JOIN crm.contacts c ON c.id = s.contact_id
  LEFT JOIN crm.leads l ON l.id = s.lead_id
  LEFT JOIN investor.properties p ON p.id = s.property_id
  LEFT JOIN investor.properties mp ON mp.id = s.matched_property_id
  WHERE s.id = p_result_id;
END;
$$;

COMMENT ON FUNCTION crm.get_skip_trace_result_by_id IS
  'Fetches a single skip trace result with full relations.';

GRANT EXECUTE ON FUNCTION crm.get_skip_trace_result_by_id TO authenticated;
