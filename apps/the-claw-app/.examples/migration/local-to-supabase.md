# Local to Supabase Migration Guide

Complete step-by-step guide for migrating data from AsyncStorage to Supabase.

## Overview

This guide walks through migrating a React Native app from local AsyncStorage to Supabase, using tasks as an example.

**Timeline:** 2-4 weeks for production migration
**Recommended approach:** Gradual migration with dual-write phase

## Prerequisites

Before starting:

- Supabase project created and configured
- Database schema matches local data structure
- RLS policies tested and working
- TypeScript types generated
- App version control ready
- Test devices available

## Step-by-Step Migration

### Phase 1: Preparation (Day 1-2)

#### Step 1.1: Audit Current Data

Understand what data you're migrating:

```typescript
// audit-local-data.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DataAudit {
  totalKeys: number;
  totalSize: number;
  keysByPrefix: Record<string, number>;
  sampleData: Record<string, unknown>;
}

export async function auditLocalData(): Promise<DataAudit> {
  const keys = await AsyncStorage.getAllKeys();
  const keysByPrefix: Record<string, number> = {};
  let totalSize = 0;
  const sampleData: Record<string, unknown> = {};

  // Group by prefix
  for (const key of keys) {
    const prefix = key.split('_')[0];
    keysByPrefix[prefix] = (keysByPrefix[prefix] || 0) + 1;
  }

  // Get sample data and calculate size
  for (const [prefix, count] of Object.entries(keysByPrefix)) {
    const sampleKey = keys.find((k) => k.startsWith(prefix));
    if (sampleKey) {
      const value = await AsyncStorage.getItem(sampleKey);
      sampleData[prefix] = value ? JSON.parse(value) : null;

      if (value) {
        totalSize += value.length;
      }
    }
  }

  return {
    totalKeys: keys.length,
    totalSize,
    keysByPrefix,
    sampleData,
  };
}

// Run audit
auditLocalData().then((audit) => {
  console.log('=== Local Data Audit ===');
  console.log(`Total keys: ${audit.totalKeys}`);
  console.log(`Total size: ${(audit.totalSize / 1024).toFixed(2)} KB`);
  console.log('\nKeys by prefix:');
  Object.entries(audit.keysByPrefix).forEach(([prefix, count]) => {
    console.log(`  ${prefix}: ${count} items`);
  });
  console.log('\nSample data:');
  console.log(JSON.stringify(audit.sampleData, null, 2));
});
```

**Run and save output:**
```bash
npx ts-node audit-local-data.ts > audit-report.txt
```

#### Step 1.2: Create Backup

Always backup before migration:

```typescript
// backup-local-data.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export async function backupLocalData(): Promise<string> {
  const keys = await AsyncStorage.getAllKeys();
  const backup: Record<string, string> = {};

  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      backup[key] = value;
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.json`;
  const filepath = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(
    filepath,
    JSON.stringify(backup, null, 2)
  );

  console.log(`Backup saved to: ${filepath}`);
  console.log(`Total items: ${keys.length}`);

  return filepath;
}
```

**Test backup:**
```bash
npx ts-node backup-local-data.ts
```

#### Step 1.3: Verify Supabase Schema

Ensure database matches local structure:

```typescript
// verify-schema.ts
import { supabase } from '@/services/supabase';

interface SchemaCheck {
  table: string;
  exists: boolean;
  columns?: string[];
  rlsEnabled?: boolean;
  policies?: number;
}

export async function verifySchema(): Promise<SchemaCheck[]> {
  const checks: SchemaCheck[] = [];

  // Check tasks table
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .limit(1);

  checks.push({
    table: 'tasks',
    exists: !tasksError,
    columns: tasks && tasks[0] ? Object.keys(tasks[0]) : [],
  });

  // Check RLS policies (requires service role)
  // This would typically be done in SQL Editor

  return checks;
}

// Run verification
verifySchema().then((checks) => {
  console.log('=== Schema Verification ===\n');

  checks.forEach((check) => {
    console.log(`Table: ${check.table}`);
    console.log(`  Exists: ${check.exists ? '✓' : '✗'}`);

    if (check.columns) {
      console.log(`  Columns: ${check.columns.join(', ')}`);
    }

    console.log('');
  });
});
```

**Expected columns for tasks:**
- `id` (UUID)
- `user_id` (UUID)
- `title` (TEXT)
- `description` (TEXT)
- `completed` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### Step 1.4: Test RLS Policies

Verify users can only access their own data:

```typescript
// test-rls.ts
import { supabase } from '@/services/supabase';

