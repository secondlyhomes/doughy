# Bulk Operations Guide

Efficient patterns for bulk insert, update, and batch processing in Supabase.

## Bulk Insert

### Basic Bulk Insert

Insert multiple records at once:

```typescript
import { supabase } from '@/services/supabase';

interface Task {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
}

async function bulkInsertTasks(tasks: Task[]): Promise<void> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(tasks);

  if (error) {
    throw new Error(`Bulk insert failed: ${error.message}`);
  }

  console.log(`Inserted ${tasks.length} tasks`);
}
```

### Batched Insert

For large datasets, insert in batches:

```typescript
async function batchInsertTasks(
  tasks: Task[],
  batchSize = 100
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  // Split into batches
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);

    try {
      const { error } = await supabase
        .from('tasks')
        .insert(batch);

      if (error) {
        console.error(`Batch ${i / batchSize + 1} failed:`, error);
        failed += batch.length;
      } else {
        success += batch.length;
      }
    } catch (error) {
      console.error(`Batch ${i / batchSize + 1} error:`, error);
      failed += batch.length;
    }

    // Optional: Add delay to avoid rate limiting
    await sleep(100);
  }

  return { success, failed };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

### Insert with Progress Tracking

Show progress during bulk insert:

```typescript
async function bulkInsertWithProgress(
  tasks: Task[],
  onProgress: (current: number, total: number) => void
): Promise<void> {
  const batchSize = 100;
  let processed = 0;

  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);

    await supabase.from('tasks').insert(batch);

    processed += batch.length;
    onProgress(processed, tasks.length);
  }
}

// Usage
await bulkInsertWithProgress(tasks, (current, total) => {
  const percent = ((current / total) * 100).toFixed(1);
  console.log(`Progress: ${current}/${total} (${percent}%)`);
});
```

### Insert with Error Handling

Handle errors gracefully and retry failed batches:

```typescript
async function bulkInsertWithRetry(
  tasks: Task[],
  maxRetries = 3
): Promise<{ success: Task[]; failed: Task[] }> {
  const batchSize = 100;
  const success: Task[] = [];
  const failed: Task[] = [];

  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);

    let retries = 0;
    let succeeded = false;

    while (retries < maxRetries && !succeeded) {
      try {
        const { error } = await supabase
          .from('tasks')
          .insert(batch);

        if (error) {
          throw error;
        }

        success.push(...batch);
        succeeded = true;
      } catch (error) {
        retries++;
        console.error(`Batch failed (attempt ${retries}/${maxRetries}):`, error);

        if (retries < maxRetries) {
          // Wait before retrying (exponential backoff)
          await sleep(1000 * Math.pow(2, retries));
        } else {
          // Max retries reached
          failed.push(...batch);
        }
      }
    }
  }

  return { success, failed };
}
```

## Bulk Update

### Basic Bulk Update

Update multiple records matching a condition:

```typescript
async function bulkUpdateTasks(
  userId: string,
  updates: Partial<Task>
): Promise<void> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('user_id', userId)
    .eq('completed', false);

  if (error) {
    throw new Error(`Bulk update failed: ${error.message}`);
  }

  console.log(`Updated tasks`);
}

// Example: Mark all incomplete tasks as completed
await bulkUpdateTasks(userId, { completed: true });
```

### Update Multiple Specific Records

Update specific records by ID:

```typescript
async function updateTasksByIds(
  taskIds: string[],
  updates: Partial<Task>
): Promise<void> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .in('id', taskIds);

  if (error) {
    throw new Error(`Bulk update failed: ${error.message}`);
  }

  console.log(`Updated ${taskIds.length} tasks`);
}
```

### Batched Update

Update in batches for large datasets:

```typescript
async function batchUpdateTasks(
  taskIds: string[],
  updates: Partial<Task>,
  batchSize = 100
): Promise<void> {
  for (let i = 0; i < taskIds.length; i += batchSize) {
    const batch = taskIds.slice(i, i + batchSize);

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .in('id', batch);

    if (error) {
      console.error(`Batch update failed:`, error);
    }

    await sleep(100);
  }
}
```

## Upsert (Insert or Update)

### Basic Upsert

Insert new records or update existing ones:

```typescript
async function upsertTasks(tasks: Task[]): Promise<void> {
  const { data, error } = await supabase
    .from('tasks')
    .upsert(tasks, {
      onConflict: 'id', // Column to check for conflicts
    });

  if (error) {
    throw new Error(`Upsert failed: ${error.message}`);
  }

  console.log(`Upserted ${tasks.length} tasks`);
}
```

### Batched Upsert

Upsert in batches:

```typescript
async function batchUpsertTasks(
  tasks: Task[],
  batchSize = 100
): Promise<void> {
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);

    const { error } = await supabase
      .from('tasks')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Batch upsert failed:`, error);
    }

    await sleep(100);
  }
}
```

