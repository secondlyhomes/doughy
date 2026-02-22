# Tutorial 4: Advanced Database Integration

Master advanced Supabase database techniques including complex queries, relationships, transactions, real-time subscriptions, and performance optimization.

## Table of Contents

1. [Advanced Schema Design](#advanced-schema-design)
2. [Relationships and Joins](#relationships-and-joins)
3. [Complex Queries](#complex-queries)
4. [Transactions](#transactions)
5. [Real-time Subscriptions](#real-time-subscriptions)
6. [Performance Optimization](#performance-optimization)
7. [Database Functions](#database-functions)
8. [Full-Text Search](#full-text-search)
9. [Data Validation](#data-validation)
10. [Migration Strategies](#migration-strategies)

---

## Advanced Schema Design

### One-to-Many Relationships

Example: Users have many tasks

```sql
-- Users have many tasks
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL
);

-- Index for fast lookups
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
```

### Many-to-Many Relationships

Example: Tasks can have many tags, tags can belong to many tasks

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE task_tags (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- Indexes for both directions
CREATE INDEX idx_task_tags_task ON task_tags(task_id);
CREATE INDEX idx_task_tags_tag ON task_tags(tag_id);
```

### Polymorphic Associations

Example: Comments can belong to tasks or projects

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commentable_type TEXT NOT NULL CHECK (commentable_type IN ('task', 'project')),
  commentable_id UUID NOT NULL,
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX idx_comments_polymorphic ON comments(commentable_type, commentable_id);
```

---

## Relationships and Joins

### Fetching Related Data

**Task with user information:**
```typescript
const { data } = await supabase
  .from('tasks')
  .select(`
    *,
    user:users(id, email, full_name)
  `)
```

**Task with tags:**
```typescript
const { data } = await supabase
  .from('tasks')
  .select(`
    *,
    task_tags(
      tag:tags(id, name)
    )
  `)
```

**Nested relationships:**
```typescript
const { data } = await supabase
  .from('projects')
  .select(`
    *,
    tasks(
      *,
      comments(
        *,
        user:users(full_name)
      )
    )
  `)
```

### Service Layer with Joins

```typescript
export const projectService = {
  async getProjectWithTasks(projectId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        description,
        tasks (
          id,
          title,
          completed,
          assignee:users!tasks_assignee_id_fkey (
            id,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('id', projectId)
      .single()

    if (error) throw error
    return data
  }
}
```

---

## Complex Queries

### Filtering

**Multiple conditions:**
```typescript
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', userId)
  .eq('completed', false)
  .gte('due_date', new Date().toISOString())
  .order('priority', { ascending: false })
```

**OR conditions:**
```typescript
const { data } = await supabase
  .from('tasks')
  .select('*')
  .or('priority.eq.high,due_date.lt.2024-12-31')
```

**Text search:**
```typescript
const { data } = await supabase
  .from('tasks')
  .select('*')
  .ilike('title', '%meeting%')
```

**Range queries:**
```typescript
const { data } = await supabase
  .from('tasks')
  .select('*')
  .gte('created_at', startDate)
  .lte('created_at', endDate)
```

### Aggregations

**Count:**
```typescript
const { count } = await supabase
  .from('tasks')
  .select('*', { count: 'exact', head: true })
  .eq('completed', true)
```

**Using RPC for complex aggregations:**
```sql
CREATE OR REPLACE FUNCTION get_task_stats(p_user_id UUID)
RETURNS TABLE (
  total_tasks BIGINT,
  completed_tasks BIGINT,
  pending_tasks BIGINT,
  completion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_tasks,
    COUNT(*) FILTER (WHERE completed = true)::BIGINT as completed_tasks,
    COUNT(*) FILTER (WHERE completed = false)::BIGINT as pending_tasks,
    ROUND(
      (COUNT(*) FILTER (WHERE completed = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as completion_rate
  FROM tasks
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

```typescript
const { data } = await supabase
  .rpc('get_task_stats', { p_user_id: userId })
```

---

## Transactions

Supabase doesn't support client-side transactions, but you can use database functions:

```sql
CREATE OR REPLACE FUNCTION transfer_task(
  p_task_id UUID,
  p_from_user_id UUID,
  p_to_user_id UUID
)
RETURNS void AS $$
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM tasks
    WHERE id = p_task_id AND user_id = p_from_user_id
  ) THEN
    RAISE EXCEPTION 'Task not found or unauthorized';
  END IF;

  -- Transfer task
  UPDATE tasks
  SET user_id = p_to_user_id
  WHERE id = p_task_id;

  -- Log transfer
  INSERT INTO task_transfers (task_id, from_user_id, to_user_id)
  VALUES (p_task_id, p_from_user_id, p_to_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

```typescript
await supabase.rpc('transfer_task', {
  p_task_id: taskId,
  p_from_user_id: fromUserId,
  p_to_user_id: toUserId
})
```

---

## Real-time Subscriptions

### Subscribe to Table Changes

```typescript
useEffect(() => {
  const channel = supabase
    .channel('tasks-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('Change received!', payload)

        if (payload.eventType === 'INSERT') {
          setTasks(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev =>
            prev.map(task =>
              task.id === payload.new.id ? payload.new : task
            )
          )
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(task => task.id !== payload.old.id))
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [userId])
```

### Subscribe to Presence

Track online users:

```typescript
const channel = supabase.channel('online-users')

// Track presence
channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    console.log('Online users:', state)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: user.id,
        online_at: new Date().toISOString(),
      })
    }
  })
```

---

## Performance Optimization

### Indexes

```sql
-- Single column index
CREATE INDEX idx_tasks_completed ON tasks(completed);

-- Composite index
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);

-- Partial index (only incomplete tasks)
CREATE INDEX idx_tasks_incomplete ON tasks(user_id)
WHERE completed = false;

-- Full-text search index
CREATE INDEX idx_tasks_title_search ON tasks
USING GIN (to_tsvector('english', title));
```

### Query Optimization

**Use select() to fetch only needed columns:**
```typescript
// Bad: Fetches all columns
const { data } = await supabase.from('tasks').select('*')

// Good: Only fetch what you need
const { data } = await supabase.from('tasks').select('id, title, completed')
```

**Use count with head:**
```typescript
// Bad: Fetches all rows then counts in JS
const { data } = await supabase.from('tasks').select('*')
const count = data.length

// Good: Database counts, doesn't return rows
const { count } = await supabase
  .from('tasks')
  .select('*', { count: 'exact', head: true })
```

**Use pagination:**
```typescript
const { data } = await supabase
  .from('tasks')
  .select('*')
  .range(0, 19) // First 20 items
```

---

## Database Functions

### Computed Columns

```sql
CREATE OR REPLACE FUNCTION task_is_overdue(task tasks)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN task.due_date < NOW() AND NOT task.completed;
END;
$$ LANGUAGE plpgsql STABLE;
```

Usage:
```typescript
const { data } = await supabase
  .from('tasks')
  .select('*, is_overdue:task_is_overdue()')
```

### Triggers

```sql
-- Auto-update task count
CREATE OR REPLACE FUNCTION update_task_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET task_count = (
    SELECT COUNT(*) FROM tasks WHERE user_id = NEW.user_id
  )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_count_trigger
AFTER INSERT OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_task_count();
```

---

## Full-Text Search

### Setup

```sql
-- Add tsvector column
ALTER TABLE tasks ADD COLUMN search_vector tsvector;

-- Create index
CREATE INDEX idx_tasks_search ON tasks USING GIN (search_vector);

-- Auto-update search vector
CREATE TRIGGER tasks_search_vector_update
BEFORE INSERT OR UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(
  search_vector, 'pg_catalog.english', title, description
);
```

### Search Query

```typescript
const { data } = await supabase
  .from('tasks')
  .select('*')
  .textSearch('search_vector', 'meeting & report')
```

---

## Data Validation

### Check Constraints

```sql
ALTER TABLE tasks
ADD CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high'));

ALTER TABLE tasks
ADD CONSTRAINT valid_dates CHECK (due_date >= created_at);
```

### Domain Validation

```sql
CREATE DOMAIN email AS TEXT
CHECK (VALUE ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

ALTER TABLE users ALTER COLUMN email TYPE email;
```

---

## Migration Strategies

### Safe Migrations

```sql
-- 1. Add new column (nullable first)
ALTER TABLE tasks ADD COLUMN priority TEXT;

-- 2. Backfill data
UPDATE tasks SET priority = 'medium' WHERE priority IS NULL;

-- 3. Make NOT NULL
ALTER TABLE tasks ALTER COLUMN priority SET NOT NULL;

-- 4. Add default
ALTER TABLE tasks ALTER COLUMN priority SET DEFAULT 'medium';
```

### Zero-Downtime Migrations

```sql
-- Instead of renaming column (breaks old code):
-- ALTER TABLE tasks RENAME COLUMN desc TO description;

-- Create new column
ALTER TABLE tasks ADD COLUMN description TEXT;

-- Copy data
UPDATE tasks SET description = desc;

-- Keep both columns during migration
-- Old code uses 'desc'
-- New code uses 'description'

-- After deploy, drop old column
-- ALTER TABLE tasks DROP COLUMN desc;
```

---

## Best Practices Summary

### Schema Design
- ✅ Use UUIDs for primary keys
- ✅ Add indexes for foreign keys
- ✅ Use CASCADE for delete operations
- ✅ Add constraints for data integrity
- ✅ Use timestamps (created_at, updated_at)

### Queries
- ✅ Select only needed columns
- ✅ Use indexes for filtered columns
- ✅ Paginate large result sets
- ✅ Use RPC for complex operations
- ✅ Batch similar queries

### RLS Policies
- ✅ Always enable RLS
- ✅ Test policies thoroughly
- ✅ Use functions for complex policies
- ✅ Consider performance impact
- ✅ Document policy intent

### Migrations
- ✅ Make migrations reversible
- ✅ Test on staging first
- ✅ Use transactions where possible
- ✅ Plan for zero-downtime
- ✅ Keep migrations small

---

## Next Steps

**[Tutorial 5: Deployment →](./05-deployment.md)**

Learn how to:
- Build production apps
- Submit to App Store and Play Store
- Set up CI/CD
- Monitor and debug production

---

**Resources:**
- [Supabase Database Docs](https://supabase.com/docs/guides/database)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Database Best Practices](../../03-database/SCHEMA-BEST-PRACTICES.md)
