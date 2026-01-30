-- Migration: Backfill workspace_id for Existing Data
-- Phase 2: Populate workspace_id from user's primary workspace
-- Date: 2026-01-30
--
-- DBA Best Practices Applied:
-- - Backfill in a single transaction for consistency
-- - Use user's active workspace from workspace_members
-- - Handle tables with and without user_id column differently
-- - Log progress with RAISE NOTICE for debugging
--
-- Strategy:
-- - For tables with user_id: Set workspace_id from user's active workspace
-- - For child tables: Inherit workspace_id from parent table

BEGIN;

-- ============================================================================
-- STEP 1: Backfill Landlord Platform Tables (with user_id)
-- ============================================================================

-- landlord_properties - Primary entity
UPDATE public.landlord_properties t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- landlord_rooms - Inherit from property
UPDATE public.landlord_rooms r
SET workspace_id = (
  SELECT p.workspace_id FROM public.landlord_properties p
  WHERE p.id = r.property_id
)
WHERE r.workspace_id IS NULL AND r.property_id IS NOT NULL;

-- landlord_bookings
UPDATE public.landlord_bookings t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- landlord_conversations
UPDATE public.landlord_conversations t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- landlord_messages - Inherit from conversation
UPDATE public.landlord_messages m
SET workspace_id = (
  SELECT c.workspace_id FROM public.landlord_conversations c
  WHERE c.id = m.conversation_id
)
WHERE m.workspace_id IS NULL AND m.conversation_id IS NOT NULL;

-- landlord_ai_queue_items
UPDATE public.landlord_ai_queue_items t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- landlord_inventory_items
UPDATE public.landlord_inventory_items t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- landlord_maintenance_records
UPDATE public.landlord_maintenance_records t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- landlord_vendors
UPDATE public.landlord_vendors t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- landlord_vendor_messages
UPDATE public.landlord_vendor_messages t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- landlord_turnovers
UPDATE public.landlord_turnovers t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- landlord_booking_charges
UPDATE public.landlord_booking_charges t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- landlord_deposit_settlements
UPDATE public.landlord_deposit_settlements t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- landlord_guest_templates
UPDATE public.landlord_guest_templates t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- landlord_turnover_templates
UPDATE public.landlord_turnover_templates t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- ============================================================================
-- STEP 2: Backfill Investor Platform Tables (missing workspace_id)
-- ============================================================================

-- investor_deals_pipeline
UPDATE public.investor_deals_pipeline t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- investor_deal_events - Inherit from deal
UPDATE public.investor_deal_events e
SET workspace_id = (
  SELECT d.workspace_id FROM public.investor_deals_pipeline d
  WHERE d.id = e.deal_id
)
WHERE e.workspace_id IS NULL AND e.deal_id IS NOT NULL;

-- investor_campaigns
UPDATE public.investor_campaigns t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- investor_drip_campaign_steps - Inherit from campaign
UPDATE public.investor_drip_campaign_steps s
SET workspace_id = (
  SELECT c.workspace_id FROM public.investor_campaigns c
  WHERE c.id = s.campaign_id
)
WHERE s.workspace_id IS NULL AND s.campaign_id IS NOT NULL;

-- investor_drip_enrollments
UPDATE public.investor_drip_enrollments t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- investor_agents
UPDATE public.investor_agents t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- investor_follow_ups
UPDATE public.investor_follow_ups t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- investor_outreach_templates
UPDATE public.investor_outreach_templates t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- investor_conversations
UPDATE public.investor_conversations t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- investor_messages - Inherit from conversation
UPDATE public.investor_messages m
SET workspace_id = (
  SELECT c.workspace_id FROM public.investor_conversations c
  WHERE c.id = m.conversation_id
)
WHERE m.workspace_id IS NULL AND m.conversation_id IS NOT NULL;

-- ============================================================================
-- STEP 3: Backfill Shared/CRM Tables
-- ============================================================================

-- crm_contacts
UPDATE public.crm_contacts t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

-- comms_call_logs - May need to inherit from lead
UPDATE public.comms_call_logs t
SET workspace_id = (
  SELECT l.workspace_id FROM public.crm_leads l
  WHERE l.id = t.lead_id
)
WHERE t.workspace_id IS NULL AND t.lead_id IS NOT NULL;

-- comms_call_transcripts
UPDATE public.comms_call_transcripts t
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm
  WHERE wm.user_id = t.user_id AND wm.is_active = true
  ORDER BY wm.created_at ASC
  LIMIT 1
)
WHERE t.workspace_id IS NULL AND t.user_id IS NOT NULL;

COMMIT;
