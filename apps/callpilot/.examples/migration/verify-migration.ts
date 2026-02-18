#!/usr/bin/env ts-node

/**
 * Migration Verification Script
 *
 * Verifies data integrity after migration from AsyncStorage to Supabase.
 *
 * Usage:
 *   npx ts-node verify-migration.ts           # Verify all data
 *   npx ts-node verify-migration.ts --sample  # Verify sample only (faster)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import {
  requireAuthentication,
  verifyCount,
  verifySample,
} from './migrationHelper';
import {
  transformTaskToLocal,
  validateLocalTask,
  type LocalTask,
  type SupabaseTask,
} from './dataTransform';

// Configuration
const TASK_PREFIX = 'task_';
const SAMPLE_MODE = process.argv.includes('--sample');
const SAMPLE_SIZE = 10;

interface VerificationReport {
  counts: {
    local: number;
    remote: number;
    matches: boolean;
  };
  samples: {
    total: number;
    matches: number;
    mismatches: number;
    details: Array<{
      id: string;
      matches: boolean;
      diff?: string[];
    }>;
  };
  success: boolean;
  errors: string[];
}

/**
 * Main verification function
 */
export async function verifyMigration(): Promise<VerificationReport> {
  console.log('\n=== Migration Verification ===\n');
  console.log(`Mode: ${SAMPLE_MODE ? 'SAMPLE' : 'FULL'}\n`);

  const errors: string[] = [];

  try {
    // Step 1: Authentication
    console.log('Checking authentication...');
    const { userId, email } = await requireAuthentication();
    console.log(`✓ Authenticated as: ${email} (${userId})\n`);

    // Step 2: Export local tasks
    console.log('Exporting local tasks...');
    const localTasks = await exportLocalTasks();
    console.log(`✓ Found ${localTasks.length} local tasks\n`);

    // Step 3: Verify counts
    console.log('Verifying counts...');
    const countCheck = await verifyCount('tasks', localTasks.length);

    console.log(`  Local: ${countCheck.expected}`);
    console.log(`  Remote: ${countCheck.actual}`);
    console.log(`  Match: ${countCheck.matches ? '✓' : '✗'}\n`);

    if (!countCheck.matches) {
      const diff = Math.abs(countCheck.actual - countCheck.expected);
      const direction = countCheck.actual > countCheck.expected ? 'more' : 'fewer';
      errors.push(`Count mismatch: ${diff} ${direction} tasks in Supabase`);
    }

    // Step 4: Verify sample data
    console.log('Verifying sample data...');

    const sampleSize = SAMPLE_MODE ? SAMPLE_SIZE : Math.min(localTasks.length, 100);

    const sampleCheck = await verifySample(
      'tasks',
      localTasks,
      (row) => transformTaskToLocal(row as SupabaseTask),
      sampleSize
    );

    console.log(`  Samples checked: ${sampleCheck.samples.length}`);
    console.log(`  Matches: ${sampleCheck.matches}`);
    console.log(`  Mismatches: ${sampleCheck.mismatches}\n`);

    if (sampleCheck.mismatches > 0) {
      console.log('Mismatch details:');

      sampleCheck.samples
        .filter((s) => !s.matches)
        .forEach((sample) => {
          console.log(`  ${sample.id}:`);
          sample.diff?.forEach((d) => console.log(`    ${d}`));
        });

      console.log('');

      errors.push(`${sampleCheck.mismatches} samples have mismatched data`);
    }

    // Step 5: Check for orphaned data
    if (!SAMPLE_MODE) {
      console.log('Checking for orphaned data...');

      const { data: remoteTasks, error } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to fetch remote tasks: ${error.message}`);
      }

      const localIds = new Set(localTasks.map((t) => t.id));
      const remoteIds = new Set((remoteTasks || []).map((t) => t.id));

      const orphanedInRemote = [...remoteIds].filter((id) => !localIds.has(id));
      const missingInRemote = [...localIds].filter((id) => !remoteIds.has(id));

      if (orphanedInRemote.length > 0) {
        console.log(`  ⚠️  ${orphanedInRemote.length} tasks in Supabase not in local`);
        errors.push(`${orphanedInRemote.length} orphaned tasks in Supabase`);
      }

      if (missingInRemote.length > 0) {
        console.log(`  ⚠️  ${missingInRemote.length} tasks in local not in Supabase`);
        errors.push(`${missingInRemote.length} tasks not migrated`);
      }

      if (orphanedInRemote.length === 0 && missingInRemote.length === 0) {
        console.log('  ✓ No orphaned data\n');
      } else {
        console.log('');
      }
    }

    // Generate report
    const report: VerificationReport = {
      counts: {
        local: countCheck.expected,
        remote: countCheck.actual,
        matches: countCheck.matches,
      },
      samples: {
        total: sampleCheck.samples.length,
        matches: sampleCheck.matches,
        mismatches: sampleCheck.mismatches,
        details: sampleCheck.samples,
      },
      success: errors.length === 0,
      errors,
    };

    // Print summary
    printSummary(report);

    return report;
  } catch (error) {
    console.error('\n❌ Verification failed:', error);

    return {
      counts: { local: 0, remote: 0, matches: false },
      samples: { total: 0, matches: 0, mismatches: 0, details: [] },
      success: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
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
      }
    } catch (error) {
      console.error(`Failed to parse ${key}:`, error);
    }
  }

  return tasks;
}

/**
 * Print verification summary
 */
function printSummary(report: VerificationReport): void {
  console.log('=== Verification Summary ===\n');

  console.log('Counts:');
  console.log(`  Local tasks: ${report.counts.local}`);
  console.log(`  Remote tasks: ${report.counts.remote}`);
  console.log(`  Match: ${report.counts.matches ? '✓' : '✗'}\n`);

  console.log('Sample verification:');
  console.log(`  Samples checked: ${report.samples.total}`);
  console.log(`  Matches: ${report.samples.matches}`);
  console.log(`  Mismatches: ${report.samples.mismatches}\n`);

  if (report.success) {
    console.log('✓ All checks passed!\n');
  } else {
    console.log('✗ Verification failed\n');
    console.log('Errors:');
    report.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
    console.log('');
  }

  // Recommendations
  if (!report.success) {
    console.log('Recommendations:\n');

    if (!report.counts.matches) {
      if (report.counts.remote < report.counts.local) {
        console.log('- Re-run migration script: npx ts-node migrate-tasks.ts');
      } else {
        console.log('- Check for duplicate migrations');
        console.log('- Verify RLS policies allow viewing all user data');
      }
    }

    if (report.samples.mismatches > 0) {
      console.log('- Check data transformation logic in dataTransform.ts');
      console.log('- Verify date format consistency');
      console.log('- Check for null vs empty string differences');
    }

    console.log('');
  }
}

/**
 * Run verification if executed directly
 */
if (require.main === module) {
  verifyMigration().then((report) => {
    process.exit(report.success ? 0 : 1);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
