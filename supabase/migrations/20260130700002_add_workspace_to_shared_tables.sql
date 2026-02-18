-- Migration: Add workspace_id to Shared/CRM Tables
-- Phase 1c: Add workspace_id column to shared tables
-- Date: 2026-01-30
--
-- DBA Best Practices Applied:
-- - Add columns as NULLABLE first (no downtime)
-- - Foreign key references to workspaces(id) for referential integrity
-- - Indexes on workspace_id for RLS query performance
-- - Comments documenting the column purpose
--
-- Tables Modified:
-- - crm_contacts
-- - comms_call_logs
-- - comms_call_transcripts

BEGIN;

-- ============================================================================
-- STEP 1: Add workspace_id column to shared tables
-- ============================================================================

-- crm_contacts - Shared contact database
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- comms_call_logs - Call history
ALTER TABLE public.comms_call_logs
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- comms_call_transcripts - Call transcriptions
ALTER TABLE public.comms_call_transcripts
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- ============================================================================
-- STEP 2: Create indexes for workspace_id (RLS performance)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_crm_contacts_workspace_id
  ON public.crm_contacts(workspace_id);

CREATE INDEX IF NOT EXISTS idx_comms_call_logs_workspace_id
  ON public.comms_call_logs(workspace_id);

CREATE INDEX IF NOT EXISTS idx_comms_call_transcripts_workspace_id
  ON public.comms_call_transcripts(workspace_id);

-- ============================================================================
-- STEP 3: Add composite indexes for common query patterns
-- ============================================================================

-- Contacts by workspace (for listing/searching)
CREATE INDEX IF NOT EXISTS idx_crm_contacts_workspace_name
  ON public.crm_contacts(workspace_id, last_name, first_name);

-- Call logs by workspace and date
CREATE INDEX IF NOT EXISTS idx_comms_call_logs_workspace_date
  ON public.comms_call_logs(workspace_id, created_at DESC);

-- ============================================================================
-- STEP 4: Add column comments for documentation
-- ============================================================================

COMMENT ON COLUMN public.crm_contacts.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.comms_call_logs.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.comms_call_transcripts.workspace_id IS 'Team workspace for multi-tenant access control';

COMMIT;
