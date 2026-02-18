-- Migration: Fix Critical Column Issues
-- Date: 2026-01-31
-- Description: Remove duplicate columns and convert TEXT to ENUM types

BEGIN;

-- 1. Remove duplicate timestamp (inserted_at duplicates created_at)
ALTER TABLE crm_leads DROP COLUMN IF EXISTS inserted_at;

-- 2. Remove duplicate check-in/check-out columns (keep checkin_at/checkout_at pattern)
ALTER TABLE landlord_turnovers DROP COLUMN IF EXISTS check_in_time;
ALTER TABLE landlord_turnovers DROP COLUMN IF EXISTS check_out_time;

-- 3. Create proper ENUMs for investor_agents TEXT columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agent_relationship_status') THEN
        CREATE TYPE agent_relationship_status AS ENUM ('new', 'active', 'dormant', 'preferred');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commission_type') THEN
        CREATE TYPE commission_type AS ENUM ('flat_fee', 'percentage', 'referral_only');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_method') THEN
        CREATE TYPE contact_method AS ENUM ('email', 'phone', 'text');
    END IF;
END$$;

-- Convert TEXT columns to ENUM types (skip if already the correct type)
DO $$
DECLARE
    col_type text;
BEGIN
    -- Check relationship_status column type
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'investor_agents'
    AND column_name = 'relationship_status'
    AND table_schema = 'public';

    IF col_type = 'text' OR col_type = 'character varying' THEN
        ALTER TABLE investor_agents
          ALTER COLUMN relationship_status TYPE agent_relationship_status
          USING relationship_status::agent_relationship_status;
    END IF;
END$$;

DO $$
DECLARE
    col_type text;
BEGIN
    -- Check commission_preference column type
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'investor_agents'
    AND column_name = 'commission_preference'
    AND table_schema = 'public';

    IF col_type = 'text' OR col_type = 'character varying' THEN
        ALTER TABLE investor_agents
          ALTER COLUMN commission_preference TYPE commission_type
          USING commission_preference::commission_type;
    END IF;
END$$;

DO $$
DECLARE
    col_type text;
BEGIN
    -- Check preferred_contact_method column type
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'investor_agents'
    AND column_name = 'preferred_contact_method'
    AND table_schema = 'public';

    IF col_type = 'text' OR col_type = 'character varying' THEN
        ALTER TABLE investor_agents
          ALTER COLUMN preferred_contact_method TYPE contact_method
          USING preferred_contact_method::contact_method;
    END IF;
END$$;

COMMIT;
