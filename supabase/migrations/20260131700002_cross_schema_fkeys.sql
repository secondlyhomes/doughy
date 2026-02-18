-- Migration: Fix Cross-Schema Foreign Key References
-- Updates foreign keys to correctly reference tables in other schemas
-- This allows PostgREST to properly detect cross-schema relationships

BEGIN;

-- ============================================================================
-- INVESTOR schema foreign keys to CRM schema
-- ============================================================================

-- investor.deals_pipeline -> crm.leads
ALTER TABLE investor.deals_pipeline
  DROP CONSTRAINT IF EXISTS investor_deals_pipeline_lead_id_fkey;
ALTER TABLE investor.deals_pipeline
  ADD CONSTRAINT investor_deals_pipeline_lead_id_fkey
  FOREIGN KEY (lead_id) REFERENCES crm.leads(id) ON DELETE SET NULL;

-- investor.conversations -> crm.leads
ALTER TABLE investor.conversations
  DROP CONSTRAINT IF EXISTS investor_conversations_lead_id_fkey;
ALTER TABLE investor.conversations
  ADD CONSTRAINT investor_conversations_lead_id_fkey
  FOREIGN KEY (lead_id) REFERENCES crm.leads(id) ON DELETE SET NULL;

-- investor.properties -> crm.leads
ALTER TABLE investor.properties
  DROP CONSTRAINT IF EXISTS investor_properties_lead_id_fkey;
ALTER TABLE investor.properties
  ADD CONSTRAINT investor_properties_lead_id_fkey
  FOREIGN KEY (lead_id) REFERENCES crm.leads(id) ON DELETE SET NULL;

-- investor.drip_enrollments -> crm.contacts
ALTER TABLE investor.drip_enrollments
  DROP CONSTRAINT IF EXISTS investor_drip_enrollments_contact_id_fkey;
ALTER TABLE investor.drip_enrollments
  ADD CONSTRAINT investor_drip_enrollments_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES crm.contacts(id) ON DELETE CASCADE;

-- ============================================================================
-- LANDLORD schema foreign keys to CRM schema
-- ============================================================================

-- landlord.conversations -> crm.contacts
ALTER TABLE landlord.conversations
  DROP CONSTRAINT IF EXISTS landlord_conversations_contact_id_fkey;
ALTER TABLE landlord.conversations
  ADD CONSTRAINT landlord_conversations_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES crm.contacts(id) ON DELETE SET NULL;

-- landlord.bookings -> crm.contacts
ALTER TABLE landlord.bookings
  DROP CONSTRAINT IF EXISTS landlord_bookings_contact_id_fkey;
ALTER TABLE landlord.bookings
  ADD CONSTRAINT landlord_bookings_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES crm.contacts(id) ON DELETE SET NULL;

-- ============================================================================
-- CRM schema internal foreign keys (skip_trace_results)
-- ============================================================================

-- crm.skip_trace_results -> crm.contacts
ALTER TABLE crm.skip_trace_results
  DROP CONSTRAINT IF EXISTS crm_skip_trace_results_contact_id_fkey;
ALTER TABLE crm.skip_trace_results
  ADD CONSTRAINT crm_skip_trace_results_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES crm.contacts(id) ON DELETE CASCADE;

-- crm.skip_trace_results -> crm.leads
ALTER TABLE crm.skip_trace_results
  DROP CONSTRAINT IF EXISTS crm_skip_trace_results_lead_id_fkey;
ALTER TABLE crm.skip_trace_results
  ADD CONSTRAINT crm_skip_trace_results_lead_id_fkey
  FOREIGN KEY (lead_id) REFERENCES crm.leads(id) ON DELETE CASCADE;

-- ============================================================================
-- Notify PostgREST to reload schema cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';

COMMIT;
