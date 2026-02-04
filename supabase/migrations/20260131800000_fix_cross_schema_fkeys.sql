-- Migration: Fix Cross-Schema Foreign Key Constraints
-- The previous migration (20260131700002) may have failed silently
-- This migration robustly creates the FK constraints with proper error handling

BEGIN;

-- ============================================================================
-- investor.deals_pipeline -> crm.leads
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'investor' AND table_name = 'deals_pipeline' AND column_name = 'lead_id'
  ) THEN
    ALTER TABLE investor.deals_pipeline DROP CONSTRAINT IF EXISTS investor_deals_pipeline_lead_id_fkey;
    ALTER TABLE investor.deals_pipeline
      ADD CONSTRAINT investor_deals_pipeline_lead_id_fkey
      FOREIGN KEY (lead_id) REFERENCES crm.leads(id) ON DELETE SET NULL;
    RAISE NOTICE 'Created investor_deals_pipeline_lead_id_fkey';
  END IF;
END $$;

-- ============================================================================
-- investor.conversations -> crm.leads
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'investor' AND table_name = 'conversations' AND column_name = 'lead_id'
  ) THEN
    ALTER TABLE investor.conversations DROP CONSTRAINT IF EXISTS investor_conversations_lead_id_fkey;
    ALTER TABLE investor.conversations
      ADD CONSTRAINT investor_conversations_lead_id_fkey
      FOREIGN KEY (lead_id) REFERENCES crm.leads(id) ON DELETE SET NULL;
    RAISE NOTICE 'Created investor_conversations_lead_id_fkey';
  END IF;
END $$;

-- ============================================================================
-- investor.properties -> crm.leads
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'investor' AND table_name = 'properties' AND column_name = 'lead_id'
  ) THEN
    ALTER TABLE investor.properties DROP CONSTRAINT IF EXISTS investor_properties_lead_id_fkey;
    ALTER TABLE investor.properties
      ADD CONSTRAINT investor_properties_lead_id_fkey
      FOREIGN KEY (lead_id) REFERENCES crm.leads(id) ON DELETE SET NULL;
    RAISE NOTICE 'Created investor_properties_lead_id_fkey';
  END IF;
END $$;

-- ============================================================================
-- investor.drip_enrollments -> crm.contacts
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'investor' AND table_name = 'drip_enrollments' AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE investor.drip_enrollments DROP CONSTRAINT IF EXISTS investor_drip_enrollments_contact_id_fkey;
    ALTER TABLE investor.drip_enrollments
      ADD CONSTRAINT investor_drip_enrollments_contact_id_fkey
      FOREIGN KEY (contact_id) REFERENCES crm.contacts(id) ON DELETE CASCADE;
    RAISE NOTICE 'Created investor_drip_enrollments_contact_id_fkey';
  END IF;
END $$;

-- ============================================================================
-- landlord.conversations -> crm.contacts
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'landlord' AND table_name = 'conversations' AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE landlord.conversations DROP CONSTRAINT IF EXISTS landlord_conversations_contact_id_fkey;
    ALTER TABLE landlord.conversations
      ADD CONSTRAINT landlord_conversations_contact_id_fkey
      FOREIGN KEY (contact_id) REFERENCES crm.contacts(id) ON DELETE SET NULL;
    RAISE NOTICE 'Created landlord_conversations_contact_id_fkey';
  END IF;
END $$;

-- ============================================================================
-- landlord.bookings -> crm.contacts
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'landlord' AND table_name = 'bookings' AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE landlord.bookings DROP CONSTRAINT IF EXISTS landlord_bookings_contact_id_fkey;
    ALTER TABLE landlord.bookings
      ADD CONSTRAINT landlord_bookings_contact_id_fkey
      FOREIGN KEY (contact_id) REFERENCES crm.contacts(id) ON DELETE SET NULL;
    RAISE NOTICE 'Created landlord_bookings_contact_id_fkey';
  END IF;
END $$;

-- ============================================================================
-- crm.skip_trace_results -> investor.properties (property_id)
-- Skip tracing is an investor platform feature for finding property owner data
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'crm' AND table_name = 'skip_trace_results' AND column_name = 'property_id'
  ) THEN
    ALTER TABLE crm.skip_trace_results DROP CONSTRAINT IF EXISTS crm_skip_trace_results_property_id_fkey;
    ALTER TABLE crm.skip_trace_results
      ADD CONSTRAINT crm_skip_trace_results_property_id_fkey
      FOREIGN KEY (property_id) REFERENCES investor.properties(id) ON DELETE SET NULL;
    RAISE NOTICE 'Created crm_skip_trace_results_property_id_fkey';
  END IF;
END $$;

-- ============================================================================
-- crm.skip_trace_results -> investor.properties (matched_property_id)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'crm' AND table_name = 'skip_trace_results' AND column_name = 'matched_property_id'
  ) THEN
    ALTER TABLE crm.skip_trace_results DROP CONSTRAINT IF EXISTS crm_skip_trace_results_matched_property_id_fkey;
    ALTER TABLE crm.skip_trace_results
      ADD CONSTRAINT crm_skip_trace_results_matched_property_id_fkey
      FOREIGN KEY (matched_property_id) REFERENCES investor.properties(id) ON DELETE SET NULL;
    RAISE NOTICE 'Created crm_skip_trace_results_matched_property_id_fkey';
  END IF;
END $$;

-- ============================================================================
-- public.calls -> crm.contacts
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'calls' AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE public.calls DROP CONSTRAINT IF EXISTS calls_contact_id_fkey;
    ALTER TABLE public.calls
      ADD CONSTRAINT calls_contact_id_fkey
      FOREIGN KEY (contact_id) REFERENCES crm.contacts(id) ON DELETE SET NULL;
    RAISE NOTICE 'Created calls_contact_id_fkey';
  END IF;
END $$;

-- ============================================================================
-- Reload PostgREST schema cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';

COMMIT;
