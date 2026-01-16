-- Migration: Add Row Level Security to api_keys table
-- Description: Secure API keys so users can only access their own keys
-- Critical: This table contains encrypted third-party API credentials

-- Enable RLS on api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can view their own API keys
CREATE POLICY "Users can view their own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own API keys
CREATE POLICY "Users can insert their own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own API keys
CREATE POLICY "Users can update their own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own API keys
CREATE POLICY "Users can delete their own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Admin override: support can view (but not modify) all API keys
CREATE POLICY "Admins can view all API keys"
  ON api_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );

-- Log the migration
INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Added RLS policies to api_keys table',
  jsonb_build_object(
    'migration', '20260116_add_rls_api_keys',
    'policies_created', 5,
    'tables_secured', ARRAY['api_keys']
  )
);
