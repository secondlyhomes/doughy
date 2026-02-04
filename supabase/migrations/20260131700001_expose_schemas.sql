-- Migration: Expose Custom Schemas to PostgREST API
-- This grants full permissions to the Supabase roles for all domain schemas
-- IMPORTANT: You must also add these schemas to the Supabase Dashboard:
--   Project Settings → API → Exposed schemas → Add: investor, landlord, ai, crm, integrations

BEGIN;

-- ============================================================================
-- INVESTOR schema permissions
-- NOTE: anon only gets SELECT - RLS policies still apply for actual access control
-- authenticated and service_role get full permissions
-- ============================================================================
GRANT USAGE ON SCHEMA investor TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA investor TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA investor TO authenticated, service_role;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA investor TO anon, authenticated, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA investor TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA investor TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA investor GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA investor GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA investor GRANT EXECUTE ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA investor GRANT USAGE ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA investor GRANT ALL ON SEQUENCES TO authenticated, service_role;

-- ============================================================================
-- LANDLORD schema permissions
-- NOTE: anon only gets SELECT - RLS policies still apply for actual access control
-- ============================================================================
GRANT USAGE ON SCHEMA landlord TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA landlord TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA landlord TO authenticated, service_role;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA landlord TO anon, authenticated, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA landlord TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA landlord TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA landlord GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA landlord GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA landlord GRANT EXECUTE ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA landlord GRANT USAGE ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA landlord GRANT ALL ON SEQUENCES TO authenticated, service_role;

-- ============================================================================
-- AI schema permissions
-- NOTE: anon only gets SELECT - RLS policies still apply for actual access control
-- ============================================================================
GRANT USAGE ON SCHEMA ai TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA ai TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA ai TO authenticated, service_role;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA ai TO anon, authenticated, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA ai TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ai TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA ai GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA ai GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA ai GRANT EXECUTE ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA ai GRANT USAGE ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA ai GRANT ALL ON SEQUENCES TO authenticated, service_role;

-- ============================================================================
-- CRM schema permissions
-- NOTE: anon only gets SELECT - RLS policies still apply for actual access control
-- ============================================================================
GRANT USAGE ON SCHEMA crm TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA crm TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA crm TO authenticated, service_role;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA crm TO anon, authenticated, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA crm TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA crm TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA crm GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA crm GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA crm GRANT EXECUTE ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA crm GRANT USAGE ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA crm GRANT ALL ON SEQUENCES TO authenticated, service_role;

-- ============================================================================
-- INTEGRATIONS schema permissions
-- NOTE: anon only gets SELECT - RLS policies still apply for actual access control
-- ============================================================================
GRANT USAGE ON SCHEMA integrations TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA integrations TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA integrations TO authenticated, service_role;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA integrations TO anon, authenticated, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA integrations TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA integrations TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA integrations GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA integrations GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA integrations GRANT EXECUTE ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA integrations GRANT USAGE ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA integrations GRANT ALL ON SEQUENCES TO authenticated, service_role;

COMMIT;
