-- Fix remaining 10 trigger functions with stale unqualified table references.
-- After schema separation (20260131600000), tables moved from public to
-- investor/landlord/crm schemas, but trigger functions with
-- search_path='public' still reference old unqualified names.
-- (The 2 investor.messages triggers were fixed in 20260219051850.)

-- ── Investor schema triggers ─────────────────────────────────────────────

-- investor.comps trigger
CREATE OR REPLACE FUNCTION public.set_comp_workspace_id()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.workspace_id IS NULL THEN
        SELECT workspace_id INTO NEW.workspace_id
        FROM investor.properties
        WHERE id = NEW.property_id;
    END IF;
    RETURN NEW;
END;
$function$;

-- investor.deal_events trigger
CREATE OR REPLACE FUNCTION public.set_workspace_id_from_investor_deal()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.workspace_id IS NULL AND NEW.deal_id IS NOT NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM investor.deals_pipeline
    WHERE id = NEW.deal_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- investor.drip_campaign_steps trigger
CREATE OR REPLACE FUNCTION public.set_workspace_id_from_investor_campaign()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.workspace_id IS NULL AND NEW.campaign_id IS NOT NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM investor.campaigns
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- investor.drip_enrollments trigger
CREATE OR REPLACE FUNCTION public.update_campaign_counts()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE investor.campaigns
    SET enrolled_count = COALESCE(enrolled_count, 0) + 1
    WHERE id = NEW.campaign_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
      UPDATE investor.campaigns
      SET
        completed_count = COALESCE(completed_count, 0) + 1,
        enrolled_count = GREATEST(0, COALESCE(enrolled_count, 0) - 1)
      WHERE id = NEW.campaign_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- investor.lead_properties trigger
CREATE OR REPLACE FUNCTION public.set_lead_property_workspace()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  lead_workspace_id UUID;
  property_workspace_id UUID;
BEGIN
  SELECT workspace_id INTO lead_workspace_id
  FROM crm.leads
  WHERE id = NEW.lead_id
  LIMIT 1;

  IF lead_workspace_id IS NOT NULL THEN
    NEW.workspace_id := lead_workspace_id;
  ELSE
    SELECT workspace_id INTO property_workspace_id
    FROM investor.properties
    WHERE id = NEW.property_id
    LIMIT 1;

    IF property_workspace_id IS NOT NULL THEN
      NEW.workspace_id := property_workspace_id;
    ELSE
      SELECT workspace_id INTO NEW.workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
      LIMIT 1;
    END IF;
  END IF;

  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;

  RETURN NEW;
END;
$function$;

-- ── Landlord schema triggers ─────────────────────────────────────────────

-- landlord.bookings trigger
CREATE OR REPLACE FUNCTION public.update_room_on_booking()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.room_id IS NOT NULL AND NEW.status = 'confirmed' THEN
    UPDATE landlord.rooms
    SET
      current_booking_id = NEW.id,
      updated_at = NOW()
    WHERE id = NEW.room_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- landlord.messages triggers
CREATE OR REPLACE FUNCTION public.set_workspace_id_from_landlord_conversation()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.workspace_id IS NULL AND NEW.conversation_id IS NOT NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM landlord.conversations
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE landlord.conversations
  SET
    last_message_at = NEW.created_at,
    message_count = message_count + 1,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$;

-- landlord.rooms trigger
CREATE OR REPLACE FUNCTION public.set_workspace_id_from_landlord_property()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.workspace_id IS NULL AND NEW.property_id IS NOT NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM landlord.properties
    WHERE id = NEW.property_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- ── Public schema triggers ───────────────────────────────────────────────

-- public.comms_call_logs trigger
CREATE OR REPLACE FUNCTION public.set_workspace_id_from_crm_lead()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.workspace_id IS NULL AND NEW.lead_id IS NOT NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM crm.leads
    WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END;
$function$;
