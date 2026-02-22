-- Seed Defaults for Dino's Account
-- Runs after table creation. Uses ON CONFLICT to be idempotent.
-- Replace the UUID below with Dino's actual auth.users id after first sign-up.

-- NOTE: This seed uses a placeholder user_id.
-- After Dino signs up, run:
--   UPDATE claw.trust_config SET user_id = '<real-uid>' WHERE user_id = '00000000-0000-0000-0000-000000000001';
--   UPDATE claw.connections  SET user_id = '<real-uid>' WHERE user_id = '00000000-0000-0000-0000-000000000001';

DO $$
DECLARE
  seed_uid UUID := '00000000-0000-0000-0000-000000000001';
BEGIN

  -- Only seed if the user exists in auth.users (placeholder UUID must be replaced after sign-up)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = seed_uid) THEN
    RAISE NOTICE 'Seed user % does not exist in auth.users. Skipping seed data. Replace placeholder UUID after first sign-up.', seed_uid;
    RETURN;
  END IF;

  -- Trust config: manual by default, 30s countdown, $5/day limit, $50/month budget
  INSERT INTO claw.trust_config (user_id, global_level, countdown_seconds, daily_spend_limit_cents, daily_call_limit)
  VALUES (seed_uid, 'manual', 30, 500, 10)
  ON CONFLICT (user_id) DO NOTHING;

  -- Connections: 5 connected, 2 not connected
  INSERT INTO claw.connections (user_id, service, name, status, permissions) VALUES
    (seed_uid, 'doughy',   'Doughy',      'connected',    '{"investor": {"read_leads": true, "read_deals": true, "read_properties": true, "read_documents": true, "draft_messages": true, "send_messages": false, "update_lead_status": false, "update_deal_stage": false, "create_new_leads": false, "delete_records": false}, "landlord": {"read_bookings": true, "read_maintenance": true, "read_tenants": true, "draft_messages": true, "send_messages": false, "dispatch_vendors": false, "create_maintenance_req": false, "delete_records": false}}'),
    (seed_uid, 'whatsapp', 'WhatsApp',    'connected',    '{"messages": {"receive_claw": true, "receive_drafts": true, "receive_briefings": true, "receive_approvals": true}}'),
    (seed_uid, 'discord',  'Discord',     'connected',    '{"channels": {"receive_claw": true, "receive_drafts": true, "receive_briefings": true}}'),
    (seed_uid, 'bland',    'Bland AI',    'connected',    '{"calls": {"view_logs": true, "make_calls": false}}'),
    (seed_uid, 'sms',      'SMS (Twilio)','warning',      '{"messages": {"read_sms": true, "send_sms": false}}'),
    (seed_uid, 'slack',    'Slack',       'disconnected', '{}'),
    (seed_uid, 'hubspot',  'HubSpot',    'disconnected', '{}')
  ON CONFLICT (user_id, service) DO NOTHING;

END $$;
