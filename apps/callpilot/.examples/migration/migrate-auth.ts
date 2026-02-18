#!/usr/bin/env ts-node

/**
 * Auth Migration Script
 *
 * Migrates authentication data when adding Supabase auth to existing app.
 *
 * This script helps users migrate to authenticated mode by:
 * 1. Creating a Supabase account
 * 2. Associating existing local data with the new account
 *
 * Usage:
 *   npx ts-node migrate-auth.ts --email user@example.com --password securepassword
 *   npx ts-node migrate-auth.ts --dry-run
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import {
  MigrationTracker,
  createBackup,
  logMigrationResult,
  type MigrationResult,
} from './migrationHelper';

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const EMAIL = getArgValue('--email');
const PASSWORD = getArgValue('--password');
const AUTH_KEY = 'auth_session';
const MIGRATION_STATUS_KEY = 'auth_migration_status';

/**
 * Main auth migration function
 */
export async function migrateAuth(
  email: string,
  password: string,
  dryRun = false
): Promise<MigrationResult> {
  const startTime = Date.now();
  const tracker = new MigrationTracker();

  console.log('\n=== Auth Migration ===\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'PRODUCTION'}`);
  console.log(`Email: ${email}\n`);

  let backupPath: string | undefined;

  try {
    // Phase 1: Backup
    if (!dryRun) {
      tracker.setPhase('backup', 1);
      console.log('Creating backup...');
      backupPath = await createBackup('auth_');
      tracker.increment();
      console.log('');
    }

    // Phase 2: Check existing auth
    tracker.setPhase('export', 1);
    console.log('Checking existing auth...');

    const existingSession = await AsyncStorage.getItem(AUTH_KEY);
    const migrationStatus = await AsyncStorage.getItem(MIGRATION_STATUS_KEY);

    if (migrationStatus === 'completed') {
      console.log('⚠️  Auth migration already completed.\n');

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        console.log(`Logged in as: ${session.user.email}\n`);
      }

      return {
        success: true,
        itemsMigrated: 0,
        itemsFailed: 0,
        errors: [],
        duration: Date.now() - startTime,
        backupPath,
      };
    }

    tracker.increment();

    // Phase 3: Sign up or sign in
    tracker.setPhase('upload', 1);
    console.log('Authenticating with Supabase...');

    let userId: string;
    let userEmail: string;

    if (dryRun) {
      console.log('[DRY RUN] Would sign up/sign in with:', email);
      userId = 'dry-run-user-id';
      userEmail = email;
    } else {
      // Try sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // If sign in fails, try sign up
        console.log('  Account not found. Creating new account...');

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          throw new Error(`Sign up failed: ${signUpError.message}`);
        }

        if (!signUpData.user) {
          throw new Error('Sign up succeeded but no user returned');
        }

        userId = signUpData.user.id;
        userEmail = signUpData.user.email || email;

        console.log('✓ Account created');
      } else {
        if (!signInData.user) {
          throw new Error('Sign in succeeded but no user returned');
        }

        userId = signInData.user.id;
        userEmail = signInData.user.email || email;

        console.log('✓ Signed in to existing account');
      }

      console.log(`  User ID: ${userId}`);
      console.log(`  Email: ${userEmail}\n`);
    }

    tracker.increment();

    // Phase 4: Update migration status
    tracker.setPhase('verify', 1);

    if (!dryRun) {
      console.log('Updating migration status...');

      await AsyncStorage.setItem(MIGRATION_STATUS_KEY, 'completed');
      await AsyncStorage.setItem('user_id', userId);
      await AsyncStorage.setItem('user_email', userEmail);

      console.log('✓ Migration status saved\n');
    }

    tracker.increment();

    // Phase 5: Complete
    tracker.setPhase('complete', 1);
    tracker.increment();

    const result: MigrationResult = {
      success: true,
      itemsMigrated: 1,
      itemsFailed: 0,
      errors: [],
      duration: Date.now() - startTime,
      backupPath,
    };

    logMigrationResult(result);

    console.log('Next steps:');
    console.log('1. Run task migration: npx ts-node migrate-tasks.ts');
    console.log('2. Verify data in Supabase dashboard');
    console.log('3. Test app with new auth\n');

    return result;
  } catch (error) {
    console.error('\n❌ Migration failed:', error);

    const result: MigrationResult = {
      success: false,
      itemsMigrated: 0,
      itemsFailed: 1,
      errors: [
        {
          phase: 'auth',
          error: error instanceof Error ? error : new Error(String(error)),
          recoverable: true,
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
 * Get command line argument value
 */
function getArgValue(flag: string): string {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) {
    return '';
  }
  return process.argv[index + 1];
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Run migration if executed directly
 */
if (require.main === module) {
  if (DRY_RUN) {
    console.log('\n=== Auth Migration (Dry Run) ===\n');
    console.log('This would:');
    console.log('1. Backup existing auth data');
    console.log('2. Sign up or sign in to Supabase');
    console.log('3. Associate local data with new account');
    console.log('4. Mark migration as completed\n');

    process.exit(0);
  }

  if (!EMAIL || !PASSWORD) {
    console.error('Error: Email and password required\n');
    console.log('Usage:');
    console.log('  npx ts-node migrate-auth.ts --email user@example.com --password securepassword');
    console.log('  npx ts-node migrate-auth.ts --dry-run\n');
    process.exit(1);
  }

  if (!isValidEmail(EMAIL)) {
    console.error('Error: Invalid email format\n');
    process.exit(1);
  }

  if (PASSWORD.length < 8) {
    console.error('Error: Password must be at least 8 characters\n');
    process.exit(1);
  }

  migrateAuth(EMAIL, PASSWORD, false).then((result) => {
    process.exit(result.success ? 0 : 1);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
