-- Migration: Fix lead soft-delete cascade
-- Date: 2026-01-31
-- Description: The handle_lead_deletion trigger was using wrong column name (lead_deleted
-- instead of is_lead_deleted). This fixes the trigger and ensures the columns exist
-- on comms_call_transcripts and comms_messages for proper soft-delete cascade.
--
-- When a lead is deleted:
-- 1. Related records keep their lead_id (FK is ON DELETE SET NULL, but we mark before that)
-- 2. is_lead_deleted is set to TRUE
-- 3. lead_deleted_at records the timestamp
-- 4. lead_deleted_by records who deleted it
--
-- This provides a richer audit trail than just ON DELETE SET NULL alone.

BEGIN;

-- ============================================================================
-- STEP 1: Add soft-delete cascade columns to comms_call_transcripts
-- ============================================================================

ALTER TABLE public.comms_call_transcripts
  ADD COLUMN IF NOT EXISTS is_lead_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS lead_deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lead_deleted_by UUID REFERENCES auth.users(id);

COMMENT ON COLUMN public.comms_call_transcripts.is_lead_deleted IS 'Whether the parent lead was deleted';
COMMENT ON COLUMN public.comms_call_transcripts.lead_deleted_at IS 'When the parent lead was deleted';
COMMENT ON COLUMN public.comms_call_transcripts.lead_deleted_by IS 'Who deleted the parent lead';

-- Partial index for filtering orphaned records efficiently
CREATE INDEX IF NOT EXISTS idx_comms_call_transcripts_is_lead_deleted
  ON public.comms_call_transcripts(is_lead_deleted) WHERE is_lead_deleted = TRUE;

-- ============================================================================
-- STEP 2: Add soft-delete cascade columns to comms_messages
-- ============================================================================

ALTER TABLE public.comms_messages
  ADD COLUMN IF NOT EXISTS is_lead_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS lead_deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lead_deleted_by UUID REFERENCES auth.users(id);

COMMENT ON COLUMN public.comms_messages.is_lead_deleted IS 'Whether the parent lead was deleted';
COMMENT ON COLUMN public.comms_messages.lead_deleted_at IS 'When the parent lead was deleted';
COMMENT ON COLUMN public.comms_messages.lead_deleted_by IS 'Who deleted the parent lead';

-- Partial index for filtering orphaned records efficiently
CREATE INDEX IF NOT EXISTS idx_comms_messages_is_lead_deleted
  ON public.comms_messages(is_lead_deleted) WHERE is_lead_deleted = TRUE;

-- ============================================================================
-- STEP 3: Create the trigger function with CORRECT column names
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_lead_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark comms_call_transcripts as from deleted lead
  UPDATE comms_call_transcripts
  SET
    is_lead_deleted = TRUE,
    lead_deleted_at = NOW(),
    lead_deleted_by = auth.uid()
  WHERE lead_id = OLD.id;

  -- Mark comms_messages as from deleted lead
  UPDATE comms_messages
  SET
    is_lead_deleted = TRUE,
    lead_deleted_at = NOW(),
    lead_deleted_by = auth.uid()
  WHERE lead_id = OLD.id;

  RETURN OLD;
END;
$$;

-- ============================================================================
-- STEP 4: Create the trigger on crm_leads
-- ============================================================================

DROP TRIGGER IF EXISTS before_lead_delete ON public.crm_leads;
CREATE TRIGGER before_lead_delete
  BEFORE DELETE ON public.crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION handle_lead_deletion();

COMMIT;
