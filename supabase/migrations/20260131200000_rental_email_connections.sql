-- Migration: Create rental_email_connections table for MoltBot Gmail/Email Integration
-- Description: Workspace-scoped email connections for scanning rental platform emails
-- Date: 2026-01-31
--
-- DBA Best Practices Applied:
-- - rental_* prefix for landlord domain tables
-- - workspace_id for team multi-tenancy (shared inbox)
-- - user_id for audit trail (who created)
-- - ENUM type for provider
-- - is_ prefix for booleans
-- - Proper indexes for RLS performance
-- - Encrypted token storage (tokens encrypted at application layer)
--
-- Security Note: OAuth tokens should be encrypted before storing.
-- This table stores encrypted tokens - decryption happens in edge functions.

BEGIN;

-- ============================================================================
-- STEP 1: Create ENUM type for email provider
-- ============================================================================

CREATE TYPE rental_email_provider AS ENUM (
  'gmail',
  'outlook',
  'forwarding'
);

COMMENT ON TYPE rental_email_provider IS 'Email provider types for MoltBot inbox integration';

-- ============================================================================
-- STEP 2: Create rental_email_connections table
-- ============================================================================

CREATE TABLE IF NOT EXISTS rental_email_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy (team sharing)
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Audit trail (who created this connection)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Connection details
  provider rental_email_provider NOT NULL,
  email_address TEXT NOT NULL,

  -- OAuth tokens (encrypted at application layer before storing)
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Sync state
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_message_id TEXT, -- Gmail message ID to track what's been processed
  sync_error TEXT, -- Last error message if sync failed

  -- Platform detection (what platforms we've seen emails from)
  detected_platforms JSONB NOT NULL DEFAULT '[]'::JSONB,
  -- Example: ["airbnb", "furnishedfinder", "zillow"]

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  -- Only one connection per workspace per provider
  CONSTRAINT unique_workspace_provider UNIQUE(workspace_id, provider)
);

-- ============================================================================
-- STEP 3: Create indexes for query performance
-- ============================================================================

-- Index on workspace_id for RLS queries
CREATE INDEX idx_rental_email_connections_workspace_id
  ON rental_email_connections(workspace_id);

-- Index on user_id for audit queries
CREATE INDEX idx_rental_email_connections_user_id
  ON rental_email_connections(user_id);

-- Composite index for common query pattern: active connections by workspace
CREATE INDEX idx_rental_email_connections_workspace_active
  ON rental_email_connections(workspace_id, is_active)
  WHERE is_active = true;

-- Index for finding connections that need sync (cron job query)
CREATE INDEX idx_rental_email_connections_needs_sync
  ON rental_email_connections(last_sync_at, is_active)
  WHERE is_active = true;

-- ============================================================================
-- STEP 4: Create auto-set workspace_id trigger
-- ============================================================================

-- Trigger to auto-set workspace_id from user's workspace if not provided
CREATE TRIGGER set_workspace_id_rental_email_connections
  BEFORE INSERT ON rental_email_connections
  FOR EACH ROW EXECUTE FUNCTION set_workspace_id_from_user();

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER update_rental_email_connections_updated_at
  BEFORE UPDATE ON rental_email_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 5: Enable RLS and create policies
-- ============================================================================

ALTER TABLE rental_email_connections ENABLE ROW LEVEL SECURITY;

-- SELECT: All workspace members can view email connections
CREATE POLICY "rental_email_connections_workspace_select"
  ON rental_email_connections FOR SELECT
  USING (workspace_id IN (SELECT user_workspace_ids()));

-- INSERT: All workspace members can add email connections
CREATE POLICY "rental_email_connections_workspace_insert"
  ON rental_email_connections FOR INSERT
  WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

-- UPDATE: All workspace members can update email connections
CREATE POLICY "rental_email_connections_workspace_update"
  ON rental_email_connections FOR UPDATE
  USING (workspace_id IN (SELECT user_workspace_ids()));

-- DELETE: Only workspace owners can delete email connections
CREATE POLICY "rental_email_connections_workspace_delete"
  ON rental_email_connections FOR DELETE
  USING (workspace_id IN (SELECT user_owned_workspace_ids()));

