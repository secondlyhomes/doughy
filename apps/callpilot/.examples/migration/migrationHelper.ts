/**
 * Migration Helper Utilities
 *
 * Common functions for data migration from AsyncStorage to Supabase.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/services/supabase';

// Types
export interface MigrationOptions {
  dryRun?: boolean;
  batchSize?: number;
  onProgress?: (progress: MigrationProgress) => void;
  onError?: (error: MigrationError) => void;
}

export interface MigrationProgress {
  phase: 'backup' | 'export' | 'transform' | 'upload' | 'verify' | 'complete';
  current: number;
  total: number;
  percentage: number;
  message: string;
}

export interface MigrationError {
  phase: string;
  item?: string;
  error: Error;
  recoverable: boolean;
}

export interface MigrationResult {
  success: boolean;
  itemsMigrated: number;
  itemsFailed: number;
  errors: MigrationError[];
  duration: number;
  backupPath?: string;
}

// Progress tracking
export class MigrationTracker {
  private phase: MigrationProgress['phase'] = 'backup';
  private current = 0;
  private total = 0;
  private errors: MigrationError[] = [];
  private onProgress?: (progress: MigrationProgress) => void;
  private onError?: (error: MigrationError) => void;

  constructor(options?: Pick<MigrationOptions, 'onProgress' | 'onError'>) {
    this.onProgress = options?.onProgress;
    this.onError = options?.onError;
  }

  setPhase(phase: MigrationProgress['phase'], total: number) {
    this.phase = phase;
    this.current = 0;
    this.total = total;
    this.notifyProgress();
  }

  increment(message?: string) {
    this.current++;
    this.notifyProgress(message);
  }

  addError(error: MigrationError) {
    this.errors.push(error);
    this.onError?.(error);
  }

  private notifyProgress(message?: string) {
    const percentage = this.total > 0 ? (this.current / this.total) * 100 : 0;

    this.onProgress?.({
      phase: this.phase,
      current: this.current,
      total: this.total,
      percentage,
      message: message || this.getDefaultMessage(),
    });
  }

  private getDefaultMessage(): string {
    const messages: Record<MigrationProgress['phase'], string> = {
      backup: 'Creating backup...',
      export: 'Exporting local data...',
      transform: 'Transforming data...',
      upload: 'Uploading to Supabase...',
      verify: 'Verifying migration...',
      complete: 'Migration complete',
    };
    return messages[this.phase];
  }

  getErrors(): MigrationError[] {
    return this.errors;
  }
}

// Backup functions
export async function createBackup(prefix: string): Promise<string> {
  const keys = await AsyncStorage.getAllKeys();
  const relevantKeys = keys.filter((k) => k.startsWith(prefix));
  const backup: Record<string, string> = {};

  for (const key of relevantKeys) {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      backup[key] = value;
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `migration-backup-${prefix}-${timestamp}.json`;
  const filepath = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(
    filepath,
    JSON.stringify(backup, null, 2)
  );

  console.log(`✓ Backup created: ${filepath}`);
  console.log(`  Items backed up: ${relevantKeys.length}`);

  return filepath;
}

export async function restoreBackup(filepath: string): Promise<number> {
  const backupJson = await FileSystem.readAsStringAsync(filepath);
  const backup = JSON.parse(backupJson);

  const keys = Object.keys(backup);

  for (const key of keys) {
    await AsyncStorage.setItem(key, backup[key]);
  }

  console.log(`✓ Restored ${keys.length} items from backup`);

  return keys.length;
}

// Export functions
export async function exportLocalData<T>(
  prefix: string,
  parser: (key: string, value: string) => T
): Promise<T[]> {
  const keys = await AsyncStorage.getAllKeys();
  const relevantKeys = keys.filter((k) => k.startsWith(prefix));
  const items: T[] = [];

  for (const key of relevantKeys) {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      try {
        const item = parser(key, value);
        items.push(item);
      } catch (error) {
        console.error(`Failed to parse ${key}:`, error);
      }
    }
  }

  return items;
}

// Batch upload functions
export async function batchInsert<T extends Record<string, unknown>>(
  table: string,
  items: T[],
  options: Pick<MigrationOptions, 'batchSize' | 'onProgress'> = {}
): Promise<{ success: number; failed: number }> {
  const batchSize = options.batchSize || 100;
  const batches = chunk(items, batchSize);

  let success = 0;
  let failed = 0;

  for (const batch of batches) {
    try {
      const { error } = await supabase.from(table).insert(batch);

      if (error) {
        console.error(`Batch insert failed:`, error);
        failed += batch.length;
      } else {
        success += batch.length;
      }

      options.onProgress?.({
        phase: 'upload',
        current: success + failed,
        total: items.length,
        percentage: ((success + failed) / items.length) * 100,
        message: `Uploaded ${success + failed}/${items.length} items`,
      });
    } catch (error) {
      console.error('Batch insert error:', error);
      failed += batch.length;
    }
  }

  return { success, failed };
}

export async function batchUpsert<T extends Record<string, unknown>>(
  table: string,
  items: T[],
  options: Pick<MigrationOptions, 'batchSize' | 'onProgress'> & { onConflict?: string } = {}
): Promise<{ success: number; failed: number }> {
  const batchSize = options.batchSize || 100;
  const batches = chunk(items, batchSize);

  let success = 0;
  let failed = 0;

  for (const batch of batches) {
    try {
      const { error } = await supabase
        .from(table)
        .upsert(batch, {
          onConflict: options.onConflict || 'id',
        });

      if (error) {
        console.error(`Batch upsert failed:`, error);
        failed += batch.length;
      } else {
        success += batch.length;
      }

      options.onProgress?.({
        phase: 'upload',
        current: success + failed,
        total: items.length,
        percentage: ((success + failed) / items.length) * 100,
        message: `Uploaded ${success + failed}/${items.length} items`,
      });
    } catch (error) {
      console.error('Batch upsert error:', error);
      failed += batch.length;
    }
  }

  return { success, failed };
}

// Verification functions
export async function verifyCount(
  table: string,
  expectedCount: number
): Promise<{ matches: boolean; actual: number; expected: number }> {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(`Failed to get count: ${error.message}`);
  }

  return {
    matches: count === expectedCount,
    actual: count || 0,
    expected: expectedCount,
  };
}

export async function verifySample<T extends { id: string }>(
  table: string,
  localItems: T[],
  transformer: (row: unknown) => T,
  sampleSize = 10
): Promise<{ matches: number; mismatches: number; samples: Array<{ id: string; matches: boolean; diff?: string[] }> }> {
  const samples = localItems.slice(0, Math.min(sampleSize, localItems.length));
  const results: Array<{ id: string; matches: boolean; diff?: string[] }> = [];

  let matches = 0;
  let mismatches = 0;

  for (const sample of samples) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', sample.id)
      .single();

    if (error || !data) {
      mismatches++;
      results.push({ id: sample.id, matches: false, diff: ['Item not found in Supabase'] });
      continue;
    }

    const remoteItem = transformer(data);
    const diff = compareObjects(sample, remoteItem);

    if (diff.length === 0) {
      matches++;
      results.push({ id: sample.id, matches: true });
    } else {
      mismatches++;
      results.push({ id: sample.id, matches: false, diff });
    }
  }

  return { matches, mismatches, samples: results };
}

// Utility functions
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function compareObjects<T extends Record<string, unknown>>(
  obj1: T,
  obj2: T
): string[] {
  const differences: string[] = [];
  const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

  for (const key of keys) {
    const val1 = obj1[key];
    const val2 = obj2[key];

    if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      differences.push(`${key}: ${JSON.stringify(val1)} !== ${JSON.stringify(val2)}`);
    }
  }

  return differences;
}

export async function requireAuthentication(): Promise<{ userId: string; email: string }> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('User must be authenticated to perform migration');
  }

  return {
    userId: user.id,
    email: user.email || 'unknown',
  };
}

export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }

  return `${seconds}s`;
}

export function logMigrationResult(result: MigrationResult): void {
  console.log('\n=== Migration Complete ===\n');
  console.log(`Status: ${result.success ? '✓ Success' : '✗ Failed'}`);
  console.log(`Duration: ${formatDuration(result.duration)}`);
  console.log(`Items migrated: ${result.itemsMigrated}`);
  console.log(`Items failed: ${result.itemsFailed}`);

  if (result.backupPath) {
    console.log(`Backup: ${result.backupPath}`);
  }

  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    result.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. [${error.phase}] ${error.error.message}`);
      if (error.item) {
        console.log(`     Item: ${error.item}`);
      }
    });
  }

  console.log('');
}

// Dry run helpers
export function createDryRunClient() {
  return {
    from: (table: string) => ({
      insert: async (data: unknown) => {
        console.log(`[DRY RUN] Would insert into ${table}:`, data);
        return { data, error: null };
      },
      upsert: async (data: unknown) => {
        console.log(`[DRY RUN] Would upsert into ${table}:`, data);
        return { data, error: null };
      },
      select: async () => {
        console.log(`[DRY RUN] Would select from ${table}`);
        return { data: [], error: null };
      },
    }),
  };
}
