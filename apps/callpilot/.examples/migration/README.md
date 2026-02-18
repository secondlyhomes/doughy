# Migration Tools

Complete toolkit for migrating data from local storage (AsyncStorage) to Supabase.

## When to Migrate

Migrate from local storage to Supabase when you:

- Need data sync across devices
- Want to share data between users
- Require server-side validation
- Need real-time collaboration
- Want centralized backup/restore
- Are adding authentication
- Need to scale beyond single-device usage

## Pre-Migration Checklist

Before starting migration:

- [ ] **Backup existing data** - Export all AsyncStorage data
- [ ] **Supabase setup complete** - Database, RLS policies, types generated
- [ ] **Test environment ready** - Local Supabase running for testing
- [ ] **User authentication working** - Users can sign up/log in
- [ ] **Schema matches local data** - Database tables match AsyncStorage structure
- [ ] **RLS policies tested** - Users can read/write their own data
- [ ] **Rollback plan ready** - Know how to revert if issues occur
- [ ] **App version updated** - Bump version to track migration
- [ ] **Testing device available** - Physical device for testing
- [ ] **Network connectivity** - Stable internet for migration

## Migration Strategies

### 1. Big Bang Migration

**Best for:** New apps, small user bases (<100 users), beta testing

**Process:**
1. Deploy app update with migration code
2. On first launch, migrate all data
3. Switch to Supabase-only mode
4. Keep local backup for rollback

**Pros:**
- Clean cutover
- Simpler code
- Single deployment

**Cons:**
- Risky for large datasets
- All-or-nothing approach
- Requires downtime or blocking UI

**Example:**
```typescript
// App.tsx
useEffect(() => {
  async function migrateIfNeeded() {
    const migrated = await AsyncStorage.getItem('migration_completed');

    if (!migrated) {
      setMigrationStatus('in_progress');
      await performFullMigration();
      await AsyncStorage.setItem('migration_completed', 'true');
      setMigrationStatus('completed');
    }
  }

  migrateIfNeeded();
}, []);
```

---

### 2. Gradual Migration (Recommended)

**Best for:** Production apps, large user bases, risk mitigation

**Process:**
1. Deploy dual-write mode (write to both local + Supabase)
2. Background sync local data to Supabase
3. Monitor and verify data integrity
4. Switch reads to Supabase
5. Remove local storage code

**Phases:**

**Phase 1 - Dual Write (Week 1-2):**
```typescript
// Write to both sources
async function saveTask(task: Task) {
  // Write to local first (fast)
  await AsyncStorage.setItem(`task_${task.id}`, JSON.stringify(task));

  // Write to Supabase (slower, can fail)
  try {
    await supabase.from('tasks').upsert(task);
  } catch (error) {
    // Log but don't block user
    console.error('Supabase sync failed:', error);
  }
}
```

**Phase 2 - Background Sync (Week 2-3):**
```typescript
// Periodically sync local to Supabase
async function syncLocalToSupabase() {
  const localTasks = await getAllLocalTasks();

  for (const task of localTasks) {
    try {
      await supabase.from('tasks').upsert(task);
      await markTaskAsSynced(task.id);
    } catch (error) {
      console.error(`Failed to sync task ${task.id}:`, error);
    }
  }
}

// Run on app start and periodically
useEffect(() => {
  syncLocalToSupabase();
  const interval = setInterval(syncLocalToSupabase, 60000); // Every minute
  return () => clearInterval(interval);
}, []);
```

**Phase 3 - Read from Supabase (Week 3-4):**
```typescript
// Read from Supabase, fallback to local
async function getTask(id: string): Promise<Task> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (data) return data;
  } catch (error) {
    console.warn('Supabase read failed, using local:', error);
  }

  // Fallback to local
  const local = await AsyncStorage.getItem(`task_${id}`);
  return local ? JSON.parse(local) : null;
}
```

**Phase 4 - Cleanup (Week 4+):**
```typescript
// Remove local storage code
// Keep local cache for offline support only
```

**Pros:**
- Low risk
- Gradual rollout
- Easy to rollback
- Data verification at each stage

**Cons:**
- More complex code
- Longer timeline
- Requires monitoring

---

### 3. User-Triggered Migration

**Best for:** Apps with infrequent users, optional cloud sync

**Process:**
1. Add "Sync to Cloud" button in settings
2. User initiates migration when ready
3. Show progress and completion status
4. Keep local data until user deletes

**Example:**
```typescript
function SettingsScreen() {
  const [migrationState, setMigrationState] = useState<'idle' | 'running' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);

  async function handleSyncToCloud() {
    setMigrationState('running');

    await migrateToSupabase({
      onProgress: (percent) => setProgress(percent),
    });

    setMigrationState('completed');
  }

  return (
    <View>
      {migrationState === 'idle' && (
        <Button onPress={handleSyncToCloud}>
          Sync to Cloud
        </Button>
      )}

      {migrationState === 'running' && (
        <ProgressBar progress={progress} />
      )}

      {migrationState === 'completed' && (
        <Text>Cloud sync complete!</Text>
      )}
    </View>
  );
}
```