-- Service role can access all (for edge functions)
CREATE POLICY "rental_email_connections_service_role"
  ON rental_email_connections FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- STEP 6: Add column comments for documentation
-- ============================================================================

COMMENT ON TABLE rental_email_connections IS 'Email provider connections for MoltBot inbox integration (workspace-scoped)';

COMMENT ON COLUMN rental_email_connections.workspace_id IS 'Team workspace for multi-tenant access control - entire team shares the inbox';
COMMENT ON COLUMN rental_email_connections.user_id IS 'User who created this connection (audit trail)';
COMMENT ON COLUMN rental_email_connections.provider IS 'Email provider: gmail, outlook, or forwarding';
COMMENT ON COLUMN rental_email_connections.email_address IS 'Connected email address';
COMMENT ON COLUMN rental_email_connections.access_token_encrypted IS 'OAuth access token (encrypted at app layer)';
COMMENT ON COLUMN rental_email_connections.refresh_token_encrypted IS 'OAuth refresh token (encrypted at app layer)';
COMMENT ON COLUMN rental_email_connections.token_expires_at IS 'When the access token expires';
COMMENT ON COLUMN rental_email_connections.is_active IS 'Whether this connection is currently active';
COMMENT ON COLUMN rental_email_connections.last_sync_at IS 'When we last checked for new emails';
COMMENT ON COLUMN rental_email_connections.last_message_id IS 'Gmail history ID or message ID for incremental sync';
COMMENT ON COLUMN rental_email_connections.sync_error IS 'Last sync error message if any';
COMMENT ON COLUMN rental_email_connections.detected_platforms IS 'Rental platforms detected from scanned emails';

-- ============================================================================
-- STEP 7: Add send_status and send_error columns to landlord_messages
-- ============================================================================
-- These columns track the email delivery status for the lead-response-sender

-- Check if columns exist before adding (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landlord_messages' AND column_name = 'send_status'
  ) THEN
    ALTER TABLE landlord_messages ADD COLUMN send_status TEXT DEFAULT NULL;
    COMMENT ON COLUMN landlord_messages.send_status IS 'Email send status: pending, sending, sent, failed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landlord_messages' AND column_name = 'send_error'
  ) THEN
    ALTER TABLE landlord_messages ADD COLUMN send_error TEXT DEFAULT NULL;
    COMMENT ON COLUMN landlord_messages.send_error IS 'Error message if send_status is failed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landlord_messages' AND column_name = 'external_message_id'
  ) THEN
    ALTER TABLE landlord_messages ADD COLUMN external_message_id TEXT DEFAULT NULL;
    COMMENT ON COLUMN landlord_messages.external_message_id IS 'External ID from email provider (e.g., Resend message ID, Gmail message ID)';
  END IF;
END $$;

-- Index for finding messages that need to be sent
CREATE INDEX IF NOT EXISTS idx_landlord_messages_send_status
  ON landlord_messages(send_status)
  WHERE send_status IN ('pending', 'sending');

-- ============================================================================
-- STEP 8: Add external_message_id to landlord_conversations
-- ============================================================================
-- Track external thread/conversation IDs for deduplication

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'landlord_conversations' AND column_name = 'external_message_id'
  ) THEN
    ALTER TABLE landlord_conversations ADD COLUMN external_message_id TEXT DEFAULT NULL;
    COMMENT ON COLUMN landlord_conversations.external_message_id IS 'External message ID for deduplication (e.g., Gmail message ID)';
  END IF;
END $$;

-- Index for deduplication lookups
CREATE INDEX IF NOT EXISTS idx_landlord_conversations_external_message_id
  ON landlord_conversations(external_message_id)
  WHERE external_message_id IS NOT NULL;

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Created rental_email_connections table for MoltBot email integration',
  jsonb_build_object(
    'migration', '20260131200000_rental_email_connections',
    'tables_created', ARRAY['rental_email_connections'],
    'columns_added', ARRAY['landlord_messages.send_status', 'landlord_messages.send_error', 'landlord_messages.external_message_id', 'landlord_conversations.external_message_id'],
    'enums_created', ARRAY['rental_email_provider'],
    'note', 'Workspace-scoped email connections for Gmail API integration'
  )
);

COMMIT;
