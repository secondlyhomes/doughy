// src/features/admin/services/testUserService.ts
// Test user seeding service for development testing
//
// Creates 40 test users with edge cases for UI and validation testing.
// All users use @example.com emails (RFC 2606 reserved domain).
//
// Distribution:
// - 32 happy path users (80%): Normal names, valid emails, various roles
// - 8 edge case users (20%): Unicode, special chars, long names, etc.

import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import type { UserRole } from './userService';

// ============================================================================
// TYPES
// ============================================================================

export interface TestUserData {
  email: string;
  name: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
}

export interface SeedUsersResult {
  success: boolean;
  count: number;
  errors?: string[];
  warnings?: string[];
}

export interface ClearUsersResult {
  success: boolean;
  count: number;
  errors?: string[];
}

export interface SafetyCheckResult {
  allowed: boolean;
  reason?: string;
}

// ============================================================================
// SAFETY CHECKS
// ============================================================================

/**
 * Triple-layered safety check to prevent production use.
 */
export function canSeedTestUsers(): SafetyCheckResult {
  // Layer 1: Development mode check
  if (!__DEV__) {
    return {
      allowed: false,
      reason: 'Test user seeding only available in development mode (__DEV__ = false)',
    };
  }

  // Layer 2: Production database check
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
  const isProd = supabaseUrl?.includes('vpqglbaedcpeprnlnfxd');

  if (isProd) {
    return {
      allowed: false,
      reason: 'Cannot seed test users to production database! Detected production Supabase URL.',
    };
  }

  // Layer 3: Explicit environment check
  const env = process.env.EXPO_PUBLIC_ENV || Constants.expoConfig?.extra?.env;
  if (env === 'production') {
    return {
      allowed: false,
      reason: 'Environment is set to production (EXPO_PUBLIC_ENV=production)',
    };
  }

  return { allowed: true };
}

// ============================================================================
// TEST USER DATA (40 total: 32 happy path + 8 edge cases)
// ============================================================================

/**
 * Edge case test users for testing boundary conditions
 */
const EDGE_CASE_USERS: TestUserData[] = [
  // 1. Very long name (tests text truncation)
  {
    email: 'christopher.montgomery.wellington@example.com',
    name: 'Christopher Alexander Montgomery-Wellington III Esq.',
    first_name: 'Christopher Alexander',
    last_name: 'Montgomery-Wellington III Esq.',
    role: 'user',
  },
  // 2. Unicode characters - Spanish with accents
  {
    email: 'jose.garcia@example.com',
    name: "José María García-López",
    first_name: 'José María',
    last_name: 'García-López',
    role: 'user',
  },
  // 3. Unicode characters - Asian (Korean)
  {
    email: 'kim.cheolsu@example.com',
    name: '김철수',
    first_name: '철수',
    last_name: '김',
    role: 'standard',
  },
  // 4. Single character name (minimum)
  {
    email: 'x@example.com',
    name: 'X',
    first_name: 'X',
    last_name: '',
    role: 'user',
  },
  // 5. No name (null handling)
  {
    email: 'no.name@example.com',
    name: '',
    first_name: '',
    last_name: '',
    role: 'user',
  },
  // 6. Special characters in name
  {
    email: 'mary.o.brien@example.com',
    name: "Mary O'Brien-Smith",
    first_name: 'Mary',
    last_name: "O'Brien-Smith",
    role: 'standard',
  },
  // 7. All caps name
  {
    email: 'john.caps@example.com',
    name: 'JOHN SMITH',
    first_name: 'JOHN',
    last_name: 'SMITH',
    role: 'user',
  },
  // 8. Numbers in name (edge case for validation)
  {
    email: 'test.user.123@example.com',
    name: 'Test User 123',
    first_name: 'Test',
    last_name: 'User 123',
    role: 'beta',
  },
];

/**
 * Happy path test users - normal scenarios
 */
