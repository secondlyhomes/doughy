# Row Level Security (RLS) Model Documentation

**Zone A: Backend & Database**
**Last Updated:** 2026-01-15
**Phase:** 5 - Testing & Documentation

---

## Overview

This document describes the Row Level Security (RLS) implementation across the Doughy AI database. RLS provides table-level security that restricts which rows users can access, ensuring data isolation between users and proper admin oversight.

---

## Security Principles

### 1. Default Deny
All user-scoped tables have RLS **ENABLED** with explicit policies. Without a matching policy, access is denied by default.

### 2. User Isolation
Regular users can only access their own data. This is enforced through policies that check `auth.uid() = user_id`.

### 3. Admin Override
Users with `role = 'admin'` or `role = 'support'` can view all data for support purposes. Admins have additional permissions to modify data across users.

### 4. Read-Only Support
Support users (`role = 'support'`) can view all data but cannot modify other users' data.

### 5. No Role Self-Escalation
Users cannot change their own `role` field. Only admins can modify user roles.

---

## Policy Patterns

### Pattern 1: User-Scoped Tables

**Applied to:** `api_keys`, `profiles`, `user_plans`, `deals`, `leads`, `re_properties`, `re_documents`

**Policy Template:**
```sql
-- SELECT (View)
CREATE POLICY "Users can view their own {table}"
  ON {table} FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT (Create)
CREATE POLICY "Users can insert their own {table}"
  ON {table} FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE (Modify)
CREATE POLICY "Users can update their own {table}"
  ON {table} FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE (Remove)
CREATE POLICY "Users can delete their own {table}"
  ON {table} FOR DELETE
  USING (auth.uid() = user_id);

-- Admin override
CREATE POLICY "Admins can view all {table}"
  ON {table} FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );
```

**Example:**
```sql
-- Example: deals table
CREATE POLICY "Users can view their own deals"
  ON deals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all deals"
  ON deals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );
```

---

### Pattern 2: Indirect Ownership (Via Foreign Key)

**Applied to:** `re_lead_documents`, `deal_events`

These tables don't have a direct `user_id` column, but enforce access control through the parent table.

**Policy Template:**
```sql
-- Example: re_lead_documents (access via leads.user_id)
CREATE POLICY "Users can view lead documents they have access to"
  ON re_lead_documents FOR SELECT
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert lead documents for their leads"
  ON re_lead_documents FOR INSERT
  WITH CHECK (
    lead_id IN (
      SELECT id FROM leads WHERE user_id = auth.uid()
    )
  );
```

**Example:**
```sql
-- Example: deal_events (access via deals.user_id)
CREATE POLICY "Users can view events for their own deals"
  ON deal_events FOR SELECT
  USING (
    deal_id IN (
      SELECT id FROM deals WHERE user_id = auth.uid()
    )
  );
```

---

### Pattern 3: Junction Tables (Many-to-Many)

**Applied to:** `re_property_documents`

Junction tables enforce access control through one side of the relationship.

**Policy Template:**
```sql
CREATE POLICY "Users can view links for their properties"
  ON re_property_documents FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM re_properties WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create links for their properties"
  ON re_property_documents FOR INSERT
  WITH CHECK (
    property_id IN (
      SELECT id FROM re_properties WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete links for their properties"
  ON re_property_documents FOR DELETE
  USING (
    property_id IN (
      SELECT id FROM re_properties WHERE user_id = auth.uid()
    )
  );
```

---

### Pattern 4: Restricted Admin Tables

**Applied to:** `system_logs`, `feature_flags`

Some tables are admin-only with no user access.

**Policy Template:**
```sql
-- Admins can view all system logs
CREATE POLICY "Admins can view all system logs"
  ON system_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- No user access (default deny applies)
```

---

### Pattern 5: No Self-Role-Escalation

**Applied to:** `profiles`

Special policy to prevent users from changing their own role.

