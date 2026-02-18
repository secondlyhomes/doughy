-- Migration: Expose Custom Schemas for PostgREST RPC Access
-- Description: Grant proper access to investor, landlord, crm, and integrations schemas
--              so PostgREST can expose their RPC functions directly
--
-- This is the recommended Supabase pattern instead of wrapper functions in public schema.
-- See: https://supabase.com/docs/guides/api/using-custom-schemas

-- ============================================================================
-- Grant USAGE on schemas
-- ============================================================================

GRANT USAGE ON SCHEMA investor TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA landlord TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA crm TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA integrations TO anon, authenticated, service_role;

-- ============================================================================
-- Grant EXECUTE on all routines in these schemas
-- ============================================================================

GRANT ALL ON ALL ROUTINES IN SCHEMA investor TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA landlord TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA crm TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA integrations TO anon, authenticated, service_role;

-- ============================================================================
-- Set default privileges for future routines
-- ============================================================================

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA investor GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA landlord GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA crm GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA integrations GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- ============================================================================
-- Update PostgREST schema exposure
-- ============================================================================

-- This configures PostgREST to expose functions from all these schemas
-- The client uses .schema('investor').rpc('function_name') to call them
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, investor, landlord, crm, integrations';

-- Notify PostgREST to reload configuration
NOTIFY pgrst, 'reload config';

-- ============================================================================
-- Drop wrapper functions from public schema (cleanup)
-- ============================================================================
-- These were a temporary workaround; the proper solution is schema exposure

-- Investor wrappers
DROP FUNCTION IF EXISTS public.get_deals_with_lead(UUID, TEXT, TEXT, BOOLEAN, TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_deal_by_id(UUID);
DROP FUNCTION IF EXISTS public.get_property_deals(UUID);
DROP FUNCTION IF EXISTS public.get_nudge_deals(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.get_properties_with_lead(UUID[]);
DROP FUNCTION IF EXISTS public.get_conversations_with_lead(UUID, UUID[]);
DROP FUNCTION IF EXISTS public.get_investor_conversation_by_id(UUID);
DROP FUNCTION IF EXISTS public.get_mail_history(UUID, TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_mail_history_stats(UUID);

-- Landlord wrappers
DROP FUNCTION IF EXISTS public.get_bookings_with_contact(UUID, UUID, TEXT[], TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_booking_by_id(UUID);
DROP FUNCTION IF EXISTS public.get_upcoming_bookings(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.get_conversations_with_contact(UUID, UUID[]);
DROP FUNCTION IF EXISTS public.get_landlord_conversation_by_id(UUID);

-- CRM wrappers
DROP FUNCTION IF EXISTS public.get_skip_trace_results(UUID, UUID, UUID, UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_skip_trace_result_by_id(UUID);

-- Integrations wrappers
DROP FUNCTION IF EXISTS public.get_access_codes_with_booking(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS public.get_access_codes_by_property(UUID);
