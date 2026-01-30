-- Migration: Update RLS Policies for Workspace-Based Access
-- Phase 4: Update RLS policies from user_id to workspace membership
-- Date: 2026-01-30
--
-- DBA Best Practices Applied:
-- - Workspace membership subquery pattern (cacheable by PostgreSQL)
-- - Separate policies per operation (SELECT, INSERT, UPDATE, DELETE)
-- - Owner-only restrictions for destructive operations (DELETE)
-- - Include is_active = true check on workspace_members
--
-- Role Permissions:
-- | Action | Owner | Member |
-- |--------|-------|--------|
-- | SELECT | Yes   | Yes    |
-- | INSERT | Yes   | Yes    |
-- | UPDATE | Yes   | Yes    |
-- | DELETE | Yes   | No     |

BEGIN;

-- ============================================================================
-- HELPER: Create reusable function for workspace membership check
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_workspace_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT workspace_id FROM workspace_members
  WHERE user_id = auth.uid() AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.user_owned_workspace_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT workspace_id FROM workspace_members
  WHERE user_id = auth.uid() AND is_active = true AND role = 'owner';
$$;

GRANT EXECUTE ON FUNCTION public.user_workspace_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_owned_workspace_ids() TO authenticated;

-- ============================================================================
-- STEP 1: Update Landlord Platform RLS Policies
-- ============================================================================

-- landlord_properties
DROP POLICY IF EXISTS "landlord_properties_select_policy" ON public.landlord_properties;
DROP POLICY IF EXISTS "landlord_properties_insert_policy" ON public.landlord_properties;
DROP POLICY IF EXISTS "landlord_properties_update_policy" ON public.landlord_properties;
DROP POLICY IF EXISTS "landlord_properties_delete_policy" ON public.landlord_properties;

CREATE POLICY "landlord_properties_workspace_select" ON public.landlord_properties
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_properties_workspace_insert" ON public.landlord_properties
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_properties_workspace_update" ON public.landlord_properties
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_properties_workspace_delete" ON public.landlord_properties
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- landlord_rooms
DROP POLICY IF EXISTS "landlord_rooms_select_policy" ON public.landlord_rooms;
DROP POLICY IF EXISTS "landlord_rooms_insert_policy" ON public.landlord_rooms;
DROP POLICY IF EXISTS "landlord_rooms_update_policy" ON public.landlord_rooms;
DROP POLICY IF EXISTS "landlord_rooms_delete_policy" ON public.landlord_rooms;

CREATE POLICY "landlord_rooms_workspace_select" ON public.landlord_rooms
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_rooms_workspace_insert" ON public.landlord_rooms
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_rooms_workspace_update" ON public.landlord_rooms
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_rooms_workspace_delete" ON public.landlord_rooms
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- landlord_bookings
DROP POLICY IF EXISTS "landlord_bookings_select_policy" ON public.landlord_bookings;
DROP POLICY IF EXISTS "landlord_bookings_insert_policy" ON public.landlord_bookings;
DROP POLICY IF EXISTS "landlord_bookings_update_policy" ON public.landlord_bookings;
DROP POLICY IF EXISTS "landlord_bookings_delete_policy" ON public.landlord_bookings;

CREATE POLICY "landlord_bookings_workspace_select" ON public.landlord_bookings
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_bookings_workspace_insert" ON public.landlord_bookings
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_bookings_workspace_update" ON public.landlord_bookings
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_bookings_workspace_delete" ON public.landlord_bookings
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- landlord_conversations
DROP POLICY IF EXISTS "landlord_conversations_select_policy" ON public.landlord_conversations;
DROP POLICY IF EXISTS "landlord_conversations_insert_policy" ON public.landlord_conversations;
DROP POLICY IF EXISTS "landlord_conversations_update_policy" ON public.landlord_conversations;
DROP POLICY IF EXISTS "landlord_conversations_delete_policy" ON public.landlord_conversations;

