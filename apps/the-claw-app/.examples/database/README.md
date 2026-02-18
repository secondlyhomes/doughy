# Supabase Database Examples

Complete database setup, migrations, and RLS patterns for your mobile app.

## Overview

This directory contains:
- **Supabase client setup** with secure token storage
- **Example migrations** for common patterns (tasks, categories)
- **RLS policy examples** for data security
- **Type generation** workflow

## Prerequisites

1. **Supabase Project:** Create at [supabase.com](https://supabase.com)
2. **Environment Variables:** Add to `.env` file

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Quick Start

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js expo-secure-store react-native-url-polyfill
```

### 2. Copy Supabase Client

```bash
cp .examples/database/supabase-client.ts src/services/
```

### 3. Run Migrations

Option A: Using Supabase Dashboard
1. Go to SQL Editor in Supabase Dashboard
2. Copy contents of `migrations/001_initial_schema.sql`
3. Run the migration
4. Repeat for other migrations

Option B: Using Supabase CLI (recommended for teams)
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize local development
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Copy migrations to local project
cp .examples/database/migrations/* supabase/migrations/

# Push migrations to remote
supabase db push
```

### 4. Generate TypeScript Types

```bash
# Using Supabase CLI
supabase gen types typescript --project-id your-project-ref > src/types/database.ts

# Or via npx (without installing CLI)
npx supabase gen types typescript --project-id your-project-ref > src/types/database.ts
```

### 5. Use in Your App

```tsx
import { supabase } from '@/services/supabase'

// Query data
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('completed', false)

// Insert data
const { data, error } = await supabase
  .from('tasks')
  .insert({
    title: 'New task',
    user_id: userId,
  })
```

## Migrations

### Migration Workflow

1. **Create migration file:** `migrations/XXX_description.sql`
2. **Write SQL:** Create tables, add columns, create policies
3. **Test locally:** Use Supabase SQL Editor
4. **Apply to production:** Run in Dashboard or via CLI

### Running Migrations in Order

Migrations must be run in order:
1. `001_initial_schema.sql` - Creates tasks table
2. `002_add_categories.sql` - Adds categories feature

### Creating New Migrations

```sql
-- migrations/003_my_feature.sql

-- 1. Create table
CREATE TABLE my_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- ... columns
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create indexes
CREATE INDEX my_table_user_id_idx ON my_table(user_id);

-- 3. Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
CREATE POLICY "Users can manage their own data"
  ON my_table FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Add triggers (optional)
CREATE TRIGGER update_my_table_updated_at
  BEFORE UPDATE ON my_table
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Row Level Security (RLS)

### Why RLS is Critical

RLS ensures users can only access their own data. **Never disable RLS** on tables with user data.

### Common RLS Patterns

See [rls-examples.sql](rls-examples.sql) for comprehensive examples.

**Basic pattern:**
```sql
-- Users can only see their own data
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);
```

**Shared data pattern:**
```sql
-- Users can see data shared with them
CREATE POLICY "Users can view shared data"
  ON documents FOR SELECT
  USING (
    auth.uid() = owner_id
    OR auth.uid() IN (
      SELECT user_id FROM shares
      WHERE document_id = documents.id
    )
  );
```

### Testing RLS Policies

1. **Supabase Dashboard:**
   - Go to SQL Editor
   - Click "Run as user" dropdown
   - Select user email
   - Run query - should only see their data

2. **Programmatically:**
```typescript
import { supabase } from '@/services/supabase'

// Sign in as test user
await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password',
})

// Query - RLS automatically filters to user's data
const { data } = await supabase.from('tasks').select('*')
console.log(data) // Only sees their tasks
```

## Type Generation

### Auto-generate TypeScript Types

```bash
# Generate types
supabase gen types typescript --project-id your-project-ref > src/types/database.ts
```

### Using Generated Types

```typescript
import type { Database } from '@/types/database'

// Infer table types
type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

