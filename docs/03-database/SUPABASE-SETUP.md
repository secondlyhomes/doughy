# Supabase Setup Guide

## Creating a Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose organization and set project name
4. Generate a strong database password (save it!)
5. Select region closest to your users
6. Wait for project to provision (~2 minutes)

## Getting Your Credentials

After project is created:

1. Go to **Settings > API**
2. Copy these values to your `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
```

**Important:** Never use the `service_role` key in client code!

## Installing Supabase Client

```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

## Client Setup

```typescript
// src/services/supabase.ts

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

## Generating TypeScript Types

Keep your types in sync with your database:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Generate types
supabase gen types typescript --project-id your-project-id > src/types/database.ts
```

Run this whenever you change your schema.

## Local Development

For faster development, run Supabase locally:

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db push

# Stop when done
supabase stop
```

Local dashboard: http://localhost:54323

## Project Structure

```
supabase/
├── migrations/           # Database migrations
│   ├── 20240101000000_create_users.sql
│   └── 20240102000000_create_tasks.sql
├── functions/            # Edge Functions
│   ├── _shared/          # Shared code
│   └── my-function/
│       └── index.ts
└── config.toml           # Supabase config
```

## Environment Configuration

```typescript
// For different environments
const getSupabaseUrl = () => {
  if (__DEV__) {
    // Local development
    return 'http://localhost:54321';
  }
  return process.env.EXPO_PUBLIC_SUPABASE_URL!;
};
```

## Testing Connection

```typescript
// Quick test in your app
async function testConnection() {
  const { data, error } = await supabase.from('health_check').select('*');

  if (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }

  console.log('Supabase connected successfully');
  return true;
}
```

## First-Time Setup: Step-by-Step

### Step 1: Create Supabase Project

1. **Sign up/Sign in:** [supabase.com](https://supabase.com)
2. **Create Organization** (if first time)
   - Organization name: Your company/personal name
   - Organization slug: URL-friendly identifier

3. **Create New Project**
   - Click "New Project" button
   - **Project name:** `mobile-app-dev` (or your app name)
   - **Database password:** Generate strong password (save in 1Password/LastPass)
   - **Region:** Choose closest to majority of users
     - US East: Virginia
     - US West: Oregon
     - EU: Frankfurt/London
     - Asia: Singapore/Tokyo

4. **Wait for provisioning** (~2-3 minutes)
   - Database initialization
   - API endpoints setup
   - Storage buckets creation

### Step 2: Configure Row Level Security (RLS)

RLS is **MANDATORY** for all tables. Never disable it.

**Enable RLS on all tables:**

```sql
-- Example: Tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
```

**Verify RLS is enabled:**

```sql
-- Check RLS status for all tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`.

### Step 3: Create Your First Migration

**Using SQL Editor (Web):**

1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. Write your migration:

```sql
-- Migration: Create tasks table
-- Created: 2026-02-05

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX tasks_user_id_idx ON tasks(user_id);
CREATE INDEX tasks_created_at_idx ON tasks(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

4. Click **Run** or press `Ctrl+Enter`
5. Verify success in output panel

**Using Supabase CLI (Recommended for teams):**

```bash
# Initialize Supabase in your project
supabase init

# Create new migration
supabase migration new create_tasks_table

# Edit the generated file in supabase/migrations/
# Add your SQL from above

# Apply migration locally
supabase db reset

# Push to remote (after testing locally)
supabase db push
```

### Step 4: Configure JWT Secret (For Local Development)

When developing locally, you may need to configure JWT secrets for auth testing.

**Get your JWT secret:**

1. Go to **Settings > API**
2. Scroll to **JWT Settings**
3. Copy **JWT Secret** (keep secure!)

**Use in local development:**

```bash
# supabase/.env.local
JWT_SECRET=your-super-secret-jwt-secret
```

**Verify JWT configuration:**

```bash
supabase status
```

Look for:
```
JWT secret: configured
JWT expiry: 3600 seconds
```

**Testing JWT tokens:**

```typescript
// Decode JWT to verify claims
import { jwtDecode } from 'jwt-decode'

const session = await supabase.auth.getSession()
if (session.data.session) {
  const decoded = jwtDecode(session.data.session.access_token)
  console.log('User ID:', decoded.sub)
  console.log('Expires:', new Date(decoded.exp * 1000))
}
```

### Step 5: Type Generation Workflow

**Install Supabase CLI globally:**

```bash
npm install -g supabase
```

**Login to Supabase:**

```bash
supabase login
```

Opens browser for authentication.

**Link your project:**

```bash
supabase link --project-ref your-project-id
```

Project ID found in: **Settings > General > Reference ID**

**Generate types:**

```bash
supabase gen types typescript --linked > src/types/database.ts
```

**Add to package.json:**

```json
{
  "scripts": {
    "gen:types": "supabase gen types typescript --linked > src/types/database.ts",
    "postmigrate": "npm run gen:types"
  }
}
```

**Usage in code:**

```typescript
import { Database } from '@/types/database'

// Typed Supabase client
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
)