### Upsert with Custom Conflict Resolution

Use composite keys or multiple columns:

```typescript
async function upsertWithCompositeKey(tasks: Task[]): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .upsert(tasks, {
      onConflict: 'user_id,title', // Composite key
    });

  if (error) {
    throw new Error(`Upsert failed: ${error.message}`);
  }
}
```

## Bulk Delete

### Delete Multiple Records

Delete records matching a condition:

```typescript
async function bulkDeleteCompleted(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('user_id', userId)
    .eq('completed', true);

  if (error) {
    throw new Error(`Bulk delete failed: ${error.message}`);
  }

  console.log('Deleted completed tasks');
}
```

### Delete by IDs

Delete specific records:

```typescript
async function deleteTasksByIds(taskIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .in('id', taskIds);

  if (error) {
    throw new Error(`Bulk delete failed: ${error.message}`);
  }

  console.log(`Deleted ${taskIds.length} tasks`);
}
```

### Batched Delete

Delete in batches for large datasets:

```typescript
async function batchDeleteTasks(
  taskIds: string[],
  batchSize = 100
): Promise<void> {
  for (let i = 0; i < taskIds.length; i += batchSize) {
    const batch = taskIds.slice(i, i + batchSize);

    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', batch);

    if (error) {
      console.error(`Batch delete failed:`, error);
    }

    await sleep(100);
  }
}
```

## Performance Optimization

### 1. Use Transactions (Server-Side)

For atomic operations, use database functions:

```sql
-- Create function in Supabase SQL Editor
CREATE OR REPLACE FUNCTION bulk_complete_tasks(task_ids UUID[])
RETURNS void AS $$
BEGIN
  UPDATE tasks
  SET completed = true, updated_at = NOW()
  WHERE id = ANY(task_ids);
END;
$$ LANGUAGE plpgsql;
```

Call from TypeScript:

```typescript
async function bulkCompleteTasks(taskIds: string[]): Promise<void> {
  const { error } = await supabase.rpc('bulk_complete_tasks', {
    task_ids: taskIds,
  });

  if (error) {
    throw new Error(`Bulk complete failed: ${error.message}`);
  }
}
```

### 2. Optimize Batch Size

Find optimal batch size through testing:

```typescript
const OPTIMAL_BATCH_SIZES = {
  small_records: 500,  // <1KB per record
  medium_records: 100, // 1-10KB per record
  large_records: 10,   // >10KB per record
};

function getOptimalBatchSize(averageRecordSize: number): number {
  if (averageRecordSize < 1024) return 500;
  if (averageRecordSize < 10240) return 100;
  return 10;
}
```

### 3. Parallel Processing

Process multiple batches in parallel:

```typescript
async function parallelBatchInsert(
  tasks: Task[],
  batchSize = 100,
  concurrency = 3
): Promise<void> {
  const batches: Task[][] = [];

  // Create batches
  for (let i = 0; i < tasks.length; i += batchSize) {
    batches.push(tasks.slice(i, i + batchSize));
  }

  // Process batches in parallel (limited concurrency)
  for (let i = 0; i < batches.length; i += concurrency) {
    const batchGroup = batches.slice(i, i + concurrency);

    await Promise.all(
      batchGroup.map((batch) =>
        supabase.from('tasks').insert(batch)
      )
    );
  }
}
```

### 4. Use Select After Insert

Get inserted records back:

```typescript
async function insertAndGet(tasks: Task[]): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(tasks)
    .select(); // Return inserted records

  if (error) {
    throw new Error(`Insert failed: ${error.message}`);
  }

  return data || [];
}
```

### 5. Reduce Payload Size

Only send necessary fields:

