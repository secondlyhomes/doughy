-- Migration: Expose Claw Schema to PostgREST API
-- The claw schema exists with RLS on all tables (auth.uid() = user_id),
-- but PostgREST can't see it without explicit GRANTs.
--
-- This follows the same pattern as 20260131700001_expose_schemas.sql (GRANTs)
-- and 20260201000009_expose_rpc_schemas.sql (pgrst.db_schemas).
--
-- VERIFY: After deploying, confirm 'claw' appears in:
--   Supabase Dashboard -> Project Settings -> API -> Exposed schemas

BEGIN;

-- ============================================================================
-- CLAW schema permissions
-- NOTE: anon only gets SELECT — RLS policies still apply for actual access control
-- authenticated and service_role get full permissions
-- ============================================================================
GRANT USAGE ON SCHEMA claw TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA claw TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA claw TO authenticated, service_role;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA claw TO anon, authenticated, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA claw TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA claw TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA claw GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA claw GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA claw GRANT EXECUTE ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA claw GRANT USAGE ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA claw GRANT ALL ON SEQUENCES TO authenticated, service_role;

-- ============================================================================
-- Update PostgREST schema exposure to include claw
-- Previous value (from 20260201000009): 'public, investor, landlord, crm, integrations'
-- ============================================================================
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, investor, landlord, crm, integrations, claw';

-- Notify PostgREST to reload configuration
NOTIFY pgrst, 'reload config';

COMMIT;
