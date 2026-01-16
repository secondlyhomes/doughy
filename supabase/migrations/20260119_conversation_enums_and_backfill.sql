-- Migration: Add Conversation ENUMs and Backfill Existing SMS
-- Zone G: Code Review Response
-- Addresses Critical Issues #6 (ENUMs) and Implementation #10 (Backfill)

-- ============================================================================
-- CREATE CONVERSATION-SPECIFIC ENUMS
-- ============================================================================

-- Conversation type enum
DO $$ BEGIN
  CREATE TYPE conversation_type AS ENUM ('sms', 'call', 'voice_memo', 'email', 'note');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Conversation direction enum (different from message_direction which has incoming/outgoing)
DO $$ BEGIN
  CREATE TYPE conversation_direction AS ENUM ('inbound', 'outbound', 'internal');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Conversation sentiment enum
DO $$ BEGIN
  CREATE TYPE conversation_sentiment AS ENUM ('positive', 'neutral', 'negative');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- ALTER CONVERSATION_ITEMS TO USE ENUMS
-- ============================================================================

-- Drop the existing CHECK constraints first
ALTER TABLE conversation_items
  DROP CONSTRAINT IF EXISTS conversation_items_type_check;

ALTER TABLE conversation_items
  DROP CONSTRAINT IF EXISTS conversation_items_direction_check;

ALTER TABLE conversation_items
  DROP CONSTRAINT IF EXISTS conversation_items_sentiment_check;

-- Alter columns to use ENUMs
ALTER TABLE conversation_items
  ALTER COLUMN type TYPE conversation_type USING type::conversation_type;

ALTER TABLE conversation_items
  ALTER COLUMN direction TYPE conversation_direction USING direction::conversation_direction;

ALTER TABLE conversation_items
  ALTER COLUMN sentiment TYPE conversation_sentiment USING sentiment::conversation_sentiment;

-- ============================================================================
-- BACKFILL EXISTING SMS INTO CONVERSATION_ITEMS
-- ============================================================================

-- Insert existing SMS messages that aren't already in conversation_items
-- Links to leads via phone number matching
INSERT INTO conversation_items (
  workspace_id,
  user_id,
  lead_id,
  type,
  direction,
  content,
  phone_number,
  twilio_message_sid,
  sms_inbox_id,
  occurred_at,
  created_at
)
SELECT
  l.workspace_id,
  l.user_id,
  l.id as lead_id,
  'sms'::conversation_type,
  'inbound'::conversation_direction,
  s.message_body,
  s.phone_number,
  s.twilio_message_id,
  s.id,
  COALESCE(s.created_at, NOW()),
  COALESCE(s.created_at, NOW())
FROM sms_inbox s
INNER JOIN crm_leads l ON (
  -- Match phone numbers (normalize by taking last 10 digits)
  RIGHT(REGEXP_REPLACE(l.phone, '[^0-9]', '', 'g'), 10) =
  RIGHT(REGEXP_REPLACE(s.phone_number, '[^0-9]', '', 'g'), 10)
)
WHERE
  -- Only insert if not already linked
  s.id NOT IN (
    SELECT sms_inbox_id
    FROM conversation_items
    WHERE sms_inbox_id IS NOT NULL
  )
  -- Must have a valid user_id (required by conversation_items)
  AND l.user_id IS NOT NULL
-- Dedupe in case of multiple lead matches - take first one
ON CONFLICT (twilio_message_sid) WHERE twilio_message_sid IS NOT NULL
DO NOTHING;

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Added conversation ENUMs and backfilled SMS to conversation_items (Zone G Review Response)',
  jsonb_build_object(
    'migration', '20260119_conversation_enums_and_backfill',
    'enums_created', ARRAY['conversation_type', 'conversation_direction', 'conversation_sentiment'],
    'backfill_table', 'sms_inbox → conversation_items'
  )
);
