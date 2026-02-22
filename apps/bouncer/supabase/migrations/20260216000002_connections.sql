-- Connections Table
-- Stores per-user service connections with status and permissions.

CREATE TABLE claw.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  service TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected',
  config JSONB DEFAULT '{}',
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, service)
);

ALTER TABLE claw.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_connections" ON claw.connections
  FOR ALL USING (auth.uid() = user_id);
