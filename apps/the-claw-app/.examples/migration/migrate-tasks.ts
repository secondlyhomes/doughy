#!/usr/bin/env ts-node

/**
 * Task Migration Script
 *
 * Migrates tasks from AsyncStorage to Supabase.
 *
 * Usage:
 *   npx ts-node migrate-tasks.ts           # Run migration
 *   npx ts-node migrate-tasks.ts --dry-run # Preview without changes
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import {
  MigrationTracker,
  createBackup,
  batchUpsert,
  requireAuthentication,
  logMigrationResult,
  createDryRunClient,
  type MigrationOptions,
  type MigrationResult,
} from './migrationHelper';
import {
  transformBatchToSupabase,
  deduplicateTasks,
  sanitizeTask,
  analyzeTasks,
  validateLocalTask,
  type LocalTask,
} from './dataTransform';

// Configuration
const TASK_PREFIX = 'task_';
const BATCH_SIZE = 100;
const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Main migration function
 */
export async function migrateTasks(options: MigrationOptions = {}): Promise<MigrationResult> {
  const startTime = Date.now();
  const tracker = new MigrationTracker({
    onProgress: options.onProgress,
    onError: options.onError,
  });

  const dryRun = options.dryRun ?? DRY_RUN;
  const batchSize = options.batchSize ?? BATCH_SIZE;

  console.log('\n=== Task Migration ===\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'PRODUCTION'}`);
  console.log(`Batch size: ${batchSize}\n`);

  let backupPath: string | undefined;

  try {
    // Phase 1: Authentication
    console.log('Checking authentication...');
    const { userId, email } = await requireAuthentication();
    console.log(`✓ Authenticated as: ${email} (${userId})\n`);

    // Phase 2: Backup
    if (!dryRun) {
      tracker.setPhase('backup', 1);
      console.log('Creating backup...');
      backupPath = await createBackup(TASK_PREFIX);
      tracker.increment();
      console.log('');
    }

    // Phase 3: Export local data
    tracker.setPhase('export', 1);
    console.log('Exporting local tasks...');
    const localTasks = await exportLocalTasks();
    tracker.increment();

    console.log(`✓ Found ${localTasks.length} local tasks\n`);

    if (localTasks.length === 0) {
      console.log('No tasks to migrate. Exiting.\n');
      return {
        success: true,
        itemsMigrated: 0,
        itemsFailed: 0,
        errors: [],
        duration: Date.now() - startTime,
        backupPath,
      };
    }

    // Phase 4: Transform and validate
    tracker.setPhase('transform', localTasks.length);
    console.log('Analyzing tasks...');

    const stats = analyzeTasks(localTasks);
    console.log(`  Total: ${stats.total}`);
    console.log(`  Valid: ${stats.valid}`);
    console.log(`  Invalid: ${stats.invalid}`);
    console.log(`  Duplicates: ${stats.duplicates}\n`);

    if (stats.invalid > 0) {
      console.log('⚠️  Invalid tasks found. Will skip these during migration.\n');
    }

    console.log('Preparing tasks...');
    const deduplicated = deduplicateTasks(localTasks);
    const sanitized = deduplicated.map(sanitizeTask);
    const transformed = transformBatchToSupabase(sanitized, userId);

    tracker.increment(localTasks.length);

    console.log(`✓ Prepared ${transformed.length} tasks for upload\n`);

    // Phase 5: Upload to Supabase
    tracker.setPhase('upload', transformed.length);
    console.log('Uploading to Supabase...');

    const client = dryRun ? createDryRunClient() : supabase;

    const { success, failed } = await batchUpsert(
      'tasks',
      transformed,
      {
        batchSize,
        onProgress: options.onProgress,
        onConflict: 'id',
      }
    );

    console.log(`✓ Upload complete`);
    console.log(`  Success: ${success}`);
    console.log(`  Failed: ${failed}\n`);

    // Phase 6: Verify (if not dry run)
    if (!dryRun) {
      tracker.setPhase('verify', 1);
      console.log('Verifying migration...');

      const { data: remoteTasks, error } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Verification failed: ${error.message}`);
      }

      const remoteCount = remoteTasks?.length || 0;
      const expectedCount = transformed.length;

      console.log(`  Local tasks: ${expectedCount}`);
      console.log(`  Remote tasks: ${remoteCount}`);

      if (remoteCount === expectedCount) {
        console.log('✓ Counts match\n');
      } else {
        console.log(`⚠️  Count mismatch (difference: ${Math.abs(remoteCount - expectedCount)})\n`);
      }

      tracker.increment();
    }

    // Complete
    tracker.setPhase('complete', 1);
    tracker.increment();

    const result: MigrationResult = {
      success: failed === 0,
      itemsMigrated: success,
      itemsFailed: failed,
      errors: tracker.getErrors(),
      duration: Date.now() - startTime,
      backupPath,
    };

    logMigrationResult(result);

    return result;
  } catch (error) {
    console.error('\n❌ Migration failed:', error);

    const result: MigrationResult = {
      success: false,
      itemsMigrated: 0,
      itemsFailed: 0,
      errors: [
        {
          phase: 'migration',
          error: error instanceof Error ? error : new Error(String(error)),
          recoverable: false,
        },
      ],
      duration: Date.now() - startTime,
      backupPath,
    };

    logMigrationResult(result);

    if (backupPath) {
      console.log(`\nTo rollback, run:`);
      console.log(`  npx ts-node rollback.ts ${backupPath}\n`);
    }

    return result;
  }
}

/**
 * Export local tasks from AsyncStorage
 */
async function exportLocalTasks(): Promise<LocalTask[]> {
  const keys = await AsyncStorage.getAllKeys();
  const taskKeys = keys.filter(
    (k) => k.startsWith(TASK_PREFIX) && !k.endsWith('_synced')
  );

  const tasks: LocalTask[] = [];

  for (const key of taskKeys) {
    try {
      const value = await AsyncStorage.getItem(key);

      if (!value) continue;

      const task = JSON.parse(value);
      const validation = validateLocalTask(task);

      if (validation.valid) {
        tasks.push(task as LocalTask);
      } else {
        console.warn(`⚠️  Invalid task ${key}:`);
        validation.errors.forEach((err) => console.warn(`   - ${err}`));
      }
    } catch (error) {
      console.error(`Failed to parse ${key}:`, error);
    }
  }

  return tasks;
}

/**
 * Run migration if executed directly
 */
if (require.main === module) {
  migrateTasks({
    dryRun: DRY_RUN,
    batchSize: BATCH_SIZE,
    onProgress: (progress) => {
      // Simple progress indicator
      if (progress.current % 10 === 0 || progress.current === progress.total) {
        process.stdout.write(`\r  Progress: ${progress.current}/${progress.total} (${progress.percentage.toFixed(1)}%)`);
      }

      if (progress.current === progress.total) {
        process.stdout.write('\n');
      }
    },
    onError: (error) => {
      console.error(`\n⚠️  Error in ${error.phase}:`, error.error.message);
      if (error.item) {
        console.error(`   Item: ${error.item}`);
      }
    },
  }).then((result) => {
    process.exit(result.success ? 0 : 1);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