```typescript
// Bad: Sending unnecessary fields
const tasks = localTasks.map((t) => ({
  ...t,
  _localId: t.id, // Don't send
  _synced: true,  // Don't send
}));

// Good: Only send required fields
const tasks = localTasks.map((t) => ({
  id: t.id,
  user_id: t.userId,
  title: t.title,
  description: t.description,
  completed: t.completed,
  created_at: t.createdAt,
  updated_at: t.updatedAt,
}));
```

## Real-World Examples

### Example 1: Migrate 10,000 Tasks

```typescript
async function migrate10kTasks() {
  const tasks = await exportLocalTasks(); // 10,000 tasks

  console.log(`Migrating ${tasks.length} tasks...`);

  const result = await batchInsertWithRetry(tasks, {
    batchSize: 100,
    maxRetries: 3,
    onProgress: (current, total) => {
      const percent = ((current / total) * 100).toFixed(1);
      console.log(`Progress: ${current}/${total} (${percent}%)`);
    },
  });

  console.log(`Success: ${result.success.length}`);
  console.log(`Failed: ${result.failed.length}`);

  if (result.failed.length > 0) {
    // Save failed items for retry
    await saveFailed(result.failed);
  }
}
```

### Example 2: Sync Data from Multiple Sources

```typescript
async function syncFromMultipleSources() {
  const sources = [
    { name: 'local', fetch: exportLocalTasks },
    { name: 'cache', fetch: exportCachedTasks },
    { name: 'temp', fetch: exportTempTasks },
  ];

  const allTasks: Task[] = [];

  for (const source of sources) {
    const tasks = await source.fetch();
    console.log(`Loaded ${tasks.length} tasks from ${source.name}`);
    allTasks.push(...tasks);
  }

  // Deduplicate
  const unique = deduplicateById(allTasks);
  console.log(`Total unique tasks: ${unique.length}`);

  // Upsert (handles both new and existing)
  await batchUpsertTasks(unique);
}

function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Map<string, T>();

  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.set(item.id, item);
    }
  }

  return Array.from(seen.values());
}
```

### Example 3: Archive Old Data

```typescript
async function archiveOldTasks(daysOld = 90): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  // Fetch old tasks
  const { data: oldTasks, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .lt('created_at', cutoffDate.toISOString())
    .limit(1000); // Process in chunks

  if (fetchError) {
    throw new Error(`Failed to fetch old tasks: ${fetchError.message}`);
  }

  if (!oldTasks || oldTasks.length === 0) {
    console.log('No old tasks to archive');
    return;
  }

  // Insert into archive table
  const { error: archiveError } = await supabase
    .from('tasks_archive')
    .insert(oldTasks);

  if (archiveError) {
    throw new Error(`Failed to archive tasks: ${archiveError.message}`);
  }

  // Delete from main table
  const taskIds = oldTasks.map((t) => t.id);
  const { error: deleteError } = await supabase
    .from('tasks')
    .delete()
    .in('id', taskIds);

  if (deleteError) {
    throw new Error(`Failed to delete archived tasks: ${deleteError.message}`);
  }

  console.log(`Archived ${oldTasks.length} tasks`);
}
```

## Best Practices

1. **Always use batching** - Don't insert 10,000 records at once
2. **Add progress tracking** - Users need feedback for long operations
3. **Implement retry logic** - Network can fail, be resilient
4. **Use upsert for idempotency** - Safe to run multiple times
5. **Test with production data volumes** - Don't just test with 10 records
6. **Monitor performance** - Track batch times and optimize
7. **Handle partial failures** - Save failed items for retry
8. **Add delays between batches** - Avoid rate limiting
9. **Use transactions for atomicity** - When order matters
10. **Validate before uploading** - Catch errors early

## Troubleshooting

### Rate Limiting

If you hit rate limits:

```typescript
async function insertWithRateLimit(
  tasks: Task[],
  requestsPerSecond = 10
): Promise<void> {
  const delayMs = 1000 / requestsPerSecond;
  const batchSize = 100;

  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);

    await supabase.from('tasks').insert(batch);
    await sleep(delayMs);
  }
}
```

### Memory Issues

For very large datasets, use streaming:

```typescript
async function* streamTasks(batchSize = 100): AsyncGenerator<Task[]> {
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .range(offset, offset + batchSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    yield data;
    offset += batchSize;
  }
}

// Usage
for await (const batch of streamTasks()) {
  await processBatch(batch);
}
```

### Connection Timeouts

Increase timeout for large operations:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(60000), // 60 second timeout
      });
    },
  },
});
```