CREATE POLICY "landlord_conversations_workspace_select" ON public.landlord_conversations
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_conversations_workspace_insert" ON public.landlord_conversations
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_conversations_workspace_update" ON public.landlord_conversations
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_conversations_workspace_delete" ON public.landlord_conversations
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- landlord_messages
DROP POLICY IF EXISTS "landlord_messages_select_policy" ON public.landlord_messages;
DROP POLICY IF EXISTS "landlord_messages_insert_policy" ON public.landlord_messages;
DROP POLICY IF EXISTS "landlord_messages_update_policy" ON public.landlord_messages;
DROP POLICY IF EXISTS "landlord_messages_delete_policy" ON public.landlord_messages;

CREATE POLICY "landlord_messages_workspace_select" ON public.landlord_messages
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_messages_workspace_insert" ON public.landlord_messages
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_messages_workspace_update" ON public.landlord_messages
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_messages_workspace_delete" ON public.landlord_messages
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- landlord_ai_queue_items
DROP POLICY IF EXISTS "landlord_ai_queue_items_select_policy" ON public.landlord_ai_queue_items;
DROP POLICY IF EXISTS "landlord_ai_queue_items_insert_policy" ON public.landlord_ai_queue_items;
DROP POLICY IF EXISTS "landlord_ai_queue_items_update_policy" ON public.landlord_ai_queue_items;
DROP POLICY IF EXISTS "landlord_ai_queue_items_delete_policy" ON public.landlord_ai_queue_items;

CREATE POLICY "landlord_ai_queue_items_workspace_select" ON public.landlord_ai_queue_items
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_ai_queue_items_workspace_insert" ON public.landlord_ai_queue_items
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_ai_queue_items_workspace_update" ON public.landlord_ai_queue_items
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_ai_queue_items_workspace_delete" ON public.landlord_ai_queue_items
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- landlord_inventory_items
DROP POLICY IF EXISTS "landlord_inventory_items_select_policy" ON public.landlord_inventory_items;
DROP POLICY IF EXISTS "landlord_inventory_items_insert_policy" ON public.landlord_inventory_items;
DROP POLICY IF EXISTS "landlord_inventory_items_update_policy" ON public.landlord_inventory_items;
DROP POLICY IF EXISTS "landlord_inventory_items_delete_policy" ON public.landlord_inventory_items;

CREATE POLICY "landlord_inventory_items_workspace_select" ON public.landlord_inventory_items
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_inventory_items_workspace_insert" ON public.landlord_inventory_items
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_inventory_items_workspace_update" ON public.landlord_inventory_items
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_inventory_items_workspace_delete" ON public.landlord_inventory_items
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- landlord_maintenance_records
DROP POLICY IF EXISTS "landlord_maintenance_records_select_policy" ON public.landlord_maintenance_records;
DROP POLICY IF EXISTS "landlord_maintenance_records_insert_policy" ON public.landlord_maintenance_records;
DROP POLICY IF EXISTS "landlord_maintenance_records_update_policy" ON public.landlord_maintenance_records;
DROP POLICY IF EXISTS "landlord_maintenance_records_delete_policy" ON public.landlord_maintenance_records;

CREATE POLICY "landlord_maintenance_records_workspace_select" ON public.landlord_maintenance_records
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_maintenance_records_workspace_insert" ON public.landlord_maintenance_records
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_maintenance_records_workspace_update" ON public.landlord_maintenance_records
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_maintenance_records_workspace_delete" ON public.landlord_maintenance_records
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- landlord_vendors
DROP POLICY IF EXISTS "landlord_vendors_select_policy" ON public.landlord_vendors;
DROP POLICY IF EXISTS "landlord_vendors_insert_policy" ON public.landlord_vendors;
DROP POLICY IF EXISTS "landlord_vendors_update_policy" ON public.landlord_vendors;
DROP POLICY IF EXISTS "landlord_vendors_delete_policy" ON public.landlord_vendors;

