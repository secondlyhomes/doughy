-- Migration: RPC Functions for Investor Conversations
-- Description: Replace PostgREST cross-schema joins for investor conversations

-- ============================================================================
-- investor.get_conversations_with_lead
-- Conversations with lead, property, and deal data
-- ============================================================================
CREATE OR REPLACE FUNCTION investor.get_conversations_with_lead(
  p_user_id UUID,
  p_conversation_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  -- Conversation columns
  id UUID,
  user_id UUID,
  lead_id UUID,
  property_id UUID,
  channel TEXT,
  status TEXT,
  is_ai_enabled BOOLEAN,
  is_ai_auto_respond BOOLEAN,
  unread_count INTEGER,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Flattened lead columns
  lead_name TEXT,
  lead_phone TEXT,
  lead_email TEXT,
  lead_status TEXT,
  lead_opt_status TEXT,
  lead_tags TEXT[],
  -- Flattened property columns
  property_address_line_1 TEXT,
  property_city TEXT,
  property_state TEXT,
  -- Flattened deal columns
  deal_id UUID,
  deal_title TEXT,
  deal_status TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = investor, crm, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.user_id,
    c.lead_id,
    c.property_id,
    c.channel,
    c.status,
    c.is_ai_enabled,
    c.is_ai_auto_respond,
    c.unread_count,
    c.last_message_at,
    c.created_at,
    c.updated_at,
    -- Lead fields
    l.name AS lead_name,
    l.phone AS lead_phone,
    l.email AS lead_email,
    l.status AS lead_status,
    l.opt_status AS lead_opt_status,
    l.tags AS lead_tags,
    -- Property fields
    p.address_line_1 AS property_address_line_1,
    p.city AS property_city,
    p.state AS property_state,
    -- Deal fields (first deal associated with lead)
    d.id AS deal_id,
    d.title AS deal_title,
    d.status AS deal_status
  FROM investor.conversations c
  LEFT JOIN crm.leads l ON l.id = c.lead_id
  LEFT JOIN investor.properties p ON p.id = c.property_id
  LEFT JOIN LATERAL (
    SELECT dp.id, dp.title, dp.status
    FROM investor.deals_pipeline dp
    WHERE dp.lead_id = c.lead_id
    ORDER BY dp.created_at DESC
    LIMIT 1
  ) d ON TRUE
  WHERE c.user_id = p_user_id
    AND (p_conversation_ids IS NULL OR c.id = ANY(p_conversation_ids))
  ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$;

COMMENT ON FUNCTION investor.get_conversations_with_lead IS
  'Fetches investor conversations with joined lead, property, and deal data.';

GRANT EXECUTE ON FUNCTION investor.get_conversations_with_lead TO authenticated;


-- ============================================================================
-- investor.get_investor_conversation_by_id
-- Single conversation with full relations
-- ============================================================================
CREATE OR REPLACE FUNCTION investor.get_investor_conversation_by_id(
  p_conversation_id UUID
)
RETURNS TABLE (
  -- Conversation columns
  id UUID,
  user_id UUID,
  lead_id UUID,
  property_id UUID,
  channel TEXT,
  status TEXT,
  is_ai_enabled BOOLEAN,
  is_ai_auto_respond BOOLEAN,
  unread_count INTEGER,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Flattened lead columns
  lead_name TEXT,
  lead_phone TEXT,
  lead_email TEXT,
  lead_status TEXT,
  lead_opt_status TEXT,
  lead_tags TEXT[],
  -- Flattened property columns
  property_address_line_1 TEXT,
  property_city TEXT,
  property_state TEXT,
  -- Flattened deal columns
  deal_id UUID,
  deal_title TEXT,
  deal_status TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = investor, crm, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.user_id,
    c.lead_id,
    c.property_id,
    c.channel,
    c.status,
    c.is_ai_enabled,
    c.is_ai_auto_respond,
    c.unread_count,
    c.last_message_at,
    c.created_at,
    c.updated_at,
    -- Lead fields
    l.name AS lead_name,
    l.phone AS lead_phone,
    l.email AS lead_email,
    l.status AS lead_status,
    l.opt_status AS lead_opt_status,
    l.tags AS lead_tags,
    -- Property fields
    p.address_line_1 AS property_address_line_1,
    p.city AS property_city,
    p.state AS property_state,
    -- Deal fields
    d.id AS deal_id,
    d.title AS deal_title,
    d.status AS deal_status
  FROM investor.conversations c
  LEFT JOIN crm.leads l ON l.id = c.lead_id
  LEFT JOIN investor.properties p ON p.id = c.property_id
  LEFT JOIN LATERAL (
    SELECT dp.id, dp.title, dp.status
    FROM investor.deals_pipeline dp
    WHERE dp.lead_id = c.lead_id
    ORDER BY dp.created_at DESC
    LIMIT 1
  ) d ON TRUE
  WHERE c.id = p_conversation_id;
END;
$$;

COMMENT ON FUNCTION investor.get_investor_conversation_by_id IS
  'Fetches a single investor conversation with full relations.';

GRANT EXECUTE ON FUNCTION investor.get_investor_conversation_by_id TO authenticated;
