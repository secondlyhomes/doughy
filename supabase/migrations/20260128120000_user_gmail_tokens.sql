-- Migration: Create user_gmail_tokens table for MoltBot Gmail integration
-- This stores OAuth tokens and watch metadata for Gmail Pub/Sub integration

-- Create the user_gmail_tokens table
CREATE TABLE IF NOT EXISTS user_gmail_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- OAuth tokens (should be encrypted at rest by Supabase)
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,

  -- Gmail account info
  gmail_email TEXT NOT NULL,

  -- Gmail watch state
  history_id TEXT NOT NULL DEFAULT '0',
  watch_expiration TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on gmail_email for webhook lookups
CREATE INDEX IF NOT EXISTS idx_user_gmail_tokens_email ON user_gmail_tokens(gmail_email);

-- Create index on watch_expiration for renewal cron
CREATE INDEX IF NOT EXISTS idx_user_gmail_tokens_watch_expiration ON user_gmail_tokens(watch_expiration);

-- Enable RLS
ALTER TABLE user_gmail_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only access their own tokens
CREATE POLICY "Users can view own gmail tokens"
  ON user_gmail_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gmail tokens"
  ON user_gmail_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gmail tokens"
  ON user_gmail_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own gmail tokens"
  ON user_gmail_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can access all tokens (for webhook processing)
CREATE POLICY "Service role can access all gmail tokens"
  ON user_gmail_tokens FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_gmail_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_gmail_tokens_updated_at
  BEFORE UPDATE ON user_gmail_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_user_gmail_tokens_updated_at();

-- Add comment
COMMENT ON TABLE user_gmail_tokens IS 'Stores Gmail OAuth tokens and watch metadata for MoltBot integration';
COMMENT ON COLUMN user_gmail_tokens.history_id IS 'Gmail history ID for incremental sync';
COMMENT ON COLUMN user_gmail_tokens.watch_expiration IS 'When the Gmail watch expires (7 days from creation)';
