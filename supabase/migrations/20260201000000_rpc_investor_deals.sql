-- Migration: RPC Functions for Investor Deals
-- Description: Replace PostgREST cross-schema joins with proper RPC functions
-- This migration creates 3 RPC functions for deal-related queries

-- ============================================================================
-- investor.get_deals_with_lead
-- Main deals list with lead and property data
-- ============================================================================
CREATE OR REPLACE FUNCTION investor.get_deals_with_lead(
  p_user_id UUID,
  p_stage TEXT DEFAULT NULL,
  p_strategy TEXT DEFAULT NULL,
  p_active_only BOOLEAN DEFAULT FALSE,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_direction TEXT DEFAULT 'desc',
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  -- Deal columns
  id UUID,
  user_id UUID,
  lead_id UUID,
  property_id UUID,
  stage TEXT,
  strategy TEXT,
  next_action TEXT,
  next_action_due TIMESTAMPTZ,
  risk_score INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Flattened lead columns
  lead_name TEXT,
  lead_phone TEXT,
  lead_email TEXT,
  lead_status TEXT,
  lead_score INTEGER,
  lead_tags TEXT[],
  -- Flattened property columns
  property_address_line_1 TEXT,
  property_address_line_2 TEXT,
  property_city TEXT,
  property_state TEXT,
  property_zip TEXT,
  property_county TEXT,
  property_bedrooms INTEGER,
  property_bathrooms NUMERIC,
  property_square_feet INTEGER,
  property_lot_size NUMERIC,
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
    d.id,
    d.user_id,
    d.lead_id,
    d.property_id,
    d.stage,
    d.strategy,
    d.next_action,
    d.next_action_due,
    d.risk_score,
    d.created_at,
    d.updated_at,
    -- Lead fields
    l.name AS lead_name,
    l.phone AS lead_phone,
    l.email AS lead_email,
    l.status AS lead_status,
    l.score AS lead_score,
    l.tags AS lead_tags,
    -- Property fields
    p.address_line_1 AS property_address_line_1,
    p.address_line_2 AS property_address_line_2,
    p.city AS property_city,
    p.state AS property_state,
    p.zip AS property_zip,
    p.county AS property_county,
    p.bedrooms AS property_bedrooms,
    p.bathrooms AS property_bathrooms,
    p.square_feet AS property_square_feet,
    p.lot_size AS property_lot_size,
    p.year_built AS property_year_built,
    p.property_type AS property_type,
    p.arv AS property_arv,
    p.purchase_price AS property_purchase_price,
    p.notes AS property_notes,
    p.status AS property_status
  FROM investor.deals_pipeline d
  LEFT JOIN crm.leads l ON l.id = d.lead_id
  LEFT JOIN investor.properties p ON p.id = d.property_id
  WHERE d.user_id = p_user_id
    AND (p_stage IS NULL OR d.stage = p_stage)
    AND (p_strategy IS NULL OR d.strategy = p_strategy)
    AND (NOT p_active_only OR d.stage NOT IN ('closed_won', 'closed_lost'))
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
-- investor.get_deal_by_id
-- Single deal fetch with full lead and property data
-- ============================================================================
CREATE OR REPLACE FUNCTION investor.get_deal_by_id(
  p_deal_id UUID
)
RETURNS TABLE (
  -- Deal columns
  id UUID,
  user_id UUID,
  lead_id UUID,
  property_id UUID,
  stage TEXT,
  strategy TEXT,
  next_action TEXT,
  next_action_due TIMESTAMPTZ,
  risk_score INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Flattened lead columns
  lead_name TEXT,
  lead_phone TEXT,
  lead_email TEXT,
  lead_status TEXT,
  lead_score INTEGER,
  lead_tags TEXT[],
  -- Flattened property columns (full)
  property_address_line_1 TEXT,
  property_address_line_2 TEXT,
  property_city TEXT,
  property_state TEXT,
  property_zip TEXT,
  property_county TEXT,
  property_bedrooms INTEGER,
  property_bathrooms NUMERIC,
  property_square_feet INTEGER,
  property_lot_size NUMERIC,
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
    d.id,
    d.user_id,
    d.lead_id,
    d.property_id,
    d.stage,
    d.strategy,
    d.next_action,
    d.next_action_due,
    d.risk_score,
    d.created_at,
    d.updated_at,
    -- Lead fields
    l.name AS lead_name,
    l.phone AS lead_phone,
    l.email AS lead_email,
    l.status AS lead_status,
    l.score AS lead_score,
    l.tags AS lead_tags,
    -- Property fields (full)
    p.address_line_1 AS property_address_line_1,
    p.address_line_2 AS property_address_line_2,
    p.city AS property_city,
    p.state AS property_state,
    p.zip AS property_zip,
    p.county AS property_county,
    p.bedrooms AS property_bedrooms,
    p.bathrooms AS property_bathrooms,
    p.square_feet AS property_square_feet,
    p.lot_size AS property_lot_size,
    p.year_built AS property_year_built,
    p.property_type AS property_type,
    p.arv AS property_arv,
    p.purchase_price AS property_purchase_price,
    p.notes AS property_notes,
    p.status AS property_status
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
-- investor.get_property_deals
-- Deals by property with lead data
-- ============================================================================
CREATE OR REPLACE FUNCTION investor.get_property_deals(
  p_property_id UUID
)
RETURNS TABLE (
  -- Deal columns
  id UUID,
  user_id UUID,
  lead_id UUID,
  property_id UUID,
  stage TEXT,
  strategy TEXT,
  next_action TEXT,
  next_action_due TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Flattened lead columns
  lead_name TEXT,
  lead_phone TEXT,
  lead_email TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = investor, crm, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.user_id,
    d.lead_id,
    d.property_id,
    d.stage,
    d.strategy,
    d.next_action,
    d.next_action_due,
    d.created_at,
    d.updated_at,
    -- Lead fields
    l.name AS lead_name,
    l.phone AS lead_phone,
    l.email AS lead_email
  FROM investor.deals_pipeline d
  LEFT JOIN crm.leads l ON l.id = d.lead_id
  WHERE d.property_id = p_property_id
  ORDER BY d.created_at DESC;
END;
$$;

COMMENT ON FUNCTION investor.get_property_deals IS
  'Fetches all deals for a specific property with lead data.';

GRANT EXECUTE ON FUNCTION investor.get_property_deals TO authenticated;


-- ============================================================================
-- investor.get_nudge_deals
-- Active deals for nudge calculations (stalled deals, overdue actions)
-- ============================================================================
CREATE OR REPLACE FUNCTION investor.get_nudge_deals(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  stage TEXT,
  next_action TEXT,
  next_action_due TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Lead fields
  lead_id UUID,
  lead_name TEXT,
  -- Property fields
  property_id UUID,
  property_address_line_1 TEXT,
  property_city TEXT,
  property_state TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = investor, crm, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.stage,
    d.next_action,
    d.next_action_due,
    d.updated_at,
    -- Lead fields
    d.lead_id,
    l.name AS lead_name,
    -- Property fields
    d.property_id,
    p.address_line_1 AS property_address_line_1,
    p.city AS property_city,
    p.state AS property_state
  FROM investor.deals_pipeline d
  LEFT JOIN crm.leads l ON l.id = d.lead_id
  LEFT JOIN investor.properties p ON p.id = d.property_id
  WHERE d.user_id = p_user_id
    AND d.stage NOT IN ('closed_won', 'closed_lost')
  ORDER BY d.created_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION investor.get_nudge_deals IS
  'Fetches active deals for nudge calculations.';

GRANT EXECUTE ON FUNCTION investor.get_nudge_deals TO authenticated;


-- ============================================================================
-- investor.get_properties_with_lead
-- Properties with lead data and primary image
-- ============================================================================
CREATE OR REPLACE FUNCTION investor.get_properties_with_lead(
  p_property_ids UUID[]
)
RETURNS TABLE (
  id UUID,
  address_line_1 TEXT,
  city TEXT,
  state TEXT,
  lead_id UUID,
  lead_name TEXT,
  primary_image_url TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = investor, crm, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.address_line_1,
    p.city,
    p.state,
    p.lead_id,
    l.name AS lead_name,
    (
      SELECT pi.url
      FROM investor.property_images pi
      WHERE pi.property_id = p.id
      ORDER BY pi.is_primary DESC, pi.created_at ASC
      LIMIT 1
    ) AS primary_image_url
  FROM investor.properties p
  LEFT JOIN crm.leads l ON l.id = p.lead_id
  WHERE p.id = ANY(p_property_ids);
END;
$$;

COMMENT ON FUNCTION investor.get_properties_with_lead IS
  'Fetches properties by IDs with lead and primary image data.';

GRANT EXECUTE ON FUNCTION investor.get_properties_with_lead TO authenticated;
