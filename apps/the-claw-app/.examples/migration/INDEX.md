# Migration Tools Index

Complete directory of migration tools and documentation.

## Documentation

### Main Guides

| File | Description | Use When |
|------|-------------|----------|
| **README.md** | Complete migration overview | Starting a migration project |
| **local-to-supabase.md** | Step-by-step migration guide | Following a structured migration |
| **bulk-operations.md** | Bulk operation patterns | Optimizing performance |
| **QUICK-REFERENCE.md** | One-page quick reference | Need quick answers |

### Getting Started

1. **First time?** Read `README.md` to understand migration strategies
2. **Ready to migrate?** Follow `local-to-supabase.md` step-by-step
3. **Need performance?** Check `bulk-operations.md` for optimization
4. **Quick lookup?** Use `QUICK-REFERENCE.md` for commands and patterns

## Scripts

### Migration Scripts

| File | Purpose | Command |
|------|---------|---------|
| **migrate-auth.ts** | Migrate authentication | `npx ts-node migrate-auth.ts --email user@example.com --password xxx` |
| **migrate-tasks.ts** | Migrate task data | `npx ts-node migrate-tasks.ts` |
| **verify-migration.ts** | Verify data integrity | `npx ts-node verify-migration.ts` |
| **rollback.ts** | Rollback migration | `npx ts-node rollback.ts <backup-file>` |

### Script Features

All migration scripts support:

- **Dry run mode** - `--dry-run` flag to preview changes
- **Progress tracking** - Real-time progress indicators
- **Error handling** - Graceful error recovery
- **Backup creation** - Automatic backup before migration
- **Rollback support** - Easy revert if needed

## Utilities

### Core Utilities

| File | Purpose | Key Exports |
|------|---------|-------------|
| **migrationHelper.ts** | Migration helpers | `MigrationTracker`, `createBackup`, `batchUpsert`, `verifyCount` |
| **dataTransform.ts** | Data transformers | `transformTaskToSupabase`, `validateLocalTask`, `deduplicateTasks` |

### Using Utilities

```typescript
// Import migration helpers
import {
  MigrationTracker,
  createBackup,
  batchUpsert,
  verifyCount,
  verifySample,
  requireAuthentication,
  logMigrationResult,
} from './migrationHelper';

// Import data transformers
import {
  transformTaskToSupabase,
  transformTaskToLocal,
  validateLocalTask,
  deduplicateTasks,
  sanitizeTask,
  analyzeTasks,
} from './dataTransform';
```

## Migration Workflows

### Workflow 1: Simple Migration (Small App)

```bash
# 1. Test migration
npx ts-node migrate-tasks.ts --dry-run

# 2. Run migration
npx ts-node migrate-tasks.ts

# 3. Verify
npx ts-node verify-migration.ts
```

**Use when:**
- Small user base (<100 users)
- Beta/test environment
- Can tolerate brief downtime

---

### Workflow 2: Gradual Migration (Production)

**Week 1: Dual Write**
```typescript
// Implement dual write in app
await saveLocal(task);
await saveSupabase(task);
```

**Week 2: Background Sync**
```bash
npx ts-node migrate-tasks.ts
```

**Week 3: Switch to Supabase**
```typescript
// Read from Supabase with local fallback
await readSupabase() || readLocal();
```

**Week 4: Cleanup**
```bash
# Verify then remove local code
npx ts-node verify-migration.ts
```

**Use when:**
- Production app
- Large user base
- Risk mitigation important

---

### Workflow 3: User-Triggered Migration

**Add UI in app:**
```typescript
<Button onPress={handleMigrate}>
  Sync to Cloud
</Button>
```

**Use when:**
- Optional cloud sync
- User control preferred
- Some users may stay offline

## Common Tasks

### Task: Migrate All Data

```bash
# 1. Auth
npx ts-node migrate-auth.ts --email user@example.com --password xxx

# 2. Tasks
npx ts-node migrate-tasks.ts

# 3. Verify
npx ts-node verify-migration.ts
```

---

### Task: Test Migration Safety

```bash
# Dry run all scripts
npx ts-node migrate-auth.ts --dry-run
npx ts-node migrate-tasks.ts --dry-run
npx ts-node verify-migration.ts --sample
```

---

### Task: Rollback Failed Migration