**Policy:**
```sql
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM profiles WHERE id = auth.uid())  -- Role must remain unchanged
  );

-- Only admins can change roles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## Table-by-Table RLS Summary

### Critical Tables (Phase 1)

| Table | RLS Enabled | Policies | Pattern | Notes |
|-------|-------------|----------|---------|-------|
| `api_keys` | ✅ Yes | 5 | User-Scoped | Contains encrypted API credentials |
| `profiles` | ✅ Yes | 4 | User-Scoped + No Self-Escalation | Cannot change own role |
| `user_plans` | ✅ Yes | 3 | User-Scoped + Admin-Only Modify | Only admins modify billing |

### Core Tables (Phase 1)

| Table | RLS Enabled | Policies | Pattern | Notes |
|-------|-------------|----------|---------|-------|
| `deals` | ✅ Yes | 5 | User-Scoped | Deal pipeline data |
| `leads` | ✅ Yes | 5 | User-Scoped | Sales leads |
| `re_properties` | ✅ Yes | 5 | User-Scoped | Property listings |
| `re_documents` | ✅ Yes | 5 | User-Scoped | Property documents |

### Sprint 1 Tables (Phase 2)

| Table | RLS Enabled | Policies | Pattern | Notes |
|-------|-------------|----------|---------|-------|
| `re_lead_documents` | ✅ Yes | 4 | Indirect Ownership | Via `leads.user_id` |
| `re_property_documents` | ✅ Yes | 3 | Junction Table | Via `re_properties.user_id` |

### Existing Tables (Pre-Phase 1)

| Table | RLS Enabled | Policies | Pattern | Notes |
|-------|-------------|----------|---------|-------|
| `ai_jobs` | ✅ Yes | 2 | Indirect Ownership | Via `deals.user_id` |
| `deal_events` | ✅ Yes | 2 | Indirect Ownership | Via `deals.user_id` |

### System Tables

| Table | RLS Enabled | Policies | Pattern | Notes |
|-------|-------------|----------|---------|-------|
| `system_logs` | ✅ Yes | 1 | Admin-Only | No user access |

---

## Testing RLS Policies

### Using pgTAP Tests

We have comprehensive pgTAP tests in `supabase/tests/database/01_rls_policies_test.sql`:

**What's Tested:**
1. RLS is enabled on critical tables
2. Policies exist for each table
3. Users can only see their own data
4. Admins can see all data
5. Users cannot escalate their own roles
6. API keys are properly isolated

**Running Tests:**
```bash
psql $DATABASE_URL -f supabase/tests/database/01_rls_policies_test.sql
```

### Manual Testing (SQL)

**Test 1: User Isolation**
```sql
-- Set context to user 1
SELECT set_config('request.jwt.claims', json_build_object('sub', 'user1-uuid')::text, false);
SET ROLE authenticated;

-- Query should only return user 1's data
SELECT * FROM deals;  -- Returns only user 1's deals

-- Query should NOT return other users' data
SELECT * FROM deals WHERE user_id = 'user2-uuid';  -- Returns 0 rows
```

**Test 2: Admin Access**
```sql
-- Set context to admin user
SELECT set_config('request.jwt.claims', json_build_object('sub', 'admin-uuid')::text, false);
SET ROLE authenticated;

-- Query should return ALL users' data
SELECT COUNT(*) FROM deals;  -- Returns all deals across all users
```

**Test 3: Role Self-Escalation Prevention**
```sql
-- Set context to regular user
SELECT set_config('request.jwt.claims', json_build_object('sub', 'user1-uuid')::text, false);
SET ROLE authenticated;

-- Try to escalate own role to admin (should FAIL)
UPDATE profiles SET role = 'admin' WHERE id = 'user1-uuid';
-- ERROR: new row violates row-level security policy
```

---

## Supabase Client Authentication

### JavaScript/TypeScript Usage

RLS policies are **automatically enforced** when using the Supabase client:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sign in user
const { data: { user } } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// RLS automatically applies - user can only see their own deals
const { data: deals } = await supabase
  .from('deals')
  .select('*');  // Returns only current user's deals

// Trying to access other users' data returns 0 rows
const { data: otherDeals } = await supabase
  .from('deals')
  .select('*')
  .eq('user_id', 'some-other-user-id');  // Returns [] (empty array)
```

### Admin Access (Service Role)

For admin operations, use the **service role key** (bypasses RLS):

```typescript
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Service role bypasses RLS - can access ALL data
const { data: allDeals } = await adminClient
  .from('deals')
  .select('*');  // Returns ALL users' deals
```

**⚠️ WARNING:** Never expose the service role key to client-side code!

