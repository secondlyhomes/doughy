// src/features/admin/services/investor-seeder/safety-checks.ts
// Safety checks to prevent production database seeding

import Constants from 'expo-constants';

import type { SafetyCheckResult } from './types';

/**
 * Triple-layered safety check to prevent production use.
 *
 * Layer 1: Check __DEV__ flag (development mode)
 * Layer 2: Check Supabase URL (not production database)
 * Layer 3: Check environment variable (explicit opt-in)
 *
 * @returns Safety check result with reason if blocked
 */
export function canSeedDatabase(): SafetyCheckResult {
  // Layer 1: Development mode check
  if (!__DEV__) {
    return {
      allowed: false,
      reason: 'Seeding only available in development mode (__DEV__ = false)',
    };
  }

  // Layer 2: Verify configuration exists (fail closed)
  if (!Constants.expoConfig?.extra) {
    return {
      allowed: false,
      reason: 'Cannot verify environment: expoConfig.extra is not configured. Seeding blocked for safety.',
    };
  }

  // Layer 3: Production database check
  const supabaseUrl = Constants.expoConfig.extra.supabaseUrl;
  if (!supabaseUrl) {
    return {
      allowed: false,
      reason: 'Cannot verify database target: supabaseUrl is not configured. Seeding blocked for safety.',
    };
  }

  const isProd = supabaseUrl.includes('vpqglbaedcpeprnlnfxd');
  if (isProd) {
    return {
      allowed: false,
      reason: 'Cannot seed production database! Detected production Supabase URL.',
    };
  }

  // Layer 4: Explicit environment check (optional but recommended)
  const env = process.env.EXPO_PUBLIC_ENV || Constants.expoConfig.extra.env;
  if (env === 'production') {
    return {
      allowed: false,
      reason: 'Environment is set to production (EXPO_PUBLIC_ENV=production)',
    };
  }

  return { allowed: true };
}

/**
 * Check if a Supabase error indicates the table does not exist.
 * PostgreSQL error code 42P01 = "undefined_table"
 */
export function isTableNotFoundError(error: { code?: string; message?: string }): boolean {
  return error.code === '42P01' ||
    (!!error.message?.includes('relation') && !!error.message?.includes('does not exist'));
}