// Typed table rows
type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

// Typed queries
const { data, error } = await supabase
  .from('tasks')  // TypeScript knows this table exists
  .select('*')
  .eq('user_id', userId)  // TypeScript knows this column exists

// data is typed as Task[]
```

**Re-generate types after schema changes:**

```bash
# After adding/modifying tables
npm run gen:types

# Or with watch mode (re-generates on schema changes)
supabase gen types typescript --watch > src/types/database.ts
```

## Troubleshooting Common Issues

### Issue: "relation does not exist"

**Symptom:** Query fails with `relation "public.tasks" does not exist`

**Causes:**
- Table not created
- Wrong schema (default is `public`)
- Migration not applied

**Solutions:**

```bash
# Check if table exists
supabase db dump --data-only | grep "CREATE TABLE tasks"

# List all tables
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  -c "\dt public.*"

# Re-apply migrations
supabase db reset
```

---

### Issue: "JWT expired"

**Symptom:** Auth calls fail with "JWT expired"

**Causes:**
- Token expired (default 1 hour)
- Clock skew between client and server
- Token not refreshing automatically

**Solutions:**

```typescript
// Ensure auto-refresh is enabled
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,  // ✅ Must be true
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Manually refresh if needed
const { data, error } = await supabase.auth.refreshSession()

// Check token expiry
const session = await supabase.auth.getSession()
if (session.data.session) {
  const expiresAt = session.data.session.expires_at
  console.log('Token expires:', new Date(expiresAt * 1000))
}
```

---

### Issue: "Row Level Security policy violation"

**Symptom:** Query returns empty array or `null` despite data existing

**Causes:**
- RLS policy blocking access
- `auth.uid()` returns null (not authenticated)
- Policy condition doesn't match

**Solutions:**

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'tasks';

-- Test query as authenticated user (in SQL Editor)
SELECT auth.uid();  -- Should return user UUID, not null

-- Temporarily disable RLS to test (ONLY IN DEVELOPMENT)
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Query data
SELECT * FROM tasks WHERE user_id = 'your-user-id';

-- Re-enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
```

**Verify your policies:**

```sql
-- Check if policy matches your user
SELECT
  auth.uid() as current_user,
  user_id,
  auth.uid() = user_id as policy_matches
FROM tasks;
```

---

### Issue: "Connection refused" (Local Development)

**Symptom:** Client can't connect to local Supabase

**Causes:**
- Supabase not running
- Wrong port/URL
- Docker not started

**Solutions:**

```bash
# Check if Supabase is running
supabase status

# Start Supabase
supabase start

# Check Docker containers
docker ps | grep supabase

# Restart if needed
supabase stop
supabase start

# Use correct local URL
const supabaseUrl = __DEV__
  ? 'http://localhost:54321'
  : process.env.EXPO_PUBLIC_SUPABASE_URL!
```

