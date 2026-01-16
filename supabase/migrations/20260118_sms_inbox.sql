-- Migration: Create SMS Inbox Table
-- Description: Store incoming SMS messages for AI processing and lead creation
-- Phase: Sprint 3 - AI & Automation

-- ============================================================================
-- CREATE SMS INBOX TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS sms_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  message_body TEXT NOT NULL,
  twilio_message_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK(status IN ('pending_review', 'processing', 'processed', 'ignored', 'error')),
  parsed_data JSONB DEFAULT '{}', -- Extracted lead/property data from AI
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL, -- If converted to lead
  error_message TEXT, -- If processing failed
  processed_by UUID REFERENCES auth.users(id), -- Who processed/reviewed it
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for querying by status (most common query)
CREATE INDEX idx_sms_inbox_status ON sms_inbox(status);

-- Index for recent messages (dashboard view)
CREATE INDEX idx_sms_inbox_created ON sms_inbox(created_at DESC);

-- Index for finding messages by phone number
CREATE INDEX idx_sms_inbox_phone ON sms_inbox(phone_number);

-- Composite index for pending messages
CREATE INDEX idx_sms_inbox_pending
  ON sms_inbox(created_at DESC)
  WHERE status = 'pending_review';

-- Index for processed messages
CREATE INDEX idx_sms_inbox_processed
  ON sms_inbox(processed_at DESC)
  WHERE status IN ('processed', 'ignored');

-- Index for error messages
CREATE INDEX idx_sms_inbox_errors
  ON sms_inbox(created_at DESC)
  WHERE status = 'error';

-- GIN index for searching parsed data
CREATE INDEX idx_sms_inbox_parsed_data_gin ON sms_inbox USING GIN(parsed_data);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE sms_inbox ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view SMS inbox
CREATE POLICY "Authenticated users can view SMS inbox"
  ON sms_inbox FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can insert (webhook uses service role key)
CREATE POLICY "Admins can insert SMS messages"
  ON sms_inbox FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update SMS messages
CREATE POLICY "Admins can update SMS messages"
  ON sms_inbox FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete SMS messages
CREATE POLICY "Admins can delete SMS messages"
  ON sms_inbox FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE sms_inbox IS 'Stores incoming SMS messages from Twilio webhook for AI processing and lead creation';
COMMENT ON COLUMN sms_inbox.phone_number IS 'Sender phone number from Twilio (From field)';
COMMENT ON COLUMN sms_inbox.message_body IS 'Raw SMS message text from Twilio (Body field)';
COMMENT ON COLUMN sms_inbox.twilio_message_id IS 'Unique Twilio MessageSid for deduplication';
COMMENT ON COLUMN sms_inbox.status IS 'Processing status: pending_review, processing, processed, ignored, error';
COMMENT ON COLUMN sms_inbox.parsed_data IS 'JSONB field containing AI-extracted lead/property data';
COMMENT ON COLUMN sms_inbox.lead_id IS 'If SMS was converted to a lead, reference to that lead';
COMMENT ON COLUMN sms_inbox.error_message IS 'Error details if processing failed';
COMMENT ON COLUMN sms_inbox.processed_by IS 'User ID who processed/reviewed this message';

-- ============================================================================
-- VALIDATION CONSTRAINTS
-- ============================================================================

-- If status is processed, processed_at should be set
ALTER TABLE sms_inbox
ADD CONSTRAINT check_sms_processed_at
  CHECK (
    (status != 'processed' OR processed_at IS NOT NULL)
  );

-- If status is error, error_message should be set
ALTER TABLE sms_inbox
ADD CONSTRAINT check_sms_error_message
  CHECK (
    (status != 'error' OR error_message IS NOT NULL)
  );

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_sms_inbox_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_sms_inbox_updated_at
  BEFORE UPDATE ON sms_inbox
  FOR EACH ROW
  EXECUTE FUNCTION update_sms_inbox_updated_at();

-- ============================================================================
-- AUTO-SET processed_at TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION set_sms_processed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to processed or ignored, set processed_at
  IF (NEW.status IN ('processed', 'ignored') AND OLD.status NOT IN ('processed', 'ignored')) THEN
    NEW.processed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_set_sms_processed_at
  BEFORE UPDATE ON sms_inbox
  FOR EACH ROW
  WHEN (NEW.status IN ('processed', 'ignored') AND OLD.status NOT IN ('processed', 'ignored'))
  EXECUTE FUNCTION set_sms_processed_at();

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Created SMS inbox table for processing incoming Twilio messages',
  jsonb_build_object(
    'migration', '20260118_sms_inbox',
    'table', 'sms_inbox',
    'indexes', 7,
    'rls_policies', 4,
    'triggers', 2,
    'statuses', ARRAY['pending_review', 'processing', 'processed', 'ignored', 'error'],
    'purpose', 'Store and process incoming SMS messages from Twilio webhook for AI lead extraction'
  )
);
