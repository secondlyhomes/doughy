-- Migration: Add missing message_count column to investor_conversations
-- Date: 2026-01-31
-- Description: The investor_conversations table was missing the message_count column
-- that exists on landlord_conversations. The update_investor_conversation_on_message
-- trigger was trying to update this column. This adds the missing column.

BEGIN;

-- Add the missing message_count column to investor_conversations
-- (matches landlord_conversations schema)
ALTER TABLE public.investor_conversations
  ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;

COMMENT ON COLUMN public.investor_conversations.message_count IS 'Total count of messages in this conversation';

-- Create index for potential queries
CREATE INDEX IF NOT EXISTS idx_investor_conversations_message_count
  ON public.investor_conversations(message_count);

-- Ensure the trigger function includes message_count update
CREATE OR REPLACE FUNCTION public.update_investor_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE investor_conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    message_count = COALESCE(message_count, 0) + 1,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

COMMIT;