```bash
# 1. List backups
npx ts-node rollback.ts --list

# 2. Restore
npx ts-node rollback.ts "/path/to/backup.json"

# 3. Optionally delete from Supabase
npx ts-node rollback.ts "/path/to/backup.json" --delete-remote
```

---

### Task: Verify Data Integrity

```bash
# Quick verification (sample)
npx ts-node verify-migration.ts --sample

# Full verification
npx ts-node verify-migration.ts
```

---

### Task: Custom Migration

Create custom script using utilities:

```typescript
import { MigrationTracker, batchUpsert } from './migrationHelper';
import { transformBatchToSupabase } from './dataTransform';

async function migrateCustomData() {
  const tracker = new MigrationTracker();

  // Your custom logic here
  tracker.setPhase('export', 1);
  const data = await exportCustomData();
  tracker.increment();

  tracker.setPhase('transform', data.length);
  const transformed = transformData(data);
  tracker.increment(data.length);

  tracker.setPhase('upload', transformed.length);
  await batchUpsert('custom_table', transformed);
  tracker.increment(transformed.length);
}
```

## Troubleshooting Guide

### By Symptom

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| "relation does not exist" | Table not created | Check Supabase schema |
| "RLS policy violation" | Not authenticated | Verify auth, check policies |
| Count mismatch | Incomplete migration | Re-run migration script |
| Duplicate data | Running migration twice | Use upsert, check for duplicates |
| Timeout errors | Batch too large | Reduce batch size |
| Rate limiting | Too many requests | Add delays between batches |
| Memory errors | Dataset too large | Reduce batch size, use streaming |

### By Script

**migrate-tasks.ts errors:**
- Check authentication
- Verify Supabase connection
- Reduce batch size if timeout
- Check RLS policies

**verify-migration.ts errors:**
- Ensure migration completed
- Check network connection
- Verify user permissions

**rollback.ts errors:**
- Check backup file exists
- Verify file path correct
- Check permissions

## Performance Guidelines

### Batch Sizes

| Data Size | Batch Size | Rationale |
|-----------|------------|-----------|
| <1KB/record | 500 | Small payload, high throughput |
| 1-10KB/record | 100 | Medium payload, balanced |
| >10KB/record | 10-50 | Large payload, avoid timeout |

### Concurrency

| Operation | Concurrency | Notes |
|-----------|-------------|-------|
| Read | 5-10 | Safe to parallelize |
| Insert/Update | 3-5 | Moderate parallelization |
| Delete | 1-3 | Be conservative |

### Rate Limiting

- Add 100ms delay between batches
- Monitor for 429 errors
- Implement exponential backoff
- Use retry logic (max 3 attempts)

## File Structure

```
.examples/migration/
├── README.md                 # Main documentation
├── INDEX.md                  # This file
├── QUICK-REFERENCE.md        # One-page reference
├── local-to-supabase.md      # Step-by-step guide
├── bulk-operations.md        # Bulk operation patterns
├── migrate-auth.ts           # Auth migration script
├── migrate-tasks.ts          # Task migration script
├── verify-migration.ts       # Verification script
├── rollback.ts               # Rollback script
├── migrationHelper.ts        # Helper utilities
└── dataTransform.ts          # Data transformers
```

## Next Steps

### After Successful Migration

1. **Week 1:** Monitor app, watch for errors
2. **Week 2:** Keep rollback code, verify stability
3. **Week 3:** Clean up local storage code
4. **Week 4:** Update team documentation
5. **Week 5+:** Remove migration code (optional)

### Maintaining Migration Tools

- Update scripts when schema changes
- Test with new data types
- Document custom migrations
- Share learnings with team

## Resources

### Internal Documentation

- `docs/03-database/SUPABASE-SETUP.md` - Supabase setup
- `docs/patterns/SUPABASE-TABLE.md` - Table patterns
- `docs/09-security/SECURITY-CHECKLIST.md` - Security best practices

### External Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [React Native + Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-react-native)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

## Support

Need help?

1. Check `QUICK-REFERENCE.md` for common solutions
2. Review troubleshooting section in `README.md`
3. Run dry-run mode to debug
4. Check migration logs
5. Create GitHub issue with:
   - Script output
   - Error messages
   - Data counts
   - Environment details

## Version History

- **1.0.0** (2026-02-06) - Initial migration toolkit release
  - Auth migration script
  - Task migration script
  - Verification script
  - Rollback script
  - Helper utilities
  - Data transformers
  - Complete documentation
