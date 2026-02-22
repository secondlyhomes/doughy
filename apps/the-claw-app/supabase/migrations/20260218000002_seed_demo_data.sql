-- Seed Demo Data
-- Seeds draft_suggestions and updates connections with config (summaries, blandConfig).
-- Uses deterministic UUIDs for lead_ids — replace with real crm.leads IDs for demo.
--
-- To find real lead IDs:
--   SELECT id, name FROM crm.leads WHERE user_id = '<your-uid>' LIMIT 5;
-- Then update:
--   UPDATE claw.draft_suggestions SET lead_id = '<real-lead-id>' WHERE lead_id = '<placeholder>';

DO $$
DECLARE
  demo_uid UUID;
  lead1 UUID := 'aaaaaaaa-0000-0000-0000-000000000001';
  lead2 UUID := 'aaaaaaaa-0000-0000-0000-000000000002';
  lead3 UUID := 'aaaaaaaa-0000-0000-0000-000000000003';
BEGIN
  -- Find the first user in the system (for single-user demo)
  SELECT id INTO demo_uid FROM auth.users ORDER BY created_at LIMIT 1;
  IF demo_uid IS NULL THEN
    RAISE NOTICE 'No users found in auth.users. Skipping demo seed.';
    RETURN;
  END IF;

  -- Try to grab real lead IDs if crm.leads exists
  BEGIN
    EXECUTE 'SELECT id FROM crm.leads WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1' INTO lead1 USING demo_uid;
    EXECUTE 'SELECT id FROM crm.leads WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1 OFFSET 1' INTO lead2 USING demo_uid;
    EXECUTE 'SELECT id FROM crm.leads WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1 OFFSET 2' INTO lead3 USING demo_uid;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'crm.leads not found, using placeholder lead IDs.';
  END;

  -- Seed draft suggestions (pending = visible in CallPilot)
  INSERT INTO claw.draft_suggestions (user_id, lead_id, draft_text, context, action_type, status, created_at)
  VALUES
    (demo_uid, lead1,
     'Hi! Just following up on our conversation about the Riverside property. I have some updated numbers on the projected rental income — would you have 15 minutes this week to go over them?',
     'Follow-up after property viewing',
     'sms', 'pending', now() - interval '2 hours'),
    (demo_uid, lead2,
     'Good morning! I noticed the maintenance request for unit 4B has been open for 3 days. I''ve found a licensed plumber available tomorrow between 9-11am. Should I go ahead and schedule?',
     'Overdue maintenance request',
     'whatsapp', 'pending', now() - interval '30 minutes'),
    (demo_uid, lead3,
     'Hey — quick update on the Oak Street deal. The seller accepted our counteroffer at $485K. I need your approval to move forward with the inspection. Can you confirm?',
     'Deal stage advancement',
     'sms', 'pending', now() - interval '5 minutes'),
    (demo_uid, lead1,
     'Thanks for the call earlier. As discussed, I''ve drafted the LOI for the duplex on Main St. I''ll send it over for your review once the comps come back.',
     'Post-call follow-up',
     'email', 'approved', now() - interval '1 day'),
    (demo_uid, lead2,
     'Rent reminder: your tenant in unit 2A is 5 days past due. Would you like me to send a friendly reminder, or would you prefer to handle it directly?',
     'Overdue rent notification',
     'sms', 'rejected', now() - interval '2 days')
  ON CONFLICT DO NOTHING;

  -- Update connections with config (summaries + bland config) for existing rows
  UPDATE claw.connections SET config = jsonb_build_object(
    'summary', 'CRM access for leads, deals, properties, and tenant management.'
  ) WHERE user_id = demo_uid AND service = 'doughy' AND (config IS NULL OR config = '{}'::jsonb);

  UPDATE claw.connections SET config = jsonb_build_object(
    'summary', 'Receive drafts, briefings, and approval requests via WhatsApp.'
  ) WHERE user_id = demo_uid AND service = 'whatsapp' AND (config IS NULL OR config = '{}'::jsonb);

  UPDATE claw.connections SET config = jsonb_build_object(
    'summary', 'Receive notifications and drafts in your Discord channels.'
  ) WHERE user_id = demo_uid AND service = 'discord' AND (config IS NULL OR config = '{}'::jsonb);

  UPDATE claw.connections SET config = jsonb_build_object(
    'summary', 'AI-powered phone calls for lead follow-up and scheduling.',
    'bland', jsonb_build_object(
      'maxCallsPerDay', 10,
      'maxSpendPerDayCents', 2000,
      'queueDelaySeconds', 30,
      'voice', 'nat',
      'language', 'en-US'
    )
  ) WHERE user_id = demo_uid AND service = 'bland' AND (config IS NULL OR config = '{}'::jsonb);

  UPDATE claw.connections SET config = jsonb_build_object(
    'summary', 'SMS messaging via Twilio. Verification pending.'
  ) WHERE user_id = demo_uid AND service = 'sms' AND (config IS NULL OR config = '{}'::jsonb);

  UPDATE claw.connections SET config = jsonb_build_object(
    'summary', 'Team notifications and approvals via Slack.'
  ) WHERE user_id = demo_uid AND service = 'slack' AND (config IS NULL OR config = '{}'::jsonb);

  UPDATE claw.connections SET config = jsonb_build_object(
    'summary', 'Sync contacts and deals with HubSpot CRM.'
  ) WHERE user_id = demo_uid AND service = 'hubspot' AND (config IS NULL OR config = '{}'::jsonb);

  UPDATE claw.connections SET config = jsonb_build_object(
    'summary', 'Draft and send emails on your behalf.'
  ) WHERE user_id = demo_uid AND service = 'gmail' AND (config IS NULL OR config = '{}'::jsonb);

  RAISE NOTICE 'Demo data seeded for user %', demo_uid;
END $$;
