-- Migration: Standardize Boolean Column Names
-- Date: 2026-01-31
-- Description: Rename has_* columns to is_* pattern for consistency

BEGIN;

-- Rename has_* to is_* pattern (using DO blocks to handle missing tables/columns)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'crm_contact_touches'
               AND column_name = 'has_responded'
               AND table_schema = 'public') THEN
        ALTER TABLE crm_contact_touches RENAME COLUMN has_responded TO is_response_received;
        COMMENT ON COLUMN crm_contact_touches.is_response_received IS 'Whether contact has responded (renamed from has_responded)';
    END IF;
END$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'crm_leads'
               AND column_name = 'has_conversation'
               AND table_schema = 'public') THEN
        ALTER TABLE crm_leads RENAME COLUMN has_conversation TO is_conversation_started;
        COMMENT ON COLUMN crm_leads.is_conversation_started IS 'Whether conversation exists (renamed from has_conversation)';
    END IF;
END$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'investor_properties'
               AND column_name = 'has_hoa'
               AND table_schema = 'public') THEN
        ALTER TABLE investor_properties RENAME COLUMN has_hoa TO is_hoa_present;
        COMMENT ON COLUMN investor_properties.is_hoa_present IS 'Property has HOA (renamed from has_hoa)';
    END IF;
END$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'landlord_rooms'
               AND column_name = 'has_private_bath'
               AND table_schema = 'public') THEN
        ALTER TABLE landlord_rooms RENAME COLUMN has_private_bath TO is_private_bath;
        COMMENT ON COLUMN landlord_rooms.is_private_bath IS 'Room has private bathroom (renamed from has_private_bath)';
    END IF;
END$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'landlord_rooms'
               AND column_name = 'has_private_entrance'
               AND table_schema = 'public') THEN
        ALTER TABLE landlord_rooms RENAME COLUMN has_private_entrance TO is_private_entrance;
        COMMENT ON COLUMN landlord_rooms.is_private_entrance IS 'Room has private entrance (renamed from has_private_entrance)';
    END IF;
END$$;

COMMIT;
