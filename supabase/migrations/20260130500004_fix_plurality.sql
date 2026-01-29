-- Migration: Fix Plurality Issues
-- Phase 5: Fix plurality and other naming inconsistencies
-- Date: 2026-01-30
--
-- This migration fixes plurality issues and other naming inconsistencies:
-- - user_mfa_pending_setup → user_mfa_pending_setups
-- - user_onboarding_status → user_onboarding_statuses
-- - user_retention → user_retention_records

BEGIN;

-- ============================================================================
-- STEP 1: Fix user table plurality
-- ============================================================================

-- user_mfa_pending_setup → user_mfa_pending_setups
ALTER TABLE IF EXISTS public.user_mfa_pending_setup
  RENAME TO user_mfa_pending_setups;

-- user_onboarding_status → user_onboarding_statuses
ALTER TABLE IF EXISTS public.user_onboarding_status
  RENAME TO user_onboarding_statuses;

-- user_retention → user_retention_records
ALTER TABLE IF EXISTS public.user_retention
  RENAME TO user_retention_records;

-- ============================================================================
-- STEP 2: Update RLS policies for renamed tables
-- ============================================================================

-- RLS for user_mfa_pending_setups
DROP POLICY IF EXISTS "user_mfa_pending_setup_select_policy" ON public.user_mfa_pending_setups;
DROP POLICY IF EXISTS "user_mfa_pending_setup_insert_policy" ON public.user_mfa_pending_setups;
DROP POLICY IF EXISTS "user_mfa_pending_setup_update_policy" ON public.user_mfa_pending_setups;
DROP POLICY IF EXISTS "user_mfa_pending_setup_delete_policy" ON public.user_mfa_pending_setups;

CREATE POLICY "user_mfa_pending_setups_select_policy" ON public.user_mfa_pending_setups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_mfa_pending_setups_insert_policy" ON public.user_mfa_pending_setups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_mfa_pending_setups_update_policy" ON public.user_mfa_pending_setups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_mfa_pending_setups_delete_policy" ON public.user_mfa_pending_setups
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for user_onboarding_statuses
DROP POLICY IF EXISTS "user_onboarding_status_select_policy" ON public.user_onboarding_statuses;
DROP POLICY IF EXISTS "user_onboarding_status_insert_policy" ON public.user_onboarding_statuses;
DROP POLICY IF EXISTS "user_onboarding_status_update_policy" ON public.user_onboarding_statuses;
DROP POLICY IF EXISTS "user_onboarding_status_delete_policy" ON public.user_onboarding_statuses;

CREATE POLICY "user_onboarding_statuses_select_policy" ON public.user_onboarding_statuses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_onboarding_statuses_insert_policy" ON public.user_onboarding_statuses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_onboarding_statuses_update_policy" ON public.user_onboarding_statuses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_onboarding_statuses_delete_policy" ON public.user_onboarding_statuses
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for user_retention_records
-- Note: This is an analytics/aggregate table with cohort data (no user_id column)
-- Authenticated users can read for dashboards; service role manages writes
DROP POLICY IF EXISTS "user_retention_select_policy" ON public.user_retention_records;
DROP POLICY IF EXISTS "user_retention_insert_policy" ON public.user_retention_records;
DROP POLICY IF EXISTS "user_retention_update_policy" ON public.user_retention_records;
DROP POLICY IF EXISTS "user_retention_delete_policy" ON public.user_retention_records;

CREATE POLICY "user_retention_records_select_policy" ON public.user_retention_records
  FOR SELECT USING (auth.role() = 'authenticated');

-- Service role handles INSERT/UPDATE/DELETE for analytics jobs
CREATE POLICY "user_retention_records_service_role_policy" ON public.user_retention_records
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- STEP 3: Rename indexes
-- ============================================================================

ALTER INDEX IF EXISTS user_mfa_pending_setup_pkey RENAME TO user_mfa_pending_setups_pkey;
ALTER INDEX IF EXISTS user_onboarding_status_pkey RENAME TO user_onboarding_statuses_pkey;
ALTER INDEX IF EXISTS user_retention_pkey RENAME TO user_retention_records_pkey;

-- ============================================================================
-- STEP 4: Add comments
-- ============================================================================

COMMENT ON TABLE public.user_mfa_pending_setups IS 'Pending MFA setups (formerly user_mfa_pending_setup)';
COMMENT ON TABLE public.user_onboarding_statuses IS 'User onboarding status records (formerly user_onboarding_status)';
COMMENT ON TABLE public.user_retention_records IS 'User retention tracking (formerly user_retention)';

COMMIT;
