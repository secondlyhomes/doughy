-- Migration: User Integrations
-- Stores API keys and configuration for third-party integrations (Seam, Tracerfy, etc.)

-- Create integration_provider enum
CREATE TYPE integration_provider AS ENUM (
  'seam',
  'tracerfy'
);

-- Create integration_status enum
CREATE TYPE integration_status AS ENUM (
  'connected',
  'disconnected',
  'error'
);

-- Create user_integrations table
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider integration_provider NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  -- API key is encrypted at rest by Supabase
  api_key TEXT,
  status integration_status NOT NULL DEFAULT 'disconnected',
  -- Provider-specific configuration stored as JSONB
  config JSONB NOT NULL DEFAULT '{}',
  -- Metadata
  last_checked_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Each user can only have one integration per provider
  UNIQUE(user_id, provider)
);

-- Create index for faster lookups
CREATE INDEX idx_user_integrations_user ON user_integrations(user_id);
CREATE INDEX idx_user_integrations_provider ON user_integrations(provider);

-- Enable RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own integrations
CREATE POLICY "Users can view own integrations"
  ON user_integrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own integrations"
  ON user_integrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON user_integrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
  ON user_integrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE user_integrations IS 'Stores API keys and configuration for third-party integrations';
COMMENT ON COLUMN user_integrations.api_key IS 'Encrypted API key for the integration provider';
COMMENT ON COLUMN user_integrations.config IS 'Provider-specific configuration (e.g., supportedBrands for Seam, autoSkipTrace for Tracerfy)';
