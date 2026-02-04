-- Migration: RPC Functions for Landlord Conversations
-- Description: Replace PostgREST cross-schema joins for landlord conversations

-- ============================================================================
-- landlord.get_conversations_with_contact
-- Conversations with contact and property data
-- ============================================================================
CREATE OR REPLACE FUNCTION landlord.get_conversations_with_contact(
  p_user_id UUID,
  p_conversation_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  -- Conversation columns
  id UUID,
  user_id UUID,
  contact_id UUID,
  property_id UUID,
  channel TEXT,
  platform TEXT,
  status TEXT,
  is_ai_enabled BOOLEAN,
  unread_count INTEGER,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Flattened contact columns
  contact_first_name TEXT,
  contact_last_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_types TEXT[],
  -- Flattened property columns
  property_name TEXT,
  property_address TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = landlord, crm, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.user_id,
    c.contact_id,
    c.property_id,
    c.channel,
    c.platform,
    c.status,
    c.is_ai_enabled,
    c.unread_count,
    c.last_message_at,
    c.created_at,
    c.updated_at,
    -- Contact fields
    ct.first_name AS contact_first_name,
    ct.last_name AS contact_last_name,
    ct.email AS contact_email,
    ct.phone AS contact_phone,
    ct.contact_types AS contact_types,
    -- Property fields
    p.name AS property_name,
    p.address AS property_address
  FROM landlord.conversations c
  LEFT JOIN crm.contacts ct ON ct.id = c.contact_id
  LEFT JOIN landlord.properties p ON p.id = c.property_id
  WHERE c.user_id = p_user_id
    AND (p_conversation_ids IS NULL OR c.id = ANY(p_conversation_ids))
  ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$;

COMMENT ON FUNCTION landlord.get_conversations_with_contact IS
  'Fetches landlord conversations with joined contact and property data.';

GRANT EXECUTE ON FUNCTION landlord.get_conversations_with_contact TO authenticated;


-- ============================================================================
-- landlord.get_landlord_conversation_by_id
-- Single conversation with full relations
-- ============================================================================
CREATE OR REPLACE FUNCTION landlord.get_landlord_conversation_by_id(
  p_conversation_id UUID
)
RETURNS TABLE (
  -- Conversation columns
  id UUID,
  user_id UUID,
  contact_id UUID,
  property_id UUID,
  channel TEXT,
  platform TEXT,
  status TEXT,
  is_ai_enabled BOOLEAN,
  unread_count INTEGER,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Flattened contact columns
  contact_first_name TEXT,
  contact_last_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_types TEXT[],
  -- Flattened property columns
  property_name TEXT,
  property_address TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = landlord, crm, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.user_id,
    c.contact_id,
    c.property_id,
    c.channel,
    c.platform,
    c.status,
    c.is_ai_enabled,
    c.unread_count,
    c.last_message_at,
    c.created_at,
    c.updated_at,
    -- Contact fields
    ct.first_name AS contact_first_name,
    ct.last_name AS contact_last_name,
    ct.email AS contact_email,
    ct.phone AS contact_phone,
    ct.contact_types AS contact_types,
    -- Property fields
    p.name AS property_name,
    p.address AS property_address
  FROM landlord.conversations c
  LEFT JOIN crm.contacts ct ON ct.id = c.contact_id
  LEFT JOIN landlord.properties p ON p.id = c.property_id
  WHERE c.id = p_conversation_id;
END;
$$;

COMMENT ON FUNCTION landlord.get_landlord_conversation_by_id IS
  'Fetches a single landlord conversation with full relations.';

GRANT EXECUTE ON FUNCTION landlord.get_landlord_conversation_by_id TO authenticated;
