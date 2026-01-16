-- Migration: Add Row Level Security to user_plans table
-- Description: Secure billing and subscription plan information
-- Critical: This table contains sensitive billing and plan tier data

-- Enable RLS on user_plans
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- Users can view their own plan
CREATE POLICY "Users can view own plan"
  ON user_plans FOR SELECT
  USING (auth.uid() = user_id);

-- Admins and support can view all plans
CREATE POLICY "Admins can view all plans"
  ON user_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );

-- Only admins can modify plans (upgrade/downgrade users)
CREATE POLICY "Admins can update plans"
  ON user_plans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert plans (for new users)
CREATE POLICY "Admins can insert plans"
  ON user_plans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Log the migration
INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Added RLS policies to user_plans table',
  jsonb_build_object(
    'migration', '20260116_add_rls_user_plans',
    'policies_created', 4,
    'tables_secured', ARRAY['user_plans'],
    'security_note', 'Only admins can modify subscription plans'
  )
);