---

### Issue: "Too many connections"

**Symptom:** `FATAL: sorry, too many clients already`

**Causes:**
- Connection pool exhausted
- Not closing connections
- Too many concurrent requests

**Solutions:**

```typescript
// Use single Supabase client instance (singleton pattern)
// ✅ Good: src/services/supabase.ts
export const supabase = createClient(...)

// ❌ Bad: Creating new client in every component
function MyComponent() {
  const supabase = createClient(...)  // Don't do this!
}

// Configure connection pooling (supabase/config.toml)
[db]
pool_size = 15
max_client_conn = 100
```

**Check connection count:**

```sql
SELECT count(*) FROM pg_stat_activity;
```

---

### Issue: Type generation fails

**Symptom:** `supabase gen types` command fails

**Causes:**
- Not logged in
- Project not linked
- Invalid project ID
- Network issues

**Solutions:**

```bash
# Re-login
supabase login

# Re-link project
supabase link --project-ref your-project-id

# Check project ID in dashboard: Settings > General > Reference ID

# Try with explicit project ID
supabase gen types typescript --project-id your-project-id > src/types/database.ts

# Check Supabase CLI version
supabase --version

# Update CLI
npm install -g supabase@latest
```

---

### Issue: Migration conflicts

**Symptom:** `supabase db push` fails with conflicts

**Causes:**
- Local schema differs from remote
- Migration already applied
- Concurrent migrations

**Solutions:**

```bash
# Pull remote schema to local
supabase db pull

# Reset local database (WARNING: deletes local data)
supabase db reset

# Check migration status
supabase migration list

# Repair migrations
supabase migration repair --status applied <migration-version>

# Force push (use with caution)
supabase db push --include-all
```

---

### Issue: Storage bucket access denied

**Symptom:** File upload fails with "Access denied"

**Causes:**
- Bucket not public
- RLS policies on storage
- Wrong file path

**Solutions:**

```sql
-- Check bucket policies (SQL Editor)
SELECT * FROM storage.buckets WHERE name = 'avatars';

-- Make bucket public
UPDATE storage.buckets
SET public = true
WHERE name = 'avatars';

-- Or create RLS policy for authenticated users
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');
```

---

### Issue: Slow queries

**Symptom:** Queries take >1 second

**Causes:**
- Missing indexes
- N+1 query problem
- Large table scans
- No query optimization

**Solutions:**

```sql
-- Add indexes to frequently queried columns
CREATE INDEX tasks_user_id_idx ON tasks(user_id);
CREATE INDEX tasks_created_at_idx ON tasks(created_at DESC);

-- Use EXPLAIN to analyze queries
EXPLAIN ANALYZE
SELECT * FROM tasks WHERE user_id = 'user-id';

-- Use select() to limit columns
const { data } = await supabase
  .from('tasks')
  .select('id, title, completed')  // Only fetch needed columns
  .eq('user_id', userId)

-- Add limit for large tables
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', userId)
  .limit(50)
```

## Checklist

### Initial Setup
- [ ] Project created on supabase.com
- [ ] Database password saved securely
- [ ] Environment variables set in `.env`
- [ ] Supabase client installed and configured
- [ ] Connection tested successfully

### Security
- [ ] RLS enabled on all tables
- [ ] RLS policies created and tested
- [ ] Service role key NOT in client code
- [ ] JWT secret configured (if using local dev)
- [ ] Anon key usage verified (public, safe to expose)

### Development Workflow
- [ ] Supabase CLI installed globally
- [ ] Project linked with CLI
- [ ] TypeScript types generated
- [ ] Types regenerate after schema changes
- [ ] Local development environment working

### Production Readiness
- [ ] All migrations applied to production
- [ ] RLS policies audited and tested
- [ ] Indexes added to frequently queried columns
- [ ] Connection pooling configured
- [ ] Backup schedule configured (automatic in Supabase)
- [ ] Monitoring and alerts set up
