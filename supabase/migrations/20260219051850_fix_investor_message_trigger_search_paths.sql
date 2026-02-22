-- Fix 2 trigger functions on investor.messages that reference the old
-- unqualified name "investor_conversations" (dropped with compat views).
-- These caused 500 on POST /api/messages/send from CallPilot.

CREATE OR REPLACE FUNCTION public.set_workspace_id_from_investor_conversation()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.workspace_id IS NULL AND NEW.conversation_id IS NOT NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM investor.conversations
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_investor_conversation_on_message()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE investor.conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    message_count = COALESCE(message_count, 0) + 1,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$;