---

## Edge Function Authentication

Edge functions can access user context via the Authorization header:

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const authHeader = req.headers.get('Authorization');

  // Create client with user's JWT token
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader! },
      },
    }
  );

  // RLS automatically enforced for this user
  const { data: deals } = await supabase.from('deals').select('*');

  return new Response(JSON.stringify({ deals }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

## Monitoring & Debugging

### Check Which Tables Have RLS Enabled

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected Output:**
- All user-scoped tables should have `rowsecurity = true`
- System migration tables can have `rowsecurity = false`

### View All Policies for a Table

```sql
SELECT *
FROM pg_policies
WHERE tablename = 'deals';
```

### Test Policy with EXPLAIN

```sql
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user-id-here"}';

EXPLAIN (ANALYZE, VERBOSE)
SELECT * FROM deals;
```

Check that the execution plan includes RLS filter clauses.

---

## Common Issues & Solutions

### Issue 1: "new row violates row-level security policy"

**Cause:** Trying to INSERT/UPDATE data that doesn't match the policy's `WITH CHECK` clause.

**Solution:** Ensure the `user_id` being inserted matches `auth.uid()`:
```typescript
// ❌ Wrong - hardcoded user_id
await supabase.from('deals').insert({
  user_id: 'some-other-user',  // Violates RLS policy
  title: 'My Deal'
});

// ✅ Correct - use authenticated user's ID
const { data: { user } } = await supabase.auth.getUser();
await supabase.from('deals').insert({
  user_id: user.id,  // Matches auth.uid()
  title: 'My Deal'
});
```

### Issue 2: Query returns empty array when data exists

**Cause:** User is not authenticated, or RLS is blocking access.

**Solution:** Verify authentication:
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);  // Should not be null

if (!user) {
  // User not authenticated - sign in first
  await supabase.auth.signInWithPassword({ email, password });
}
```

### Issue 3: Admin can't see all data

**Cause:** Admin user's `role` field is not set to `'admin'`.

**Solution:** Verify role in database:
```sql
SELECT id, email, role FROM profiles WHERE id = 'admin-user-id';
-- Should return role = 'admin'

-- If not, update role (requires service role key):
UPDATE profiles SET role = 'admin' WHERE id = 'admin-user-id';
```

---

## Security Best Practices

### 1. Never Disable RLS on User Tables

```sql
-- ❌ NEVER DO THIS:
ALTER TABLE deals DISABLE ROW LEVEL SECURITY;
```

### 2. Always Use auth.uid() in Policies

```sql
-- ✅ Correct
USING (auth.uid() = user_id)

-- ❌ Wrong - hardcoded user ID
USING (user_id = 'some-user-id')
```

### 3. Test Policies Before Deploying

```bash
# Run pgTAP tests before pushing to production
psql $DATABASE_URL -f supabase/tests/database/01_rls_policies_test.sql
```

### 4. Monitor for Permission Errors

```sql
-- Check system logs for RLS violations
SELECT * FROM system_logs
WHERE message LIKE '%row-level security%'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### 5. Use Service Role Key Only Server-Side

```typescript
// ✅ Correct - server-side only
// In edge function or API route
const adminClient = createClient(url, serviceRoleKey);

// ❌ NEVER in client code
// import { SUPABASE_SERVICE_ROLE_KEY } from './config';  // NEVER!
```

---

## Rollback Instructions

If RLS policies cause issues, see rollback scripts:

```bash
# Rollback RLS for api_keys
psql $DATABASE_URL -f supabase/migrations/20260116_add_rls_api_keys_ROLLBACK.sql

# Rollback RLS for profiles
psql $DATABASE_URL -f supabase/migrations/20260116_add_rls_profiles_ROLLBACK.sql
```

**⚠️ WARNING:** Rollback removes security protections! Use only for emergency recovery.

---

## Related Documentation

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Complete schema reference
- [DATABASE_NAMING_CONVENTIONS.md](./DATABASE_NAMING_CONVENTIONS.md) - Naming standards
- [ZONE_A_BACKEND.md](../ZONE_A_BACKEND.md) - Backend development roadmap

---

**Last Review:** 2026-01-15
**Maintainer:** Zone A Team (Backend & Database)