const HAPPY_PATH_USERS: TestUserData[] = [
  // Admin users (3)
  { email: 'admin.primary@example.com', name: 'Admin Primary', first_name: 'Admin', last_name: 'Primary', role: 'admin' },
  { email: 'admin.secondary@example.com', name: 'Admin Secondary', first_name: 'Admin', last_name: 'Secondary', role: 'admin' },
  { email: 'admin.backup@example.com', name: 'Admin Backup', first_name: 'Admin', last_name: 'Backup', role: 'admin' },

  // Support users (4)
  { email: 'support.lead@example.com', name: 'Support Lead', first_name: 'Support', last_name: 'Lead', role: 'support' },
  { email: 'support.tier1@example.com', name: 'Support Tier One', first_name: 'Support', last_name: 'Tier One', role: 'support' },
  { email: 'support.tier2@example.com', name: 'Support Tier Two', first_name: 'Support', last_name: 'Tier Two', role: 'support' },
  { email: 'support.weekend@example.com', name: 'Weekend Support', first_name: 'Weekend', last_name: 'Support', role: 'support' },

  // Standard users (10)
  { email: 'alice.johnson@example.com', name: 'Alice Johnson', first_name: 'Alice', last_name: 'Johnson', role: 'standard' },
  { email: 'bob.williams@example.com', name: 'Bob Williams', first_name: 'Bob', last_name: 'Williams', role: 'standard' },
  { email: 'carol.davis@example.com', name: 'Carol Davis', first_name: 'Carol', last_name: 'Davis', role: 'standard' },
  { email: 'david.miller@example.com', name: 'David Miller', first_name: 'David', last_name: 'Miller', role: 'standard' },
  { email: 'emma.wilson@example.com', name: 'Emma Wilson', first_name: 'Emma', last_name: 'Wilson', role: 'standard' },
  { email: 'frank.moore@example.com', name: 'Frank Moore', first_name: 'Frank', last_name: 'Moore', role: 'standard' },
  { email: 'grace.taylor@example.com', name: 'Grace Taylor', first_name: 'Grace', last_name: 'Taylor', role: 'standard' },
  { email: 'henry.anderson@example.com', name: 'Henry Anderson', first_name: 'Henry', last_name: 'Anderson', role: 'standard' },
  { email: 'iris.thomas@example.com', name: 'Iris Thomas', first_name: 'Iris', last_name: 'Thomas', role: 'standard' },
  { email: 'jack.jackson@example.com', name: 'Jack Jackson', first_name: 'Jack', last_name: 'Jackson', role: 'standard' },

  // Regular users (10)
  { email: 'karen.white@example.com', name: 'Karen White', first_name: 'Karen', last_name: 'White', role: 'user' },
  { email: 'larry.harris@example.com', name: 'Larry Harris', first_name: 'Larry', last_name: 'Harris', role: 'user' },
  { email: 'monica.martin@example.com', name: 'Monica Martin', first_name: 'Monica', last_name: 'Martin', role: 'user' },
  { email: 'nathan.garcia@example.com', name: 'Nathan Garcia', first_name: 'Nathan', last_name: 'Garcia', role: 'user' },
  { email: 'olivia.martinez@example.com', name: 'Olivia Martinez', first_name: 'Olivia', last_name: 'Martinez', role: 'user' },
  { email: 'peter.robinson@example.com', name: 'Peter Robinson', first_name: 'Peter', last_name: 'Robinson', role: 'user' },
  { email: 'quinn.clark@example.com', name: 'Quinn Clark', first_name: 'Quinn', last_name: 'Clark', role: 'user' },
  { email: 'rachel.rodriguez@example.com', name: 'Rachel Rodriguez', first_name: 'Rachel', last_name: 'Rodriguez', role: 'user' },
  { email: 'steven.lewis@example.com', name: 'Steven Lewis', first_name: 'Steven', last_name: 'Lewis', role: 'user' },
  { email: 'tina.lee@example.com', name: 'Tina Lee', first_name: 'Tina', last_name: 'Lee', role: 'user' },

  // Beta users (5)
  { email: 'beta.tester1@example.com', name: 'Beta Tester One', first_name: 'Beta', last_name: 'Tester One', role: 'beta' },
  { email: 'beta.tester2@example.com', name: 'Beta Tester Two', first_name: 'Beta', last_name: 'Tester Two', role: 'beta' },
  { email: 'beta.tester3@example.com', name: 'Beta Tester Three', first_name: 'Beta', last_name: 'Tester Three', role: 'beta' },
  { email: 'early.adopter@example.com', name: 'Early Adopter', first_name: 'Early', last_name: 'Adopter', role: 'beta' },
  { email: 'feature.tester@example.com', name: 'Feature Tester', first_name: 'Feature', last_name: 'Tester', role: 'beta' },
];

