-- Migration: Add Row Level Security to profiles table
-- Description: Secure user profiles with proper role-based access control
-- Critical: This table contains user identity and role information

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (but cannot change their role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM profiles WHERE id = auth.uid())  -- Prevent role self-escalation
  );

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );

-- Only admins can update all profiles (including roles)
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
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
  'Added RLS policies to profiles table',
  jsonb_build_object(
    'migration', '20260116_add_rls_profiles',
    'policies_created', 4,
    'tables_secured', ARRAY['profiles'],
    'security_note', 'Users cannot self-escalate roles'
  )
);
