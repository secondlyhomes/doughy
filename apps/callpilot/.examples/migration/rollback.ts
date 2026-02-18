#!/usr/bin/env ts-node

/**
 * Migration Rollback Script
 *
 * Rolls back migration by restoring from backup and optionally cleaning Supabase.
 *
 * Usage:
 *   npx ts-node rollback.ts <backup-file>                    # Restore local data
 *   npx ts-node rollback.ts <backup-file> --delete-remote    # Also delete from Supabase
 *   npx ts-node rollback.ts --list                           # List available backups
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/services/supabase';
import {
  restoreBackup,
  requireAuthentication,
  formatDuration,
} from './migrationHelper';

// Configuration
const DELETE_REMOTE = process.argv.includes('--delete-remote');
const LIST_BACKUPS = process.argv.includes('--list');
const BACKUP_PATH = getBackupPath();

interface RollbackResult {
  success: boolean;
  itemsRestored: number;
  itemsDeleted: number;
  errors: string[];
  duration: number;
}

/**
 * Main rollback function
 */
export async function rollback(
  backupPath: string,
  deleteRemote = false
): Promise<RollbackResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  console.log('\n=== Migration Rollback ===\n');
  console.log(`Backup: ${backupPath}`);
  console.log(`Delete remote: ${deleteRemote ? 'YES' : 'NO'}\n`);

  try {
    // Step 1: Verify backup exists
    console.log('Checking backup file...');
    const info = await FileSystem.getInfoAsync(backupPath);

    if (!info.exists) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    console.log(`✓ Backup found (${(info.size / 1024).toFixed(2)} KB)\n`);

    // Step 2: Restore local data
    console.log('Restoring local data...');
    const itemsRestored = await restoreBackup(backupPath);
    console.log('');

    // Step 3: Delete from Supabase (if requested)
    let itemsDeleted = 0;

    if (deleteRemote) {
      console.log('Deleting data from Supabase...');

      try {
        const { userId } = await requireAuthentication();

        // Delete tasks
        const { data: deletedTasks, error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .eq('user_id', userId)
          .select('id');

        if (deleteError) {
          throw new Error(`Failed to delete tasks: ${deleteError.message}`);
        }

        itemsDeleted = deletedTasks?.length || 0;

        console.log(`✓ Deleted ${itemsDeleted} tasks from Supabase\n`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`⚠️  Failed to delete remote data: ${errorMsg}\n`);
        errors.push(`Remote deletion failed: ${errorMsg}`);
      }
    }

    // Step 4: Reset migration status
    console.log('Resetting migration status...');
    await AsyncStorage.removeItem('migration_completed');
    await AsyncStorage.removeItem('auth_migration_status');
    console.log('✓ Migration status cleared\n');

    // Generate result
    const result: RollbackResult = {
      success: errors.length === 0,
      itemsRestored,
      itemsDeleted,
      errors,
      duration: Date.now() - startTime,
    };

    printSummary(result);

    return result;
  } catch (error) {
    console.error('\n❌ Rollback failed:', error);

    return {
      success: false,
      itemsRestored: 0,
      itemsDeleted: 0,
      errors: [error instanceof Error ? error.message : String(error)],
      duration: Date.now() - startTime,
    };
  }
}

/**
 * List available backup files
 */
export async function listBackups(): Promise<void> {
  console.log('\n=== Available Backups ===\n');

  const directory = FileSystem.documentDirectory || '';
  const files = await FileSystem.readDirectoryAsync(directory);

  const backups = files.filter((f) => f.startsWith('migration-backup-'));

  if (backups.length === 0) {
    console.log('No backup files found.\n');
    return;
  }

  console.log('Found backups:\n');

  for (const backup of backups) {
    const path = `${directory}${backup}`;
    const info = await FileSystem.getInfoAsync(path);

    console.log(`  ${backup}`);
    console.log(`    Path: ${path}`);
    console.log(`    Size: ${(info.size / 1024).toFixed(2)} KB`);

    if (info.modificationTime) {
      const date = new Date(info.modificationTime * 1000);
      console.log(`    Date: ${date.toISOString()}`);
    }

    console.log('');
  }

  console.log('To restore a backup, run:');
  console.log(`  npx ts-node rollback.ts "${directory}${backups[0]}"\n`);
}

/**
 * Print rollback summary
 */
function printSummary(result: RollbackResult): void {
  console.log('=== Rollback Complete ===\n');

  console.log(`Status: ${result.success ? '✓ Success' : '✗ Failed'}`);
  console.log(`Duration: ${formatDuration(result.duration)}`);
  console.log(`Items restored: ${result.itemsRestored}`);

  if (result.itemsDeleted > 0) {
    console.log(`Items deleted from Supabase: ${result.itemsDeleted}`);
  }

  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    result.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
  }

  console.log('\nNext steps:');
  console.log('1. Verify app works with local data');
  console.log('2. Fix migration issues if needed');
  console.log('3. Re-run migration when ready\n');
}

/**
 * Get backup path from command line arguments
 */
function getBackupPath(): string {
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];

    // Skip flags
    if (arg.startsWith('--')) continue;

    // Found backup path
    return arg;
  }

  return '';
}

/**
 * Run rollback if executed directly
 */
if (require.main === module) {
  if (LIST_BACKUPS) {
    listBackups().then(() => {
      process.exit(0);
    }).catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
  } else {
    if (!BACKUP_PATH) {
      console.error('Error: Backup path required\n');
      console.log('Usage:');
      console.log('  npx ts-node rollback.ts <backup-file>');
      console.log('  npx ts-node rollback.ts <backup-file> --delete-remote');
      console.log('  npx ts-node rollback.ts --list\n');
      console.log('Example:');
      console.log('  npx ts-node rollback.ts "/path/to/migration-backup-task-2026-02-05.json"\n');
      process.exit(1);
    }

    console.log('\n⚠️  WARNING: This will restore local data from backup.\n');

    if (DELETE_REMOTE) {
      console.log('⚠️  This will also DELETE all your data from Supabase.\n');
    }

    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    setTimeout(() => {
      rollback(BACKUP_PATH, DELETE_REMOTE).then((result) => {
        process.exit(result.success ? 0 : 1);
      }).catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
      });
    }, 5000);
  }
}
