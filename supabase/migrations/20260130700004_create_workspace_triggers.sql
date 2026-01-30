-- Migration: Create Workspace Auto-Set Triggers
-- Phase 3: Triggers to automatically set workspace_id on INSERT
-- Date: 2026-01-30
--
-- DBA Best Practices Applied:
-- - SECURITY DEFINER with explicit search_path for trigger functions
-- - Fallback logic when workspace_id not provided
-- - Separate functions for different inheritance patterns
-- - Comprehensive trigger coverage for all workspace-enabled tables

BEGIN;

-- ============================================================================
-- STEP 1: Create trigger functions
-- ============================================================================

-- Generic function for tables with user_id column
CREATE OR REPLACE FUNCTION public.set_workspace_id_from_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only set workspace_id if not already provided
  IF NEW.workspace_id IS NULL THEN
    -- Get user's active workspace
    SELECT wm.workspace_id INTO NEW.workspace_id
    FROM workspace_members wm
    WHERE wm.user_id = COALESCE(NEW.user_id, auth.uid())
      AND wm.is_active = true
    ORDER BY wm.created_at ASC
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

-- Function for landlord_rooms (inherits from property)
CREATE OR REPLACE FUNCTION public.set_workspace_id_from_landlord_property()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.workspace_id IS NULL AND NEW.property_id IS NOT NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM landlord_properties
    WHERE id = NEW.property_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Function for landlord_messages (inherits from conversation)
CREATE OR REPLACE FUNCTION public.set_workspace_id_from_landlord_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.workspace_id IS NULL AND NEW.conversation_id IS NOT NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM landlord_conversations
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Function for investor_deal_events (inherits from deal)
CREATE OR REPLACE FUNCTION public.set_workspace_id_from_investor_deal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.workspace_id IS NULL AND NEW.deal_id IS NOT NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM investor_deals_pipeline
    WHERE id = NEW.deal_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Function for investor_drip_campaign_steps (inherits from campaign)
CREATE OR REPLACE FUNCTION public.set_workspace_id_from_investor_campaign()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.workspace_id IS NULL AND NEW.campaign_id IS NOT NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM investor_campaigns
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Function for investor_messages (inherits from conversation)
CREATE OR REPLACE FUNCTION public.set_workspace_id_from_investor_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.workspace_id IS NULL AND NEW.conversation_id IS NOT NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM investor_conversations
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Function for comms_call_logs (inherits from lead)
CREATE OR REPLACE FUNCTION public.set_workspace_id_from_crm_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.workspace_id IS NULL AND NEW.lead_id IS NOT NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM crm_leads
    WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 2: Create triggers for Landlord Platform tables
-- ============================================================================

-- landlord_properties
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.landlord_properties;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.landlord_properties
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- landlord_rooms (inherits from property)
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.landlord_rooms;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.landlord_rooms
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_landlord_property();

-- landlord_bookings
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.landlord_bookings;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.landlord_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- landlord_conversations
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.landlord_conversations;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.landlord_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- landlord_messages (inherits from conversation)
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.landlord_messages;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.landlord_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_landlord_conversation();

-- landlord_ai_queue_items
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.landlord_ai_queue_items;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.landlord_ai_queue_items
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- landlord_inventory_items
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.landlord_inventory_items;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.landlord_inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- landlord_maintenance_records
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.landlord_maintenance_records;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.landlord_maintenance_records
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- landlord_vendors
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.landlord_vendors;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.landlord_vendors
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- landlord_vendor_messages
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.landlord_vendor_messages;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.landlord_vendor_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- landlord_turnovers
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.landlord_turnovers;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.landlord_turnovers
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- landlord_booking_charges
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.landlord_booking_charges;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.landlord_booking_charges
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- landlord_deposit_settlements
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.landlord_deposit_settlements;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.landlord_deposit_settlements
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- landlord_guest_templates
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.landlord_guest_templates;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.landlord_guest_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- landlord_turnover_templates
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.landlord_turnover_templates;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.landlord_turnover_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- ============================================================================
-- STEP 3: Create triggers for Investor Platform tables
-- ============================================================================

-- investor_deals_pipeline
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.investor_deals_pipeline;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.investor_deals_pipeline
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- investor_deal_events (inherits from deal)
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.investor_deal_events;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.investor_deal_events
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_investor_deal();

-- investor_campaigns
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.investor_campaigns;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.investor_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- investor_drip_campaign_steps (inherits from campaign)
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.investor_drip_campaign_steps;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.investor_drip_campaign_steps
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_investor_campaign();

-- investor_drip_enrollments
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.investor_drip_enrollments;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.investor_drip_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- investor_agents
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.investor_agents;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.investor_agents
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- investor_follow_ups
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.investor_follow_ups;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.investor_follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- investor_outreach_templates
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.investor_outreach_templates;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.investor_outreach_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- investor_conversations
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.investor_conversations;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.investor_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- investor_messages (inherits from conversation)
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.investor_messages;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.investor_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_investor_conversation();

-- ============================================================================
-- STEP 4: Create triggers for Shared/CRM tables
-- ============================================================================

-- crm_contacts
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.crm_contacts;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- comms_call_logs (inherits from lead)
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.comms_call_logs;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.comms_call_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_crm_lead();

-- comms_call_transcripts
DROP TRIGGER IF EXISTS set_workspace_id_trigger ON public.comms_call_transcripts;
CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON public.comms_call_transcripts
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_id_from_user();

-- ============================================================================
-- STEP 5: Grant execute permissions on trigger functions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.set_workspace_id_from_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_workspace_id_from_landlord_property() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_workspace_id_from_landlord_conversation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_workspace_id_from_investor_deal() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_workspace_id_from_investor_campaign() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_workspace_id_from_investor_conversation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_workspace_id_from_crm_lead() TO authenticated;

COMMIT;
