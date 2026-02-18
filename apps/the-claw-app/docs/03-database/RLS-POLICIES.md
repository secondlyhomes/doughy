# Row Level Security (RLS) Policies

Row Level Security (RLS) is PostgreSQL's built-in mechanism for restricting which rows a user can access. In Supabase, RLS is the primary authorization layer -- it runs at the database level, meaning security cannot be bypassed by client-side code.

---

## Table of Contents

1. [Overview](#overview)
2. [Enabling RLS](#enabling-rls)
3. [Basic Patterns](#basic-patterns)
4. [Security Functions](#security-functions)
5. [Advanced Patterns](#advanced-patterns)
6. [Common Mistakes](#common-mistakes)
7. [Performance Tips](#performance-tips)
8. [Testing Strategies](#testing-strategies)

---

## Overview

### How RLS Works

1. Every request to Supabase includes a JWT (JSON Web Token) in the Authorization header.
2. The JWT contains the user's ID (`sub` claim) and role (`role` claim).
3. PostgreSQL evaluates RLS policies on every query, filtering rows based on the JWT claims.
4. Only rows that pass the policy's `USING` clause (for SELECT/UPDATE/DELETE) or `WITH CHECK` clause (for INSERT/UPDATE) are accessible.

### Key Concepts

| Concept | Description |
|---------|-------------|
| `auth.uid()` | Returns the current user's ID from the JWT |
| `auth.role()` | Returns the current role (`anon`, `authenticated`, `service_role`) |
| `auth.jwt()` | Returns the full JWT payload as JSON |
| `USING` clause | Filters existing rows (SELECT, UPDATE, DELETE) |
| `WITH CHECK` clause | Validates new/updated rows (INSERT, UPDATE) |
| `PERMISSIVE` | Rows pass if ANY permissive policy allows it (OR logic) |
| `RESTRICTIVE` | Rows pass only if ALL restrictive policies allow it (AND logic) |

---

## Enabling RLS

**RLS must be enabled on every table.** Without RLS, any authenticated user can access any row.

```sql
-- Enable RLS on a table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners too (important!)
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;
```

**Critical Rule**: After enabling RLS, NO data is accessible until you create policies. This is secure by default.

```sql
-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- All rows should show rowsecurity = true
```

---

## Basic Patterns

### Pattern 1: User Owns Data

The most common pattern. Users can only access their own rows.

```sql
-- Create table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### Pattern 2: Workspace/Team Access

Users can access data in workspaces they belong to:

```sql
-- Workspace members table
CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  PRIMARY KEY (workspace_id, user_id)
);

-- Tasks belong to workspace
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: User must be member of workspace
CREATE POLICY "Workspace members can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = tasks.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

-- Only admins can create tasks
CREATE POLICY "Workspace admins can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = tasks.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin')
    )
  );
```

### Pattern 3: Public Read, Authenticated Write

```sql
-- Public profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only owner can update their profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### Pattern 4: Role-Based Access

Different access levels based on user roles stored in a profiles table.

```sql
-- Admins can read all data
CREATE POLICY "Admins can read all"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- Moderators can update any task
CREATE POLICY "Moderators can update tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  );

-- Regular users can only access their own
CREATE POLICY "Users can read own tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

---

## Security Functions

Create helper functions for complex checks. Keep policies clean and reusable.

### Check If User Is Workspace Admin

```sql
CREATE OR REPLACE FUNCTION is_workspace_admin(ws_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Use in policy
CREATE POLICY "Admins can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (is_workspace_admin(workspace_id));
```

### Get Current User's Role

```sql
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### Check If User Is Admin

```sql
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### Get User's Workspaces

```sql
-- Efficient function for workspace membership checks
CREATE OR REPLACE FUNCTION user_workspaces()
RETURNS SETOF UUID AS $$
  SELECT workspace_id FROM workspace_members
  WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Use in policy
CREATE POLICY "Access own workspace tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (workspace_id IN (SELECT user_workspaces()));
```

### Understanding SECURITY DEFINER

Security functions should use `SECURITY DEFINER` to execute with the function owner's permissions. This allows the function to query tables that the calling user might not have direct access to.

```sql
-- SECURITY DEFINER: function runs with creator's (postgres) permissions
-- STABLE: function result doesn't change within a single query
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

**Why SECURITY DEFINER matters:**
- Without it, the function runs with the caller's permissions
- If RLS is enabled on the `profiles` table, the function might fail
- With SECURITY DEFINER, it can always query `profiles` regardless of RLS

**Security warning:** Be careful with SECURITY DEFINER functions. They bypass RLS, so ensure they only expose the intended data.

---

## Advanced Patterns

### Soft-Delete Protection

Prevent users from seeing soft-deleted records:

```sql
-- Only show non-deleted records
CREATE POLICY "Hide soft-deleted records"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND user_id = auth.uid()
  );

-- Soft delete only (no hard deletes)
CREATE POLICY "Soft delete only"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Prevent hard deletes entirely by not creating a DELETE policy
```

### Cross-Table Policies

Access based on relationships in other tables:

```sql
-- Users can read tasks if they're a member of the task's project
CREATE POLICY "Project members can read tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
    )
  );
```

### Restricting Column Updates

While RLS operates at the row level, use triggers to restrict column updates:

```sql
-- Trigger to prevent changing the owner_id after creation
CREATE OR REPLACE FUNCTION prevent_owner_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'Cannot change task owner via direct update';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_owner_change_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION prevent_owner_change();
```

### Time-Based Access

```sql
-- Users can only edit records created in the last 24 hours
CREATE POLICY "Edit recent records only"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()
    AND created_at > NOW() - INTERVAL '24 hours'
  );
```

---

## Common Mistakes

### 1. Forgetting to Enable RLS

```sql
-- BAD: Table without RLS is PUBLIC!
CREATE TABLE secrets (
  id UUID PRIMARY KEY,
  secret TEXT
);

-- GOOD: Always enable RLS
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;
```

### 2. Using service_role in Client

```typescript
// BAD: Bypasses all RLS!
const supabase = createClient(url, serviceRoleKey);

// GOOD: Use anon key, let RLS work
const supabase = createClient(url, anonKey);
```

### 3. Overly Permissive Policies

```sql
-- BAD: Anyone can read all data
CREATE POLICY "Anyone can read" ON tasks
  FOR SELECT USING (true);

-- GOOD: Only owner can read
CREATE POLICY "Owner can read" ON tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

### 4. Using `FOR ALL` When You Mean Specific Operations

```sql
-- DANGER: Allows any operation (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Users access own data"
  ON tasks
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- BETTER: Create separate policies for each operation
-- This gives you fine-grained control
```

### 5. Missing WITH CHECK on INSERT/UPDATE

```sql
-- BUG: Users can INSERT rows with any user_id
CREATE POLICY "Users can create tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE); -- Allows inserting with any user_id!

-- FIX: Ensure user_id matches the authenticated user
CREATE POLICY "Users can create tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
```

### 6. Not Handling the Anonymous Role

```sql
-- BUG: This policy doesn't specify a role, so it applies to everyone
CREATE POLICY "Read tasks"
  ON tasks
  FOR SELECT
  USING (TRUE); -- Even unauthenticated users can read!

-- FIX: Specify the target role
CREATE POLICY "Authenticated users read tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

### 7. Recursive Policies

```sql
-- BUG: This creates an infinite loop!
-- Policy on table A checks table B, policy on table B checks table A
CREATE POLICY "Check via B" ON table_a
  FOR SELECT USING (EXISTS (SELECT 1 FROM table_b WHERE ...));

CREATE POLICY "Check via A" ON table_b
  FOR SELECT USING (EXISTS (SELECT 1 FROM table_a WHERE ...));

-- FIX: Use SECURITY DEFINER functions to break the recursion
```

### 8. Leaking Data Through JOINs

```sql
-- BUG: Even with RLS on tasks, a JOIN might expose project names
-- if the joined table has a permissive policy
SELECT t.*, p.name as project_name
FROM tasks t
JOIN projects p ON t.project_id = p.id;

-- FIX: Ensure RLS policies are consistent across related tables
```

---

## Performance Tips

### 1. Index Columns Used in Policies

```sql
-- Add index for faster RLS checks
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_user_workspace
  ON workspace_members(user_id, workspace_id);
```

### 2. Use STABLE Functions

Mark security functions as `STABLE` so PostgreSQL can cache the result within a single query:

```sql
CREATE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;
-- STABLE means: same result for same inputs within a single query execution
```

### 3. Use EXISTS Instead of IN for Subqueries

```sql
-- SLOWER: Subquery executed for every row
CREATE POLICY "Org members"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- FASTER: Use EXISTS (stops at first match)
CREATE POLICY "Org members"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE user_id = auth.uid()
        AND workspace_id = tasks.workspace_id
    )
  );
```

### 4. Keep Policies Simple

Complex policies with multiple JOINs and subqueries slow down every query. If a policy is complex:

1. Move the logic into a `SECURITY DEFINER` function.
2. Ensure the function is marked `STABLE`.
3. Add appropriate indexes.

### 5. Monitor Policy Performance

```sql
-- Use EXPLAIN ANALYZE to see how policies affect query plans
EXPLAIN ANALYZE
SELECT * FROM tasks WHERE completed = false;
-- Look for "Filter" or "Subplan" entries added by RLS
```

---

## Testing Strategies

### Testing RLS from the App

```typescript
// Test as authenticated user
const { data, error } = await supabase
  .from('tasks')
  .select('*');

// Should only return user's tasks
expect(data.every(task => task.user_id === currentUserId)).toBe(true);

// Test unauthorized access
const { error: accessError } = await supabase
  .from('tasks')
  .update({ title: 'Hacked' })
  .eq('id', 'other-users-task-id');

expect(accessError).toBeTruthy();
```

### SQL Test Files

```sql
-- supabase/tests/rls_tasks.test.sql

-- Test setup: create test users
SELECT tests.create_supabase_user('user1', 'user1@example.com');
SELECT tests.create_supabase_user('user2', 'user2@example.com');

-- Test: user can read own tasks
SELECT tests.authenticate_as('user1');

INSERT INTO tasks (title, user_id)
VALUES ('User1 Task', tests.get_supabase_uid('user1'));

SELECT is(
  (SELECT count(*)::int FROM tasks),
  1,
  'User can read their own task'
);

-- Test: user cannot read other users' tasks
SELECT tests.authenticate_as('user2');

SELECT is(
  (SELECT count(*)::int FROM tasks),
  0,
  'User cannot read other users tasks'
);

-- Cleanup
SELECT tests.clear_authentication();
```

### Using Supabase CLI

```bash
# Start local Supabase
npx supabase start

# Run tests against local instance
npx supabase test db
```

---

## RLS Checklist

### Setup

- [ ] RLS enabled on ALL tables
- [ ] Force RLS enabled for table owners
- [ ] Verified with `pg_tables` query

### Policies

- [ ] Separate policies for SELECT, INSERT, UPDATE, DELETE
- [ ] All policies specify target role (`TO authenticated`)
- [ ] INSERT policies include proper `WITH CHECK` clause
- [ ] UPDATE policies include both `USING` and `WITH CHECK`
- [ ] No overly permissive `USING (true)` without intention

### Security Functions

- [ ] Helper functions use `SECURITY DEFINER`
- [ ] Functions marked as `STABLE` for caching
- [ ] No recursive policy dependencies

### Performance

- [ ] Indexes on foreign keys used in policies
- [ ] EXISTS used instead of IN for subqueries
- [ ] Complex logic moved to functions

### Testing

- [ ] Users can only read their own data
- [ ] Users can only create records assigned to themselves
- [ ] Users can only update their own records
- [ ] Users cannot access other users' data via JOINs
- [ ] Anonymous users cannot access protected data
- [ ] Admin/moderator roles have appropriate elevated access
- [ ] Soft-deleted records are hidden
- [ ] Policy performance verified with EXPLAIN ANALYZE
