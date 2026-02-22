# Database Schema Best Practices

> Naming conventions, audit patterns, and schema design for Supabase/PostgreSQL.

## Overview

Consistent schema design ensures:
- Code readability and maintainability
- Easier debugging and data analysis
- Better tooling support (type generation)
- Smoother team onboarding

## Naming Conventions

### Tables

| Convention | Example | Rationale |
|------------|---------|-----------|
| Lowercase plural | `users`, `tasks`, `team_members` | PostgreSQL convention |
| Snake_case | `user_preferences` | Readable in queries |
| No prefixes | `tasks` not `tbl_tasks` | Cleaner, modern |

### Columns

| Convention | Example | Rationale |
|------------|---------|-----------|
| Snake_case | `created_at`, `user_id` | PostgreSQL standard |
| Foreign keys | `{table}_id` | `user_id`, `task_id` |
| Booleans | `is_` or `has_` prefix | `is_active`, `has_premium` |
| Timestamps | `{action}_at` | `created_at`, `updated_at`, `deleted_at` |

### Indexes

```sql
-- Convention: idx_{table}_{column(s)}
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);

-- Partial index
CREATE INDEX idx_active_tasks ON tasks(user_id, due_date)
WHERE deleted_at IS NULL;
```

## Standard Audit Columns

**Every table should have these columns:**

```sql
CREATE TABLE tasks (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Business columns
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',

  -- Foreign keys
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Audit columns (ALWAYS include these)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete (nullable)

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed'))
);

-- Auto-update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### The updated_at Trigger

```sql
-- Create once, reuse for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Soft Deletes

**Always prefer soft deletes for user data:**

```sql
-- Add soft delete column
ALTER TABLE tasks ADD COLUMN deleted_at TIMESTAMPTZ;

-- Create index for active records
CREATE INDEX idx_tasks_active ON tasks(user_id)
WHERE deleted_at IS NULL;

-- Soft delete function
CREATE OR REPLACE FUNCTION soft_delete_task(task_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE tasks SET deleted_at = NOW() WHERE id = task_id;
END;
$$ LANGUAGE plpgsql;
```

### Querying with Soft Deletes

```typescript
// Always filter out deleted records
const { data } = await supabase
  .from('tasks')
  .select('*')
  .is('deleted_at', null); // Only active records

// To include deleted (admin view)
const { data: allTasks } = await supabase
  .from('tasks')
  .select('*'); // Includes deleted
```

## UUIDs vs Auto-increment

**Prefer UUIDs for primary keys:**

| Feature | UUID | Auto-increment |
|---------|------|----------------|
| Globally unique | Yes | No |
| Offline creation | Yes | No |
| Predictable IDs | No (security+) | Yes (security-) |
| Performance | Slightly slower | Faster |
| Size | 16 bytes | 4-8 bytes |

```sql
-- Use gen_random_uuid() (native PostgreSQL)
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- NOT uuid_generate_v4() (requires extension)
```

## Foreign Key Patterns

### Cascade Deletes (User Data)

```sql
-- When user is deleted, delete their tasks
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
```

### Restrict Deletes (Reference Data)

```sql
-- Prevent category deletion if tasks exist
category_id UUID REFERENCES categories(id) ON DELETE RESTRICT
```

### Set Null (Optional References)

```sql
-- Set to null if assigned user is deleted
assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL
```

## Enum Patterns

### Option 1: Check Constraints (Recommended)

```sql
CREATE TABLE tasks (
  status TEXT NOT NULL DEFAULT 'pending'
    CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'archived'))
);
```

### Option 2: PostgreSQL Enum

```sql
-- Less flexible (harder to modify)
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'archived');

CREATE TABLE tasks (
  status task_status NOT NULL DEFAULT 'pending'
);
```

### Option 3: Reference Table (Most Flexible)

```sql
CREATE TABLE task_statuses (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INT NOT NULL
);

INSERT INTO task_statuses VALUES
  ('pending', 'Pending', 1),
  ('in_progress', 'In Progress', 2),
  ('completed', 'Completed', 3);

CREATE TABLE tasks (
  status TEXT REFERENCES task_statuses(id) DEFAULT 'pending'
);
```

## Multi-tenant Patterns

### Row-Level Tenant Isolation

```sql
-- Every tenant-specific table has user_id
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- ...
);

-- RLS policy ensures isolation
CREATE POLICY "Users see own tasks"
ON tasks FOR SELECT
USING (auth.uid() = user_id);
```

