-- Migration: Drop Backward Compatibility Views
-- Completes schema separation - public only has shared infrastructure tables
-- All app code verified to use schema-qualified queries

BEGIN;

-- ============================================================================
-- Investor views (8)
-- ============================================================================
DROP VIEW IF EXISTS public.investor_deals_pipeline CASCADE;
DROP VIEW IF EXISTS public.investor_properties CASCADE;
DROP VIEW IF EXISTS public.investor_campaigns CASCADE;
DROP VIEW IF EXISTS public.investor_drip_campaign_steps CASCADE;
DROP VIEW IF EXISTS public.investor_drip_enrollments CASCADE;
DROP VIEW IF EXISTS public.investor_drip_touch_logs CASCADE;
DROP VIEW IF EXISTS public.investor_conversations CASCADE;
DROP VIEW IF EXISTS public.investor_messages CASCADE;

-- ============================================================================
-- Landlord views (11)
-- ============================================================================
DROP VIEW IF EXISTS public.landlord_properties CASCADE;
DROP VIEW IF EXISTS public.landlord_rooms CASCADE;
DROP VIEW IF EXISTS public.landlord_bookings CASCADE;
DROP VIEW IF EXISTS public.landlord_conversations CASCADE;
DROP VIEW IF EXISTS public.landlord_messages CASCADE;
DROP VIEW IF EXISTS public.landlord_ai_queue_items CASCADE;
DROP VIEW IF EXISTS public.landlord_templates CASCADE;
DROP VIEW IF EXISTS public.landlord_inventory_items CASCADE;
DROP VIEW IF EXISTS public.landlord_turnovers CASCADE;
DROP VIEW IF EXISTS public.landlord_vendors CASCADE;
DROP VIEW IF EXISTS public.landlord_booking_charges CASCADE;

-- ============================================================================
-- AI views (4)
-- ============================================================================
DROP VIEW IF EXISTS public.ai_jobs CASCADE;
DROP VIEW IF EXISTS public.ai_response_outcomes CASCADE;
DROP VIEW IF EXISTS public.ai_moltbot_user_memories CASCADE;
DROP VIEW IF EXISTS public.ai_moltbot_knowledge_sources CASCADE;

-- ============================================================================
-- CRM views (4)
-- ============================================================================
DROP VIEW IF EXISTS public.crm_contacts CASCADE;
DROP VIEW IF EXISTS public.crm_leads CASCADE;
DROP VIEW IF EXISTS public.contact_opt_outs CASCADE;
DROP VIEW IF EXISTS public.contact_touches CASCADE;

-- ============================================================================
-- Integrations views (5)
-- ============================================================================
DROP VIEW IF EXISTS public.seam_connected_devices CASCADE;
DROP VIEW IF EXISTS public.seam_access_codes CASCADE;
DROP VIEW IF EXISTS public.user_gmail_tokens CASCADE;
DROP VIEW IF EXISTS public.meta_dm_credentials CASCADE;
DROP VIEW IF EXISTS public.postgrid_credentials CASCADE;

COMMIT;
