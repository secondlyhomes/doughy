-- Migration: Fix Overly Permissive RLS Policies
-- Description: Replace policies that allow any user to access any data
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security

-- ============================================================================
-- Fix re_comps policies (real estate comparables)
-- Issue: Current policies allow ANY authenticated user to CRUD any comp
-- Fix: Restrict to workspace membership
-- ============================================================================

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Enable delete for all comps" ON public.re_comps;
DROP POLICY IF EXISTS "Enable insert for all comps" ON public.re_comps;
DROP POLICY IF EXISTS "Enable update for all comps" ON public.re_comps;
DROP POLICY IF EXISTS "Enable read access for all comps" ON public.re_comps;

-- Create proper workspace-scoped policies
CREATE POLICY "re_comps_select_workspace"
  ON public.re_comps
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "re_comps_insert_workspace"
  ON public.re_comps
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "re_comps_update_workspace"
  ON public.re_comps
  FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "re_comps_delete_workspace"
  ON public.re_comps
  FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Admin access for support purposes
CREATE POLICY "re_comps_admin_all"
  ON public.re_comps
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'support')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'support')
    )
  );

-- Service role access
CREATE POLICY "re_comps_service_role_all"
  ON public.re_comps
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Fix comms_messages update policy
-- Issue: "Users can update message status" allows ANY user to update ANY message
-- Fix: Restrict to messages associated with user's leads
-- ============================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can update message status" ON public.comms_messages;

-- Create proper ownership-based policy
CREATE POLICY "comms_messages_update_own"
  ON public.comms_messages
  FOR UPDATE
  TO authenticated
  USING (
    -- User can update messages for their own leads
    lead_id IN (
      SELECT l.id FROM crm_leads l
      JOIN workspace_members wm ON l.workspace_id = wm.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    lead_id IN (
      SELECT l.id FROM crm_leads l
      JOIN workspace_members wm ON l.workspace_id = wm.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- Admin update access
CREATE POLICY "comms_messages_admin_update"
  ON public.comms_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'support')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'support')
    )
  );

-- ============================================================================
-- Review system_logs insert policy (intentionally permissive)
-- "system_logs_insert_any" allows any user to insert logs
-- This is INTENTIONAL for logging purposes but we add a comment
-- ============================================================================

-- The system_logs_insert_any policy is intentionally permissive
-- to allow all parts of the system to log events.
-- No changes needed, but documenting the decision here.
COMMENT ON POLICY "system_logs_insert_any" ON public.system_logs IS
  'Intentionally permissive: allows any authenticated user to insert logs for debugging and audit purposes.';

-- ============================================================================
-- Review workspaces insert policy
-- "workspace_insert_authenticated" allows any authenticated user to create workspaces
-- This is INTENTIONAL for user onboarding
-- ============================================================================

-- The workspace_insert_authenticated policy is intentionally permissive
-- to allow new users to create their first workspace during onboarding.
-- No changes needed, but documenting the decision here.
COMMENT ON POLICY "workspace_insert_authenticated" ON public.workspaces IS
  'Intentionally permissive: allows any authenticated user to create a workspace for onboarding.';

-- ============================================================================
-- VERIFICATION QUERY (run after migration)
-- ============================================================================
-- SELECT tablename, policyname, permissive, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('re_comps', 'comms_messages')
-- ORDER BY tablename, policyname;
