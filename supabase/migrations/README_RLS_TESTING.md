# RLS Policy Testing Guide

## ⚠️ IMPORTANT: Test in DEV Environment First

**DO NOT** deploy these RLS policies to production without testing first!

---

## Step 1: Apply Migrations to Dev Environment

```bash
# Make sure you're connected to DEV environment
# Check current environment
supabase status

# Apply the RLS migrations
supabase db push --linked

# Or run them manually via Supabase Dashboard SQL Editor
```

---

## Step 2: Test RLS Policies

### Test 1: api_keys Table

**Open Supabase Dashboard → SQL Editor** and run:

```sql
-- Test 1: Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'api_keys';
-- Should return: rowsecurity = true

-- Test 2: Check policies exist
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'api_keys';
-- Should return 5 policies

-- Test 3: Test as regular user
-- (Replace 'test-user-uuid' with actual user ID from your dev database)
SET ROLE authenticated;
SET request.jwt.claims.sub = 'test-user-uuid';

SELECT COUNT(*) FROM api_keys;
-- Should only return keys owned by test-user-uuid

-- Test 4: Test as admin
SET request.jwt.claims.sub = 'admin-user-uuid';
UPDATE profiles SET role = 'admin' WHERE id = 'admin-user-uuid';

SELECT COUNT(*) FROM api_keys;
-- Should return ALL api_keys (admin can see all)

-- Reset
RESET ROLE;
```

### Test 2: profiles Table

```sql
-- Test 1: Verify RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';
-- Should return: rowsecurity = true

-- Test 2: User can view own profile
SET ROLE authenticated;
SET request.jwt.claims.sub = 'test-user-uuid';

SELECT * FROM profiles WHERE id = 'test-user-uuid';
-- Should return 1 row (own profile)

SELECT COUNT(*) FROM profiles WHERE id != 'test-user-uuid';
-- Should return 0 (cannot see other profiles)

-- Test 3: User cannot escalate own role
UPDATE profiles
SET role = 'admin'
WHERE id = 'test-user-uuid';
-- Should FAIL with permission denied

-- Test 4: Admin can view all profiles
SET request.jwt.claims.sub = 'admin-user-uuid';
SELECT COUNT(*) FROM profiles;
-- Should return total count (admin sees all)

-- Reset
RESET ROLE;
```

### Test 3: user_plans Table

```sql
-- Test 1: User can view own plan
SET ROLE authenticated;
SET request.jwt.claims.sub = 'test-user-uuid';

SELECT * FROM user_plans WHERE user_id = 'test-user-uuid';
-- Should return own plan

-- Test 2: User cannot modify own plan
UPDATE user_plans
SET tier = 'enterprise'
WHERE user_id = 'test-user-uuid';
-- Should FAIL (only admins can modify)

-- Test 3: Admin can modify any plan
SET request.jwt.claims.sub = 'admin-user-uuid';

UPDATE user_plans
SET tier = 'pro'
WHERE user_id = 'test-user-uuid';
-- Should SUCCEED

-- Reset
RESET ROLE;
```

---

## Step 3: Test App Functionality

After applying migrations, test all user-facing features:

1. **✅ Login as regular user**
   - Can you see your own API keys?
   - Can you view your profile?
   - Can you see your subscription plan?

2. **✅ Try to access other users' data** (should fail)
   - Navigate to Admin → Integrations
   - Check that you only see your own API keys
   - Verify no "permission denied" errors in console

3. **✅ Login as admin user**
   - Navigate to Admin → User Management
   - Can you see all users?
   - Can you modify user roles?
   - Can you view all API keys?

---

## Step 4: Monitor for Errors

**Check Supabase Logs:**
1. Go to Dashboard → Logs → Postgres Logs
2. Filter for errors containing "permission denied"
3. If you see errors:
   - Note which table/query caused the error
   - Check if it's a legitimate feature that broke
   - Adjust RLS policies if needed

**Wait 2-3 days** before proceeding to Phase 2 (feature table RLS).

---

## Rollback Plan (If Something Breaks)

If RLS causes issues, you can temporarily disable it:

```sql
-- TEMPORARY ROLLBACK (dev only!)
ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_plans DISABLE ROW LEVEL SECURITY;

-- Or drop specific policies:
DROP POLICY "Users can view their own API keys" ON api_keys;
-- etc.
```

**Create proper rollback migration files:**
```bash
# supabase/migrations/20260116_add_rls_api_keys_ROLLBACK.sql
```

---

## Success Criteria

✅ All 3 tables have RLS enabled
✅ No "permission denied" errors in dev environment
✅ Users can only see their own data
✅ Admins can see all data
✅ Users cannot escalate their own roles
✅ All app features work correctly

---

## Next Steps

After 2-3 days of monitoring with no issues:
1. Deploy to staging (if applicable)
2. Deploy to production
3. Proceed to Phase 2: Add RLS to feature tables (deals, leads, properties)
