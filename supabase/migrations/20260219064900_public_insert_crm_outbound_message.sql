-- Public-schema RPC for inserting outbound messages into crm.messages.
-- Lives in public so PostgREST finds it immediately (no schema cache delay).
-- Uses SECURITY INVOKER — runs as the calling role (service_role for server).
-- The INSERT targets crm.messages with a fully-qualified table name.
--
-- WHY: PostgREST Content-Profile header is unreliable when multiple schemas
-- have identically-named tables (messages exists in investor, landlord, crm,
-- claw). NOTIFY pgrst 'reload schema' doesn't reliably propagate to all
-- PostgREST instances on managed Supabase (Supavisor connection pooling).
-- An RPC with a unique name in the public schema bypasses this entirely.

CREATE OR REPLACE FUNCTION public.insert_crm_outbound_message(
  p_user_id UUID,
  p_lead_id UUID DEFAULT NULL,
  p_contact_id UUID DEFAULT NULL,
  p_direction TEXT DEFAULT 'outbound',
  p_channel TEXT DEFAULT 'sms',
  p_sender_type TEXT DEFAULT 'user',
  p_phone_from TEXT DEFAULT NULL,
  p_phone_to TEXT DEFAULT NULL,
  p_body TEXT DEFAULT '',
  p_status TEXT DEFAULT 'sent',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(id UUID, created_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY INVOKER
SET search_path = crm, public
AS $$
  INSERT INTO crm.messages (user_id, lead_id, contact_id, direction, channel, sender_type, phone_from, phone_to, body, status, metadata)
  VALUES (p_user_id, p_lead_id, p_contact_id, p_direction, p_channel, p_sender_type, p_phone_from, p_phone_to, p_body, p_status, p_metadata)
  RETURNING id, created_at;
$$;

GRANT EXECUTE ON FUNCTION public.insert_crm_outbound_message(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