CREATE POLICY "landlord_vendors_workspace_select" ON public.landlord_vendors
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_vendors_workspace_insert" ON public.landlord_vendors
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_vendors_workspace_update" ON public.landlord_vendors
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_vendors_workspace_delete" ON public.landlord_vendors
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- landlord_vendor_messages
DROP POLICY IF EXISTS "landlord_vendor_messages_select_policy" ON public.landlord_vendor_messages;
DROP POLICY IF EXISTS "landlord_vendor_messages_insert_policy" ON public.landlord_vendor_messages;
DROP POLICY IF EXISTS "landlord_vendor_messages_update_policy" ON public.landlord_vendor_messages;
DROP POLICY IF EXISTS "landlord_vendor_messages_delete_policy" ON public.landlord_vendor_messages;

CREATE POLICY "landlord_vendor_messages_workspace_select" ON public.landlord_vendor_messages
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_vendor_messages_workspace_insert" ON public.landlord_vendor_messages
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_vendor_messages_workspace_update" ON public.landlord_vendor_messages
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_vendor_messages_workspace_delete" ON public.landlord_vendor_messages
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- landlord_turnovers
DROP POLICY IF EXISTS "landlord_turnovers_select_policy" ON public.landlord_turnovers;
DROP POLICY IF EXISTS "landlord_turnovers_insert_policy" ON public.landlord_turnovers;
DROP POLICY IF EXISTS "landlord_turnovers_update_policy" ON public.landlord_turnovers;
DROP POLICY IF EXISTS "landlord_turnovers_delete_policy" ON public.landlord_turnovers;

CREATE POLICY "landlord_turnovers_workspace_select" ON public.landlord_turnovers
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_turnovers_workspace_insert" ON public.landlord_turnovers
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_turnovers_workspace_update" ON public.landlord_turnovers
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_turnovers_workspace_delete" ON public.landlord_turnovers
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- landlord_booking_charges
DROP POLICY IF EXISTS "landlord_booking_charges_select_policy" ON public.landlord_booking_charges;
DROP POLICY IF EXISTS "landlord_booking_charges_insert_policy" ON public.landlord_booking_charges;
DROP POLICY IF EXISTS "landlord_booking_charges_update_policy" ON public.landlord_booking_charges;
DROP POLICY IF EXISTS "landlord_booking_charges_delete_policy" ON public.landlord_booking_charges;

CREATE POLICY "landlord_booking_charges_workspace_select" ON public.landlord_booking_charges
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_booking_charges_workspace_insert" ON public.landlord_booking_charges
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_booking_charges_workspace_update" ON public.landlord_booking_charges
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_booking_charges_workspace_delete" ON public.landlord_booking_charges
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- landlord_deposit_settlements
DROP POLICY IF EXISTS "landlord_deposit_settlements_select_policy" ON public.landlord_deposit_settlements;
DROP POLICY IF EXISTS "landlord_deposit_settlements_insert_policy" ON public.landlord_deposit_settlements;
DROP POLICY IF EXISTS "landlord_deposit_settlements_update_policy" ON public.landlord_deposit_settlements;
DROP POLICY IF EXISTS "landlord_deposit_settlements_delete_policy" ON public.landlord_deposit_settlements;

CREATE POLICY "landlord_deposit_settlements_workspace_select" ON public.landlord_deposit_settlements
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_deposit_settlements_workspace_insert" ON public.landlord_deposit_settlements
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_deposit_settlements_workspace_update" ON public.landlord_deposit_settlements
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_deposit_settlements_workspace_delete" ON public.landlord_deposit_settlements
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- landlord_guest_templates
DROP POLICY IF EXISTS "landlord_guest_templates_select_policy" ON public.landlord_guest_templates;
DROP POLICY IF EXISTS "landlord_guest_templates_insert_policy" ON public.landlord_guest_templates;
DROP POLICY IF EXISTS "landlord_guest_templates_update_policy" ON public.landlord_guest_templates;
DROP POLICY IF EXISTS "landlord_guest_templates_delete_policy" ON public.landlord_guest_templates;