**Pros:**
- User control
- Opt-in approach
- No forced migration

**Cons:**
- Some users never migrate
- Dual codebase longer
- Support complexity

## Migration Scripts

| Script | Purpose |
|--------|---------|
| `migrate-auth.ts` | Migrate authentication data |
| `migrate-tasks.ts` | Migrate task data from AsyncStorage |
| `verify-migration.ts` | Verify data integrity after migration |
| `rollback.ts` | Revert to local storage if needed |

## Utilities

| File | Purpose |
|------|---------|
| `migrationHelper.ts` | Common migration functions |
| `dataTransform.ts` | Transform data between formats |

## Guides

| Guide | Description |
|-------|-------------|
| `local-to-supabase.md` | Step-by-step migration guide |
| `bulk-operations.md` | Bulk insert/update patterns |

## Quick Start

### 1. Test Migration Locally

```bash
# Start local Supabase
supabase start

# Run dry-run migration
npx ts-node .examples/migration/migrate-tasks.ts --dry-run

# Verify output
npx ts-node .examples/migration/verify-migration.ts
```

### 2. Test on Device

```bash
# Build and install on test device
npx expo run:ios --device

# Monitor logs
npx expo start --clear

# Check migration status in app
# Settings > Developer > Migration Status
```

### 3. Deploy to Production

```bash
# Bump version
npm version minor

# Build production
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

## Testing Migration

### Unit Tests

```bash
npm test -- migration
```

### Integration Tests

```bash
# Test full migration flow
npm test -- --testPathPattern=integration/migration.test.ts
```

### Manual Testing Checklist

- [ ] **Fresh install** - Migration works on new install
- [ ] **Existing user** - Migration works with existing data
- [ ] **Large dataset** - Test with 100+ items
- [ ] **Network errors** - Test offline/flaky connection
- [ ] **Duplicate data** - Verify no duplicates created
- [ ] **Data integrity** - All fields migrated correctly
- [ ] **Performance** - Migration completes in reasonable time
- [ ] **Rollback** - Can revert to local storage
- [ ] **Multiple devices** - Data syncs correctly
- [ ] **RLS policies** - Users only see their data

## Troubleshooting

### Migration Hangs

**Symptom:** Migration never completes

**Solutions:**
- Check network connectivity
- Verify Supabase is reachable
- Check for rate limiting
- Reduce batch size
- Add timeout handling

```typescript
// Add timeout
const timeout = setTimeout(() => {
  throw new Error('Migration timeout after 5 minutes');
}, 5 * 60 * 1000);

await performMigration();
clearTimeout(timeout);
```

---

### Duplicate Data

**Symptom:** Same item appears multiple times

**Solutions:**
- Use `upsert` instead of `insert`
- Add unique constraints
- Check for duplicate IDs
- Verify deduplication logic

```typescript
// Use upsert to prevent duplicates
await supabase
  .from('tasks')
  .upsert(tasks, { onConflict: 'id' });
```

---

### RLS Policy Errors

**Symptom:** "Row Level Security policy violation"

**Solutions:**
- Verify user is authenticated
- Check policy conditions
- Test policies in SQL Editor
- Add logging to debug

```typescript
// Check authentication before migration
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  throw new Error('User must be authenticated to migrate');
}
```

---

### Performance Issues

**Symptom:** Migration takes >5 minutes

**Solutions:**
- Batch inserts (100-500 items per batch)
- Use bulk operations
- Add progress indicators
- Run in background

```typescript
// Batch operations
const BATCH_SIZE = 100;
const batches = chunk(tasks, BATCH_SIZE);

for (const batch of batches) {
  await supabase.from('tasks').insert(batch);
  updateProgress(batches.indexOf(batch) / batches.length);
}
```

---

### Data Loss

**Symptom:** Some data missing after migration

**Solutions:**
- Always backup before migration
- Verify counts match
- Check error logs
- Use transactions where possible
- Keep local data until verified

```typescript
// Verify counts
const localCount = await getLocalTaskCount();
const { count: remoteCount } = await supabase
  .from('tasks')
  .select('*', { count: 'exact', head: true });

if (localCount !== remoteCount) {
  throw new Error(`Count mismatch: local=${localCount}, remote=${remoteCount}`);
}
```

## Support

For issues:
1. Check logs in `migration-logs.json`
2. Review troubleshooting section
3. Test rollback procedure
4. Create GitHub issue with logs

## Next Steps

After successful migration:

1. **Monitor for 1 week** - Watch error rates, performance
2. **Keep rollback code** - Don't remove for 1-2 weeks
3. **Clean up local storage** - Remove old AsyncStorage code
4. **Update documentation** - Document migration for team
5. **Celebrate!** - Migration is hard, you did it!