export async function testRLS() {
  // Sign in test user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'testpassword',
  });

  if (authError) {
    console.error('Auth failed:', authError);
    return;
  }

  console.log('Authenticated as:', authData.user.email);

  // Try to insert
  const { data: inserted, error: insertError } = await supabase
    .from('tasks')
    .insert({
      title: 'RLS Test Task',
      description: 'Testing RLS policies',
      completed: false,
    })
    .select()
    .single();

  console.log('Insert:', insertError ? '✗ ' + insertError.message : '✓ Success');

  // Try to read
  const { data: tasks, error: readError } = await supabase
    .from('tasks')
    .select('*');

  console.log('Read:', readError ? '✗ ' + readError.message : `✓ Got ${tasks?.length} tasks`);

  // Clean up
  if (inserted) {
    await supabase.from('tasks').delete().eq('id', inserted.id);
  }

  await supabase.auth.signOut();
}
```

### Phase 2: Dual Write (Week 1-2)

#### Step 2.1: Implement Dual Write

Write to both local and Supabase:

```typescript
// services/taskService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import type { Task } from '@/types/task';

export async function saveTask(task: Task): Promise<void> {
  // 1. Write to local (fast, reliable)
  await AsyncStorage.setItem(`task_${task.id}`, JSON.stringify(task));

  // 2. Write to Supabase (slower, can fail)
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('tasks').upsert({
        id: task.id,
        user_id: user.id,
        title: task.title,
        description: task.description,
        completed: task.completed,
        created_at: task.createdAt,
        updated_at: task.updatedAt,
      });

      // Mark as synced
      await AsyncStorage.setItem(`task_${task.id}_synced`, 'true');
    }
  } catch (error) {
    // Log but don't block user
    console.error('Supabase sync failed:', error);

    // Mark for retry
    await AsyncStorage.setItem(`task_${task.id}_synced`, 'false');
  }
}

export async function deleteTask(id: string): Promise<void> {
  // Delete from local
  await AsyncStorage.removeItem(`task_${id}`);
  await AsyncStorage.removeItem(`task_${id}_synced`);

  // Delete from Supabase
  try {
    await supabase.from('tasks').delete().eq('id', id);
  } catch (error) {
    console.error('Supabase delete failed:', error);
  }
}
```

#### Step 2.2: Background Sync

Periodically sync unsynced items:

```typescript
// services/syncService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import type { Task } from '@/types/task';

export async function syncUnsyncedTasks(): Promise<number> {
  const keys = await AsyncStorage.getAllKeys();
  const taskKeys = keys.filter((k) => k.startsWith('task_') && !k.endsWith('_synced'));

  let syncedCount = 0;

  for (const key of taskKeys) {
    const taskId = key.replace('task_', '');
    const syncedFlag = await AsyncStorage.getItem(`task_${taskId}_synced`);

    // Skip if already synced
    if (syncedFlag === 'true') continue;

    const taskJson = await AsyncStorage.getItem(key);
    if (!taskJson) continue;

    const task: Task = JSON.parse(taskJson);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('tasks').upsert({
          id: task.id,
          user_id: user.id,
          title: task.title,
          description: task.description,
          completed: task.completed,
          created_at: task.createdAt,
          updated_at: task.updatedAt,
        });

        await AsyncStorage.setItem(`task_${taskId}_synced`, 'true');
        syncedCount++;
      }
    } catch (error) {
      console.error(`Failed to sync task ${taskId}:`, error);
    }
  }

  return syncedCount;
}

