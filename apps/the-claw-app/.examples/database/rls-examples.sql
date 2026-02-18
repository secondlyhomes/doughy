-- Row Level Security (RLS) Policy Examples
--
-- IMPORTANT: RLS MUST be enabled on ALL tables that store user data
-- Never disable RLS for convenience - it's a critical security layer

-- ============================================================================
-- Basic RLS Patterns
-- ============================================================================

-- Pattern 1: User owns the row (most common)
-- Users can only access rows where user_id matches their auth.uid()

CREATE POLICY "Users can view their own data"
  ON my_table FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own data"
  ON my_table FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data"
  ON my_table FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data"
  ON my_table FOR DELETE
  USING (auth.uid() = user_id);

-- Pattern 2: Combine all operations in one policy (simplified)
CREATE POLICY "Users can manage their own data"
  ON my_table FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Advanced RLS Patterns
-- ============================================================================

-- Pattern 3: Public read, authenticated write
-- Anyone can read, only authenticated users can create

CREATE POLICY "Public can view"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can create"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Pattern 4: Shared/collaborative data
-- Users can access data shared with them

CREATE POLICY "Users can view shared data"
  ON shared_documents FOR SELECT
  USING (
    auth.uid() = owner_id
    OR auth.uid() IN (
      SELECT user_id FROM document_shares
      WHERE document_id = shared_documents.id
    )
  );

-- Pattern 5: Team-based access
-- Users in the same team can access each other's data

CREATE POLICY "Team members can view"
  ON team_data FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  );

-- Pattern 6: Role-based access
-- Different permissions based on user role

CREATE POLICY "Admins can view all"
  ON sensitive_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Regular users can view public only"
  ON sensitive_data FOR SELECT
  USING (
    is_public = true
    OR user_id = auth.uid()
  );

-- Pattern 7: Time-based access
-- Access expires after certain date

CREATE POLICY "Users can view active subscriptions"
  ON subscriptions FOR SELECT
  USING (
    auth.uid() = user_id
    AND (expires_at IS NULL OR expires_at > now())
  );

-- ============================================================================
-- Security Best Practices
-- ============================================================================

-- 1. ALWAYS enable RLS on tables with user data
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- 2. Test RLS policies with different users
-- Use Supabase SQL Editor with "Run as user" feature

-- 3. Use SECURITY DEFINER functions cautiously
-- They bypass RLS - only use when absolutely necessary

-- 4. Audit RLS policies regularly
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Check tables without RLS enabled
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT tablename
  FROM pg_policies
  WHERE schemaname = 'public'
)
ORDER BY tablename;

-- ============================================================================
-- Common Mistakes to Avoid
-- ============================================================================

-- ❌ BAD: Disabling RLS (NEVER DO THIS)
-- ALTER TABLE my_table DISABLE ROW LEVEL SECURITY;

-- ❌ BAD: Policy that allows all access
-- CREATE POLICY "allow_all" ON my_table FOR ALL USING (true);

-- ❌ BAD: Using anon key to bypass RLS
-- (RLS applies to anon key - use service_role ONLY on server)

-- ❌ BAD: Forgetting WITH CHECK clause
-- CREATE POLICY "can_insert" ON my_table FOR INSERT
-- USING (auth.uid() = user_id);  -- Missing WITH CHECK!

-- ✅ GOOD: Proper INSERT policy
CREATE POLICY "can_insert" ON my_table FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Testing RLS Policies
-- ============================================================================

-- Test as specific user (Supabase SQL Editor)
-- 1. Click "Run as user" dropdown
-- 2. Select user email or UUID
-- 3. Run SELECT query - should only see their data

-- Test programmatically
DO $$
DECLARE
  test_user_id UUID := 'user-uuid-here';
BEGIN
  -- Set session user
  PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);

  -- Test query
  RAISE NOTICE 'User can see % rows',
    (SELECT COUNT(*) FROM my_table);
END $$;

-- ============================================================================
-- Migration Template
-- ============================================================================

-- Always follow this pattern when creating new tables:

-- 1. Create table
CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- ... other columns
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create indexes
CREATE INDEX new_table_user_id_idx ON new_table(user_id);

-- 3. Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
CREATE POLICY "Users can manage their own data"
  ON new_table FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Test policies
-- (Use Supabase SQL Editor "Run as user")

-- ============================================================================
-- Monitoring RLS
-- ============================================================================

-- Check policy effectiveness
SELECT
  relname AS table_name,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE nspname = 'public'
AND relkind = 'r'
ORDER BY relname;

-- View all policies
\dp

-- Or with SQL:
SELECT * FROM pg_policies WHERE schemaname = 'public';