CREATE POLICY "landlord_guest_templates_workspace_select" ON public.landlord_guest_templates
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_guest_templates_workspace_insert" ON public.landlord_guest_templates
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_guest_templates_workspace_update" ON public.landlord_guest_templates
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_guest_templates_workspace_delete" ON public.landlord_guest_templates
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- landlord_turnover_templates
DROP POLICY IF EXISTS "landlord_turnover_templates_select_policy" ON public.landlord_turnover_templates;
DROP POLICY IF EXISTS "landlord_turnover_templates_insert_policy" ON public.landlord_turnover_templates;
DROP POLICY IF EXISTS "landlord_turnover_templates_update_policy" ON public.landlord_turnover_templates;
DROP POLICY IF EXISTS "landlord_turnover_templates_delete_policy" ON public.landlord_turnover_templates;

CREATE POLICY "landlord_turnover_templates_workspace_select" ON public.landlord_turnover_templates
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_turnover_templates_workspace_insert" ON public.landlord_turnover_templates
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_turnover_templates_workspace_update" ON public.landlord_turnover_templates
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "landlord_turnover_templates_workspace_delete" ON public.landlord_turnover_templates
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- ============================================================================
-- STEP 2: Update Investor Platform RLS Policies
-- ============================================================================

-- investor_deals_pipeline
DROP POLICY IF EXISTS "investor_deals_pipeline_select_policy" ON public.investor_deals_pipeline;
DROP POLICY IF EXISTS "investor_deals_pipeline_insert_policy" ON public.investor_deals_pipeline;
DROP POLICY IF EXISTS "investor_deals_pipeline_update_policy" ON public.investor_deals_pipeline;
DROP POLICY IF EXISTS "investor_deals_pipeline_delete_policy" ON public.investor_deals_pipeline;

CREATE POLICY "investor_deals_pipeline_workspace_select" ON public.investor_deals_pipeline
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_deals_pipeline_workspace_insert" ON public.investor_deals_pipeline
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_deals_pipeline_workspace_update" ON public.investor_deals_pipeline
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_deals_pipeline_workspace_delete" ON public.investor_deals_pipeline
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- investor_deal_events
DROP POLICY IF EXISTS "investor_deal_events_select_policy" ON public.investor_deal_events;
DROP POLICY IF EXISTS "investor_deal_events_insert_policy" ON public.investor_deal_events;
DROP POLICY IF EXISTS "investor_deal_events_update_policy" ON public.investor_deal_events;
DROP POLICY IF EXISTS "investor_deal_events_delete_policy" ON public.investor_deal_events;

CREATE POLICY "investor_deal_events_workspace_select" ON public.investor_deal_events
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_deal_events_workspace_insert" ON public.investor_deal_events
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_deal_events_workspace_update" ON public.investor_deal_events
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_deal_events_workspace_delete" ON public.investor_deal_events
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- investor_campaigns
DROP POLICY IF EXISTS "investor_campaigns_select_policy" ON public.investor_campaigns;
DROP POLICY IF EXISTS "investor_campaigns_insert_policy" ON public.investor_campaigns;
DROP POLICY IF EXISTS "investor_campaigns_update_policy" ON public.investor_campaigns;
DROP POLICY IF EXISTS "investor_campaigns_delete_policy" ON public.investor_campaigns;