// Hook to run sync periodically
export function useSyncService() {
  useEffect(() => {
    // Sync on mount
    syncUnsyncedTasks();

    // Sync every 5 minutes
    const interval = setInterval(syncUnsyncedTasks, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}
```

#### Step 2.3: Monitor Sync Status

Add UI to show sync status:

```typescript
// components/SyncStatus.tsx
import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function SyncStatus() {
  const [status, setStatus] = useState<{
    total: number;
    synced: number;
    unsynced: number;
  }>({ total: 0, synced: 0, unsynced: 0 });

  useEffect(() => {
    async function checkStatus() {
      const keys = await AsyncStorage.getAllKeys();
      const taskKeys = keys.filter((k) => k.startsWith('task_') && !k.endsWith('_synced'));

      let synced = 0;
      for (const key of taskKeys) {
        const taskId = key.replace('task_', '');
        const syncedFlag = await AsyncStorage.getItem(`task_${taskId}_synced`);
        if (syncedFlag === 'true') synced++;
      }

      setStatus({
        total: taskKeys.length,
        synced,
        unsynced: taskKeys.length - synced,
      });
    }

    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Every 10s

    return () => clearInterval(interval);
  }, []);

  if (status.unsynced === 0) {
    return <Text>All tasks synced ✓</Text>;
  }

  return (
    <View>
      <Text>Syncing: {status.synced}/{status.total}</Text>
      {status.unsynced > 0 && (
        <Text style={{ color: 'orange' }}>
          {status.unsynced} tasks pending sync
        </Text>
      )}
    </View>
  );
}
```

### Phase 3: Full Migration (Week 2-3)

#### Step 3.1: Run Migration Script

Use the provided migration script:

```bash
# Dry run first
npx ts-node .examples/migration/migrate-tasks.ts --dry-run

# Check output
# If looks good, run actual migration
npx ts-node .examples/migration/migrate-tasks.ts
```

#### Step 3.2: Verify Migration

Check data integrity:

```bash
npx ts-node .examples/migration/verify-migration.ts
```

**Expected output:**
```
=== Migration Verification ===

Local tasks: 150
Supabase tasks: 150
Match: ✓

Checking sample tasks...
✓ Task abc123: title, description, completed match
✓ Task def456: title, description, completed match
...

All checks passed!
```

#### Step 3.3: Switch to Supabase Reads

Update app to read from Supabase:

```typescript
// services/taskService.ts
export async function getTasks(): Promise<Task[]> {
  try {
    // Read from Supabase first
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      completed: row.completed,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  } catch (error) {
    console.error('Supabase read failed, using local:', error);

    // Fallback to local
    return getTasksFromLocal();
  }
}

async function getTasksFromLocal(): Promise<Task[]> {
  const keys = await AsyncStorage.getAllKeys();
  const taskKeys = keys.filter((k) => k.startsWith('task_') && !k.endsWith('_synced'));

  const tasks: Task[] = [];

  for (const key of taskKeys) {
    const json = await AsyncStorage.getItem(key);
    if (json) {
      tasks.push(JSON.parse(json));
    }
  }

  return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
```

### Phase 4: Cleanup (Week 3-4)

#### Step 4.1: Remove Local Storage Code

After verifying migration works:

```typescript
// Remove all AsyncStorage task code
// Keep only for offline caching if needed

export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(transformTask);
}

export async function saveTask(task: Task): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  await supabase.from('tasks').upsert({
    id: task.id,
    user_id: user.id,
    title: task.title,
    description: task.description,
    completed: task.completed,
  });
}
```

#### Step 4.2: Clear Local Data

Optionally clear old local data:

```typescript
// In app settings
export async function clearMigratedData() {
  const keys = await AsyncStorage.getAllKeys();
  const taskKeys = keys.filter((k) => k.startsWith('task_'));

  await AsyncStorage.multiRemove(taskKeys);

  console.log(`Cleared ${taskKeys.length} local tasks`);
}
```

## Rollback Procedure

If migration fails, rollback:

### Option 1: Keep Using Local Storage

```typescript
// Disable Supabase, use local only
export async function getTasks(): Promise<Task[]> {
  return getTasksFromLocal();
}

export async function saveTask(task: Task): Promise<void> {
  await AsyncStorage.setItem(`task_${task.id}`, JSON.stringify(task));
}
```

### Option 2: Restore from Backup

```typescript
// rollback.ts (see rollback.ts file)
import { restoreFromBackup } from '.examples/migration/rollback';

await restoreFromBackup('backup-2026-02-05T10-30-00.json');
```

### Option 3: Delete Supabase Data

```sql
-- In Supabase SQL Editor
-- WARNING: This deletes all tasks for current user
DELETE FROM tasks WHERE user_id = auth.uid();
```

## Verification Checklist

After migration:

- [ ] All local tasks present in Supabase
- [ ] Task counts match (local vs remote)
- [ ] Sample tasks have correct data
- [ ] New tasks save to Supabase
- [ ] Edited tasks update in Supabase
- [ ] Deleted tasks remove from Supabase
- [ ] Multiple devices sync correctly
- [ ] RLS prevents seeing other users' data
- [ ] Offline mode works (if implemented)
- [ ] Performance is acceptable (<2s for 100 tasks)

## Troubleshooting

See main `README.md` troubleshooting section for common issues.

## Next Steps

1. Monitor for 1 week
2. Keep rollback code for 2 weeks
3. Remove local storage code
4. Update documentation
5. Train team on new patterns