/**
 * Get all test users to seed
 */
export function getAllTestUsers(): TestUserData[] {
  return [...HAPPY_PATH_USERS, ...EDGE_CASE_USERS];
}

/**
 * Get test user count
 */
export function getTestUserCount(): number {
  return HAPPY_PATH_USERS.length + EDGE_CASE_USERS.length;
}

// ============================================================================
// SEED TEST USERS
// ============================================================================

/**
 * Seed test users into the database.
 *
 * Uses upsert to avoid duplicates - if a user with the same email exists,
 * it will be updated instead of creating a duplicate.
 */
export async function seedTestUsers(): Promise<SeedUsersResult> {
  // Safety check
  const safetyCheck = canSeedTestUsers();
  if (!safetyCheck.allowed) {
    return {
      success: false,
      count: 0,
      errors: [safetyCheck.reason || 'Safety check failed'],
    };
  }

  const result: SeedUsersResult = {
    success: true,
    count: 0,
    errors: [],
    warnings: [],
  };

  console.log('[testUserService] Starting test user seed...');

  const testUsers = getAllTestUsers();

  for (const userData of testUsers) {
    try {
      // First check if user already exists (by email)
      const { data: existingUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('email', userData.email)
        .maybeSingle();

      if (checkError) {
        result.errors!.push(`Check ${userData.email}: ${checkError.message}`);
        continue;
      }

      if (existingUser) {
        // User exists - update instead
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            name: userData.name || null,
            first_name: userData.first_name || null,
            last_name: userData.last_name || null,
            role: userData.role,
            avatar_url: userData.avatar_url || null,
            is_deleted: false, // Restore if was deleted
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingUser.id);

        if (updateError) {
          result.errors!.push(`Update ${userData.email}: ${updateError.message}`);
        } else {
          result.count++;
          result.warnings!.push(`Updated existing user: ${userData.email}`);
        }
      } else {
        // New user - insert
        // Note: We need to create an auth user first, but for test purposes,
        // we'll create a profile entry with a generated UUID
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: Crypto.randomUUID(),
            email: userData.email,
            name: userData.name || null,
            first_name: userData.first_name || null,
            last_name: userData.last_name || null,
            role: userData.role,
            avatar_url: userData.avatar_url || null,
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          result.errors!.push(`Insert ${userData.email}: ${insertError.message}`);
        } else {
          result.count++;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      result.errors!.push(`${userData.email}: ${message}`);
    }
  }

  console.log('[testUserService] Seed completed. Created/updated:', result.count);

  // Check for errors
  if (result.errors && result.errors.length > 0) {
    result.success = result.count > 0; // Partial success if some were created
    console.error('[testUserService] Seed completed with errors:', result.errors);
  } else {
    delete result.errors;
  }

  // Clean up empty warnings
  if (result.warnings && result.warnings.length === 0) {
    delete result.warnings;
  }

  return result;
}

// ============================================================================
// CLEAR TEST USERS
// ============================================================================

/**
 * Remove all test users (those with @example.com emails) from the database.
 *
 * This performs a hard delete since these are test users.
 */
export async function clearTestUsers(): Promise<ClearUsersResult> {
  // Safety check
  const safetyCheck = canSeedTestUsers();
  if (!safetyCheck.allowed) {
    return {
      success: false,
      count: 0,
      errors: [safetyCheck.reason || 'Safety check failed'],
    };
  }

  const result: ClearUsersResult = {
    success: true,
    count: 0,
    errors: [],
  };

  console.log('[testUserService] Starting test user clear...');

  try {
    // Delete all users with @example.com email
    const { data: deletedUsers, error } = await supabase
      .from('user_profiles')
      .delete()
      .like('email', '%@example.com')
      .select('id');

    if (error) {
      result.errors!.push(error.message);
      result.success = false;
    } else {
      result.count = deletedUsers?.length || 0;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    result.errors!.push(message);
    result.success = false;
  }

  console.log('[testUserService] Clear completed. Deleted:', result.count);

  // Clean up empty errors
  if (result.errors && result.errors.length === 0) {
    delete result.errors;
  }

  return result;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const testUserService = {
  canSeedTestUsers,
  seedTestUsers,
  clearTestUsers,
  getAllTestUsers,
  getTestUserCount,
};

export default testUserService;