CREATE POLICY "investor_campaigns_workspace_select" ON public.investor_campaigns
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_campaigns_workspace_insert" ON public.investor_campaigns
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_campaigns_workspace_update" ON public.investor_campaigns
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_campaigns_workspace_delete" ON public.investor_campaigns
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- investor_drip_campaign_steps
DROP POLICY IF EXISTS "investor_drip_campaign_steps_select_policy" ON public.investor_drip_campaign_steps;
DROP POLICY IF EXISTS "investor_drip_campaign_steps_insert_policy" ON public.investor_drip_campaign_steps;
DROP POLICY IF EXISTS "investor_drip_campaign_steps_update_policy" ON public.investor_drip_campaign_steps;
DROP POLICY IF EXISTS "investor_drip_campaign_steps_delete_policy" ON public.investor_drip_campaign_steps;

CREATE POLICY "investor_drip_campaign_steps_workspace_select" ON public.investor_drip_campaign_steps
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_drip_campaign_steps_workspace_insert" ON public.investor_drip_campaign_steps
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_drip_campaign_steps_workspace_update" ON public.investor_drip_campaign_steps
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_drip_campaign_steps_workspace_delete" ON public.investor_drip_campaign_steps
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- investor_drip_enrollments
DROP POLICY IF EXISTS "investor_drip_enrollments_select_policy" ON public.investor_drip_enrollments;
DROP POLICY IF EXISTS "investor_drip_enrollments_insert_policy" ON public.investor_drip_enrollments;
DROP POLICY IF EXISTS "investor_drip_enrollments_update_policy" ON public.investor_drip_enrollments;
DROP POLICY IF EXISTS "investor_drip_enrollments_delete_policy" ON public.investor_drip_enrollments;

CREATE POLICY "investor_drip_enrollments_workspace_select" ON public.investor_drip_enrollments
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_drip_enrollments_workspace_insert" ON public.investor_drip_enrollments
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_drip_enrollments_workspace_update" ON public.investor_drip_enrollments
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_drip_enrollments_workspace_delete" ON public.investor_drip_enrollments
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- investor_agents
DROP POLICY IF EXISTS "investor_agents_select_policy" ON public.investor_agents;
DROP POLICY IF EXISTS "investor_agents_insert_policy" ON public.investor_agents;
DROP POLICY IF EXISTS "investor_agents_update_policy" ON public.investor_agents;
DROP POLICY IF EXISTS "investor_agents_delete_policy" ON public.investor_agents;

CREATE POLICY "investor_agents_workspace_select" ON public.investor_agents
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_agents_workspace_insert" ON public.investor_agents
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_agents_workspace_update" ON public.investor_agents
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_agents_workspace_delete" ON public.investor_agents
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- investor_follow_ups
DROP POLICY IF EXISTS "investor_follow_ups_select_policy" ON public.investor_follow_ups;
DROP POLICY IF EXISTS "investor_follow_ups_insert_policy" ON public.investor_follow_ups;
DROP POLICY IF EXISTS "investor_follow_ups_update_policy" ON public.investor_follow_ups;
DROP POLICY IF EXISTS "investor_follow_ups_delete_policy" ON public.investor_follow_ups;

CREATE POLICY "investor_follow_ups_workspace_select" ON public.investor_follow_ups
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_follow_ups_workspace_insert" ON public.investor_follow_ups
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_follow_ups_workspace_update" ON public.investor_follow_ups
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_follow_ups_workspace_delete" ON public.investor_follow_ups
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- investor_outreach_templates
DROP POLICY IF EXISTS "investor_outreach_templates_select_policy" ON public.investor_outreach_templates;
DROP POLICY IF EXISTS "investor_outreach_templates_insert_policy" ON public.investor_outreach_templates;
DROP POLICY IF EXISTS "investor_outreach_templates_update_policy" ON public.investor_outreach_templates;
DROP POLICY IF EXISTS "investor_outreach_templates_delete_policy" ON public.investor_outreach_templates;

