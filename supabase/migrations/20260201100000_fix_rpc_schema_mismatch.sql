-- Migration: Fix RPC Schema Mismatch
-- Description: Fix RPC functions that reference non-existent columns (strategy, risk_score)
-- The deals_pipeline table has: title, status, estimated_value, probability, expected_close_date
-- but NOT: strategy, risk_score

-- ============================================================================
-- Drop existing functions with old signatures
-- ============================================================================
DROP FUNCTION IF EXISTS investor.get_deals_with_lead(UUID, TEXT, TEXT, BOOLEAN, TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS investor.get_deal_by_id(UUID);
DROP FUNCTION IF EXISTS investor.get_property_deals(UUID);

-- ============================================================================
-- investor.get_deals_with_lead (FIXED)
-- Removed: strategy parameter and column, risk_score column
-- Added: title, status, estimated_value, probability, expected_close_date, notes
-- ============================================================================
CREATE OR REPLACE FUNCTION investor.get_deals_with_lead(
  p_user_id UUID,
  p_stage TEXT DEFAULT NULL,
  p_active_only BOOLEAN DEFAULT FALSE,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_direction TEXT DEFAULT 'desc',
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  lead_id UUID,
  property_id UUID,
  stage TEXT,
  status TEXT,
  title TEXT,
  estimated_value NUMERIC,
  probability INTEGER,
  expected_close_date DATE,
  next_action TEXT,
  next_action_due TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  lead_name TEXT,
  lead_phone TEXT,
  lead_email TEXT,
  lead_status TEXT,
  lead_score NUMERIC,
  lead_tags TEXT[],
  property_address_line_1 TEXT,
  property_address_line_2 TEXT,
  property_city TEXT,
  property_state TEXT,
  property_zip TEXT,
  property_county TEXT,
  property_bedrooms NUMERIC,
  property_bathrooms NUMERIC,
  property_square_feet INTEGER,
  property_lot_size INTEGER,
  property_year_built INTEGER,
  property_type TEXT,
  property_arv NUMERIC,
  property_purchase_price NUMERIC,
  property_notes TEXT,
  property_status TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = investor, crm, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id, d.user_id, d.lead_id, d.property_id, d.stage, d.status::TEXT, d.title,
    d.estimated_value, d.probability, d.expected_close_date, d.next_action,
    d.next_action_due, d.notes, d.created_at, d.updated_at,
    l.name, l.phone, l.email, l.status::TEXT, l.score, l.tags,
    p.address_line_1, p.address_line_2, p.city, p.state, p.zip, p.county,
    p.bedrooms, p.bathrooms, p.square_feet, p.lot_size, p.year_built,
    p.property_type, p.arv, p.purchase_price, p.notes, p.status::TEXT
  FROM investor.deals_pipeline d
  LEFT JOIN crm.leads l ON l.id = d.lead_id
  LEFT JOIN investor.properties p ON p.id = d.property_id
  WHERE d.user_id = p_user_id
    AND (p_stage IS NULL OR d.stage = p_stage)
    AND (NOT p_active_only OR d.status = 'active')
  ORDER BY
    CASE WHEN p_sort_direction = 'asc' THEN
      CASE p_sort_by
        WHEN 'created_at' THEN d.created_at
        WHEN 'updated_at' THEN d.updated_at
        WHEN 'next_action_due' THEN d.next_action_due
        ELSE d.created_at
      END
    END ASC NULLS LAST,
    CASE WHEN p_sort_direction = 'desc' OR p_sort_direction IS NULL THEN
      CASE p_sort_by
        WHEN 'created_at' THEN d.created_at
        WHEN 'updated_at' THEN d.updated_at
        WHEN 'next_action_due' THEN d.next_action_due
        ELSE d.created_at
      END
    END DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION investor.get_deals_with_lead IS
  'Fetches deals with joined lead and property data. Replaces PostgREST cross-schema join.';

GRANT EXECUTE ON FUNCTION investor.get_deals_with_lead TO authenticated;


-- ============================================================================
-- investor.get_deal_by_id (FIXED)
-- ============================================================================
CREATE OR REPLACE FUNCTION investor.get_deal_by_id(p_deal_id UUID)
RETURNS TABLE (
  id UUID, user_id UUID, lead_id UUID, property_id UUID, stage TEXT, status TEXT,
  title TEXT, estimated_value NUMERIC, probability INTEGER, expected_close_date DATE,
  next_action TEXT, next_action_due TIMESTAMPTZ, notes TEXT, created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ, lead_name TEXT, lead_phone TEXT, lead_email TEXT,
  lead_status TEXT, lead_score NUMERIC, lead_tags TEXT[], property_address_line_1 TEXT,
  property_address_line_2 TEXT, property_city TEXT, property_state TEXT, property_zip TEXT,
  property_county TEXT, property_bedrooms NUMERIC, property_bathrooms NUMERIC,
  property_square_feet INTEGER, property_lot_size INTEGER, property_year_built INTEGER,
  property_type TEXT, property_arv NUMERIC, property_purchase_price NUMERIC,
  property_notes TEXT, property_status TEXT
)
LANGUAGE plpgsql SECURITY INVOKER STABLE SET search_path = investor, crm, public
AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.user_id, d.lead_id, d.property_id, d.stage, d.status::TEXT, d.title,
    d.estimated_value, d.probability, d.expected_close_date, d.next_action,
    d.next_action_due, d.notes, d.created_at, d.updated_at,
    l.name, l.phone, l.email, l.status::TEXT, l.score, l.tags,
    p.address_line_1, p.address_line_2, p.city, p.state, p.zip, p.county,
    p.bedrooms, p.bathrooms, p.square_feet, p.lot_size, p.year_built,
    p.property_type, p.arv, p.purchase_price, p.notes, p.status::TEXT
  FROM investor.deals_pipeline d
  LEFT JOIN crm.leads l ON l.id = d.lead_id
  LEFT JOIN investor.properties p ON p.id = d.property_id
  WHERE d.id = p_deal_id;
END;
$$;

COMMENT ON FUNCTION investor.get_deal_by_id IS
  'Fetches a single deal with full lead and property data.';

GRANT EXECUTE ON FUNCTION investor.get_deal_by_id TO authenticated;


-- ============================================================================
-- investor.get_property_deals (FIXED)
-- ============================================================================
CREATE OR REPLACE FUNCTION investor.get_property_deals(p_property_id UUID)
RETURNS TABLE (
  id UUID, user_id UUID, lead_id UUID, property_id UUID, stage TEXT, status TEXT,
  title TEXT, next_action TEXT, next_action_due TIMESTAMPTZ, created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ, lead_name TEXT, lead_phone TEXT, lead_email TEXT
)
LANGUAGE plpgsql SECURITY INVOKER STABLE SET search_path = investor, crm, public
AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.user_id, d.lead_id, d.property_id, d.stage, d.status::TEXT, d.title,
    d.next_action, d.next_action_due, d.created_at, d.updated_at,
    l.name, l.phone, l.email
  FROM investor.deals_pipeline d
  LEFT JOIN crm.leads l ON l.id = d.lead_id
  WHERE d.property_id = p_property_id
  ORDER BY d.created_at DESC;
END;
$$;

COMMENT ON FUNCTION investor.get_property_deals IS
  'Fetches all deals for a specific property with lead data.';

GRANT EXECUTE ON FUNCTION investor.get_property_deals TO authenticated;