// Use with Supabase client
const { data } = await supabase
  .from('tasks')
  .select('*')
// data is typed as Task[]
```

### Add to package.json

```json
{
  "scripts": {
    "gen:types": "supabase gen types typescript --project-id your-project-ref > src/types/database.ts"
  }
}
```

Run: `npm run gen:types`

## Querying Data

### Select Queries

```typescript
// Get all tasks
const { data, error } = await supabase
  .from('tasks')
  .select('*')

// Filter
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('completed', false)
  .order('created_at', { ascending: false })

// With relations
const { data } = await supabase
  .from('tasks')
  .select(`
    *,
    category:categories(id, name, color)
  `)
```

### Insert

```typescript
const { data, error } = await supabase
  .from('tasks')
  .insert({
    title: 'New task',
    user_id: userId,
    priority: 'high',
  })
  .select()
  .single()
```

### Update

```typescript
const { data, error } = await supabase
  .from('tasks')
  .update({ completed: true })
  .eq('id', taskId)
  .select()
  .single()
```

### Delete

```typescript
const { error } = await supabase
  .from('tasks')
  .delete()
  .eq('id', taskId)
```

### Real-time Subscriptions

```typescript
// Subscribe to changes
const channel = supabase
  .channel('tasks-changes')
  .on(
    'postgres_changes',
    {
      event: '*', // 'INSERT', 'UPDATE', 'DELETE', or '*'
      schema: 'public',
      table: 'tasks',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      console.log('Change received!', payload)
      // Update local state
    }
  )
  .subscribe()

// Cleanup
return () => {
  supabase.removeChannel(channel)
}
```

## Authentication

### Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
})
```

### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
})
```

### Sign Out

```typescript
const { error } = await supabase.auth.signOut()
```

### Get Current User

```typescript
const { data: { user } } = await supabase.auth.getUser()
```

### Listen to Auth Changes

```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user)
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out')
      }
    }
  )

  return () => subscription.unsubscribe()
}, [])
```

## Security Best Practices

✅ **DO:**
- Enable RLS on ALL tables with user data
- Use `auth.uid()` in RLS policies to filter by current user
- Store tokens in expo-secure-store (not AsyncStorage)
- Use environment variables for Supabase URL/keys
- Generate TypeScript types after schema changes
- Test RLS policies with different users
- Use service_role key ONLY on server (Edge Functions)

❌ **DON'T:**
- Never disable RLS for convenience
- Never expose service_role key to client
- Never hardcode Supabase credentials
- Never trust client-side data without RLS
- Never skip migrations in production
- Never use anon key for admin operations

## Troubleshooting

### "No rows returned"

**Cause:** RLS policy blocking access

**Fix:**
1. Check RLS policies: `SELECT * FROM pg_policies WHERE schemaname = 'public'`
2. Verify user_id matches `auth.uid()`
3. Test with "Run as user" in SQL Editor

### "Permission denied for table"

**Cause:** Missing RLS policy

**Fix:**
```sql
-- Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can access their data"
  ON my_table FOR ALL
  USING (auth.uid() = user_id);
```

### "Invalid JWT"

**Cause:** Expired or invalid session token

**Fix:**
```typescript
// Refresh session
const { data, error } = await supabase.auth.refreshSession()

// Or sign in again
await supabase.auth.signInWithPassword({ email, password })
```

### Types out of sync

**Cause:** Schema changed but types not regenerated

**Fix:**
```bash
npm run gen:types
```

## Related

- **Supabase Client:** [supabase-client.ts](supabase-client.ts)
- **Migrations:** [migrations/](migrations/)
- **RLS Examples:** [rls-examples.sql](rls-examples.sql)
- **Official Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Setup Guide:** [docs/03-database/SUPABASE-SETUP.md](../../docs/03-database/SUPABASE-SETUP.md)
- **Schema Best Practices:** [docs/03-database/SCHEMA-BEST-PRACTICES.md](../../docs/03-database/SCHEMA-BEST-PRACTICES.md)