CREATE POLICY "investor_outreach_templates_workspace_select" ON public.investor_outreach_templates
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_outreach_templates_workspace_insert" ON public.investor_outreach_templates
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_outreach_templates_workspace_update" ON public.investor_outreach_templates
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_outreach_templates_workspace_delete" ON public.investor_outreach_templates
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- investor_conversations
DROP POLICY IF EXISTS "investor_conversations_select_policy" ON public.investor_conversations;
DROP POLICY IF EXISTS "investor_conversations_insert_policy" ON public.investor_conversations;
DROP POLICY IF EXISTS "investor_conversations_update_policy" ON public.investor_conversations;
DROP POLICY IF EXISTS "investor_conversations_delete_policy" ON public.investor_conversations;

CREATE POLICY "investor_conversations_workspace_select" ON public.investor_conversations
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_conversations_workspace_insert" ON public.investor_conversations
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_conversations_workspace_update" ON public.investor_conversations
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_conversations_workspace_delete" ON public.investor_conversations
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- investor_messages
DROP POLICY IF EXISTS "investor_messages_select_policy" ON public.investor_messages;
DROP POLICY IF EXISTS "investor_messages_insert_policy" ON public.investor_messages;
DROP POLICY IF EXISTS "investor_messages_update_policy" ON public.investor_messages;
DROP POLICY IF EXISTS "investor_messages_delete_policy" ON public.investor_messages;

CREATE POLICY "investor_messages_workspace_select" ON public.investor_messages
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_messages_workspace_insert" ON public.investor_messages
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_messages_workspace_update" ON public.investor_messages
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "investor_messages_workspace_delete" ON public.investor_messages
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- ============================================================================
-- STEP 3: Update Shared/CRM RLS Policies
-- ============================================================================

-- crm_contacts
DROP POLICY IF EXISTS "crm_contacts_select_policy" ON public.crm_contacts;
DROP POLICY IF EXISTS "crm_contacts_insert_policy" ON public.crm_contacts;
DROP POLICY IF EXISTS "crm_contacts_update_policy" ON public.crm_contacts;
DROP POLICY IF EXISTS "crm_contacts_delete_policy" ON public.crm_contacts;

CREATE POLICY "crm_contacts_workspace_select" ON public.crm_contacts
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "crm_contacts_workspace_insert" ON public.crm_contacts
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "crm_contacts_workspace_update" ON public.crm_contacts
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "crm_contacts_workspace_delete" ON public.crm_contacts
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- comms_call_logs
DROP POLICY IF EXISTS "comms_call_logs_select_policy" ON public.comms_call_logs;
DROP POLICY IF EXISTS "comms_call_logs_insert_policy" ON public.comms_call_logs;
DROP POLICY IF EXISTS "comms_call_logs_update_policy" ON public.comms_call_logs;
DROP POLICY IF EXISTS "comms_call_logs_delete_policy" ON public.comms_call_logs;

CREATE POLICY "comms_call_logs_workspace_select" ON public.comms_call_logs
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "comms_call_logs_workspace_insert" ON public.comms_call_logs
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "comms_call_logs_workspace_update" ON public.comms_call_logs
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "comms_call_logs_workspace_delete" ON public.comms_call_logs
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- comms_call_transcripts
DROP POLICY IF EXISTS "comms_call_transcripts_select_policy" ON public.comms_call_transcripts;
DROP POLICY IF EXISTS "comms_call_transcripts_insert_policy" ON public.comms_call_transcripts;
DROP POLICY IF EXISTS "comms_call_transcripts_update_policy" ON public.comms_call_transcripts;
DROP POLICY IF EXISTS "comms_call_transcripts_delete_policy" ON public.comms_call_transcripts;

CREATE POLICY "comms_call_transcripts_workspace_select" ON public.comms_call_transcripts
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "comms_call_transcripts_workspace_insert" ON public.comms_call_transcripts
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "comms_call_transcripts_workspace_update" ON public.comms_call_transcripts
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "comms_call_transcripts_workspace_delete" ON public.comms_call_transcripts
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));

COMMIT;
