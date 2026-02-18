# Migration Quick Reference

One-page reference for common migration tasks.

## Quick Commands

```bash
# Test migration (dry run)
npx ts-node .examples/migration/migrate-tasks.ts --dry-run

# Run migration
npx ts-node .examples/migration/migrate-tasks.ts

# Verify migration
npx ts-node .examples/migration/verify-migration.ts

# List backups
npx ts-node .examples/migration/rollback.ts --list

# Rollback
npx ts-node .examples/migration/rollback.ts <backup-file>
```

## Migration Checklist

### Pre-Migration

- [ ] Supabase project created
- [ ] Database schema matches local
- [ ] RLS policies tested
- [ ] Types generated (`supabase gen types`)
- [ ] User can authenticate
- [ ] Backup created
- [ ] Migration tested in dev

### During Migration

- [ ] Run dry-run first
- [ ] Check dry-run output
- [ ] Run actual migration
- [ ] Monitor progress
- [ ] Note any errors

### Post-Migration

- [ ] Verify data counts match
- [ ] Check sample data integrity
- [ ] Test CRUD operations
- [ ] Test on physical device
- [ ] Monitor for 1 week
- [ ] Remove old code

## Common Patterns

### Export Local Data

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const keys = await AsyncStorage.getAllKeys();
const taskKeys = keys.filter(k => k.startsWith('task_'));
const tasks = await AsyncStorage.multiGet(taskKeys);
```

### Batch Insert

```typescript
const BATCH_SIZE = 100;

for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
  const batch = tasks.slice(i, i + BATCH_SIZE);
  await supabase.from('tasks').insert(batch);
}
```

### Upsert (Insert or Update)

```typescript
await supabase
  .from('tasks')
  .upsert(tasks, { onConflict: 'id' });
```

### Verify Counts

```typescript
const { count } = await supabase
  .from('tasks')
  .select('*', { count: 'exact', head: true });

console.log(`Remote: ${count}, Local: ${localCount}`);
```

### Progress Tracking

```typescript
await migrateTasks({
  onProgress: (progress) => {
    console.log(`${progress.current}/${progress.total}`);
  },
});
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Count mismatch | Re-run migration, check for duplicates |
| RLS policy error | Verify user authenticated, check policies |
| Timeout | Reduce batch size, add delays |
| Duplicate data | Use upsert instead of insert |
| Rate limiting | Add 100ms delay between batches |
| Memory issues | Reduce batch size to 50 or less |
| Network errors | Implement retry logic with backoff |

## Key Functions

### Migration Helper

```typescript
import {
  createBackup,
  batchUpsert,
  verifyCount,
  verifySample,
  requireAuthentication,
} from './migrationHelper';
```

### Data Transform

```typescript
import {
  transformTaskToSupabase,
  transformTaskToLocal,
  validateLocalTask,
  deduplicateTasks,
} from './dataTransform';
```

## File Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| `README.md` | Full documentation | Starting migration |
| `local-to-supabase.md` | Step-by-step guide | First time migration |
| `bulk-operations.md` | Bulk operation patterns | Performance optimization |
| `migrate-tasks.ts` | Task migration script | Migrate task data |
| `migrate-auth.ts` | Auth migration script | Add authentication |
| `verify-migration.ts` | Verification script | After migration |
| `rollback.ts` | Rollback script | If migration fails |
| `migrationHelper.ts` | Helper utilities | Building custom migration |
| `dataTransform.ts` | Data transformers | Custom data types |

## Emergency Rollback

```bash
# List backups
npx ts-node .examples/migration/rollback.ts --list

# Restore from backup
npx ts-node .examples/migration/rollback.ts "/path/to/backup.json"

# Restore and delete from Supabase
npx ts-node .examples/migration/rollback.ts "/path/to/backup.json" --delete-remote
```

## Migration Strategies

### Big Bang (Simple, Risky)

```typescript
// Single deployment, all at once
await migrateTasks();
await switchToSupabase();
```

### Gradual (Recommended)

```typescript
// Week 1: Dual write
await saveBoth(task);

// Week 2: Background sync
await syncLocalToSupabase();

// Week 3: Read from Supabase
await readFromSupabase();

// Week 4: Cleanup
await removeLocalCode();
```

### User-Triggered (Optional)

```typescript
// User initiates when ready
<Button onPress={handleMigrate}>
  Sync to Cloud
</Button>
```

## Performance Tips

1. **Batch size**: 100-500 for small records, 10-50 for large
2. **Parallel batches**: Process 3-5 batches concurrently
3. **Add delays**: 100ms between batches prevents rate limits
4. **Use upsert**: Idempotent, safe to retry
5. **Validate first**: Catch errors before uploading
6. **Progress feedback**: Keep users informed
7. **Retry logic**: Network fails, be resilient
8. **Test scale**: Test with production data volumes

## Code Snippets

### Custom Migration

```typescript
import { MigrationTracker, batchUpsert } from './migrationHelper';
import { transformBatchToSupabase } from './dataTransform';

async function customMigration() {
  const tracker = new MigrationTracker();

  // Export
  tracker.setPhase('export', 1);
  const local = await exportLocal();
  tracker.increment();

  // Transform
  tracker.setPhase('transform', local.length);
  const remote = transformBatchToSupabase(local, userId);
  tracker.increment(local.length);

  // Upload
  tracker.setPhase('upload', remote.length);
  await batchUpsert('tasks', remote, { batchSize: 100 });
  tracker.increment(remote.length);
}
```

### Dual Write Pattern

```typescript
async function saveTask(task: Task) {
  // Local first (fast)
  await AsyncStorage.setItem(`task_${task.id}`, JSON.stringify(task));

  // Supabase second (slower, can fail)
  try {
    await supabase.from('tasks').upsert(task);
    await AsyncStorage.setItem(`task_${task.id}_synced`, 'true');
  } catch (error) {
    console.error('Sync failed:', error);
  }
}
```

### Background Sync

```typescript
useEffect(() => {
  async function sync() {
    const unsynced = await getUnsyncedTasks();

    for (const task of unsynced) {
      try {
        await supabase.from('tasks').upsert(task);
        await markSynced(task.id);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  }

  sync();
  const interval = setInterval(sync, 5 * 60 * 1000); // Every 5 min

  return () => clearInterval(interval);
}, []);
```

## Resources

- **Full guide**: `local-to-supabase.md`
- **Bulk operations**: `bulk-operations.md`
- **Supabase docs**: https://supabase.com/docs
- **RLS guide**: https://supabase.com/docs/guides/auth/row-level-security
- **React Native guide**: https://supabase.com/docs/guides/getting-started/tutorials/with-react-native

## Support

1. Check error logs
2. Review troubleshooting section
3. Test with dry-run
4. Create GitHub issue with:
   - Migration script output
   - Error messages
   - Data counts (local vs remote)
   - Supabase version