### Team/Organization Pattern

```sql
-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team membership
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Team-scoped resources
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Team members can access team projects
CREATE POLICY "Team members access projects"
ON projects FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
);
```

## JSON Columns

### When to Use JSONB

```sql
-- Good: Flexible metadata, user preferences
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  preferences JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

-- Good: AI response caching
CREATE TABLE ai_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash TEXT NOT NULL,
  response JSONB NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### When NOT to Use JSONB

```sql
-- Bad: Core business data that needs indexing/relationships
-- Don't do this:
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  data JSONB -- All task fields in JSON
);

-- Do this instead:
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  -- Only use JSONB for truly flexible data
  custom_fields JSONB DEFAULT '{}'
);
```

### JSONB Indexing

```sql
-- Index specific JSON path
CREATE INDEX idx_profiles_theme ON user_profiles
  USING GIN ((preferences->'theme'));

-- Index all keys (for flexible queries)
CREATE INDEX idx_profiles_preferences ON user_profiles
  USING GIN (preferences);
```

## Migration Best Practices

### File Naming

```
supabase/migrations/
├── 20240101000000_create_users_table.sql
├── 20240101000001_create_tasks_table.sql
├── 20240102000000_add_tasks_due_date.sql
└── 20240102000001_create_tasks_indexes.sql
```

### Migration Template

```sql
-- Migration: add_tasks_priority
-- Description: Add priority column to tasks table

-- Up migration
ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'medium'
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

CREATE INDEX idx_tasks_priority ON tasks(priority);

-- Note: Down migration (for rollback reference, not executed)
-- ALTER TABLE tasks DROP COLUMN priority;
```

### Safe Column Changes

```sql
-- Adding column (safe)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS new_column TEXT;

-- Renaming column (breaking - needs app update first)
ALTER TABLE tasks RENAME COLUMN old_name TO new_name;

-- Changing type (use explicit cast)
ALTER TABLE tasks ALTER COLUMN priority TYPE INTEGER USING (
  CASE priority
    WHEN 'low' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'high' THEN 3
    WHEN 'urgent' THEN 4
  END
);
```

## Performance Patterns

### Always Index Foreign Keys

```sql
-- Foreign keys need indexes for JOIN performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_category_id ON tasks(category_id);
```

### Composite Indexes for Common Queries

```sql
-- If you often query: WHERE user_id = X AND status = Y
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);

-- Order matters! user_id first (more selective)
```

### Partial Indexes for Filtered Queries

```sql
-- If most queries filter deleted_at IS NULL
CREATE INDEX idx_active_tasks ON tasks(user_id, created_at)
WHERE deleted_at IS NULL;
```

## Type Generation

### Keep Types in Sync

```bash
# Generate types after schema changes
supabase gen types typescript --project-id your-project > src/types/database.ts

# Or from local database
supabase gen types typescript --local > src/types/database.ts
```

### Usage in Code

```typescript
import { Database } from '@/types/database';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

// Supabase client with types
const { data } = await supabase
  .from('tasks')
  .select('*')
  .returns<Task[]>();
```

## Checklist

### New Table

- [ ] UUID primary key with `gen_random_uuid()`
- [ ] `created_at TIMESTAMPTZ DEFAULT NOW()`
- [ ] `updated_at TIMESTAMPTZ DEFAULT NOW()` with trigger
- [ ] `deleted_at TIMESTAMPTZ` for soft deletes (if user data)
- [ ] Foreign keys with appropriate `ON DELETE` action
- [ ] Indexes on foreign keys
- [ ] RLS policies created
- [ ] TypeScript types regenerated

### New Column

- [ ] Snake_case naming
- [ ] Appropriate default value
- [ ] NOT NULL if required
- [ ] CHECK constraint for enums
- [ ] Index if frequently queried
- [ ] Migration file created

### Before Production

- [ ] All migrations tested locally
- [ ] Indexes added for slow queries
- [ ] RLS policies tested
- [ ] Soft delete implemented for user data
- [ ] Types regenerated and committed

## Related Docs

- [Supabase Setup](./SUPABASE-SETUP.md) - Initial configuration
- [RLS Policies](./RLS-POLICIES.md) - Row-level security
- [Auditing & Compliance](../09-security/AUDITING-COMPLIANCE.md) - Audit trails
