// src/features/admin/services/seedService.ts
// Zone B: Database seeding service for development testing
//
// CRITICAL SAFETY: This service can only run in development mode with admin permissions.
// Triple-layered protection prevents accidental production use.

import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import {
  createTestLead,
  createTestProperty,
  createTestDeal,
  getTestLeadCount,
  getTestPropertyCount,
  getTestDealCount,
} from '../factories/testDataFactories';

// ============================================================================
// TYPES
// ============================================================================

export interface SeedResult {
  success: boolean;
  counts: {
    leads: number;
    properties: number;
    deals: number;
  };
  errors?: string[];
  warnings?: string[];
}

export interface ClearResult {
  success: boolean;
  counts: {
    deals: number;
    documents: number;
    properties: number;
    leads: number;
  };
  errors?: string[];
  warnings?: string[];
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

  // Layer 2: Production database check
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
  const isProd = supabaseUrl?.includes('vpqglbaedcpeprnlnfxd');

  if (isProd) {
    return {
      allowed: false,
      reason: 'Cannot seed production database! Detected production Supabase URL.',
    };
  }

  // Layer 3: Explicit environment check (optional but recommended)
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
// CLEAR DATABASE
// ============================================================================

/**
 * Clear all user data from the database in reverse foreign key order.
 * This prevents foreign key constraint violations.
 *
 * Order of deletion (dependencies listed):
 * 1. deals (depends on: leads, properties)
 * 2. re_documents (depends on: properties, deals)
 * 3. properties
 * 4. leads
 *
 * Note: Only clears tables that exist in the current database schema.
 * Future tables (messages, contacts, etc.) will be added when implemented.
 *
 * @param userId - User ID to scope deletions to (RLS protection)
 * @returns ClearResult with counts of deleted records
 */
export async function clearDatabase(userId: string): Promise<ClearResult> {
  // Safety check
  const safetyCheck = canSeedDatabase();
  if (!safetyCheck.allowed) {
    return {
      success: false,
      counts: {
        deals: 0,
        documents: 0,
        properties: 0,
        leads: 0,
      },
      errors: [safetyCheck.reason || 'Safety check failed'],
    };
  }

  const result: ClearResult = {
    success: true,
    counts: {
      deals: 0,
      documents: 0,
      properties: 0,
      leads: 0,
    },
    errors: [],
    warnings: [],
  };

  try {
    console.log('[seedService] Starting database clear for user:', userId);

    // Get user's workspaces first
    const { data: workspaceMembers, error: workspaceError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (workspaceError) {
      return {
        success: false,
        counts: result.counts,
        errors: ['Failed to fetch user workspaces for delete: ' + workspaceError.message],
      };
    }

    const workspaceIds = workspaceMembers?.map(wm => wm.workspace_id) || [];
    console.log('[seedService] Deleting from workspaces:', workspaceIds);

    // Delete in reverse foreign key order (children first, then parents)
    // Only delete from tables that actually exist in the database schema

    // 1. Delete deals (has foreign keys to leads and properties)
    // Deals table has user_id based RLS, not workspace_id based
    const { data: deletedDeals, error: dealsError } = await supabase
      .from('deals')
      .delete()
      .eq('user_id', userId)
      .select('id');

    if (dealsError) {
      result.errors!.push(`Deals: ${dealsError.message}`);
      console.error('[seedService] Error deleting deals:', dealsError);
    } else {
      result.counts.deals = deletedDeals?.length || 0;
      console.log('[seedService] Deleted deals:', deletedDeals?.length || 0);
    }

    // 2. Delete re_documents (has foreign keys to properties and deals)
    // Documents table has user_id based RLS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: deletedDocuments, error: documentsError } = await (supabase.from('re_documents' as any) as any)
      .delete()
      .eq('user_id', userId)
      .select('id');

    if (documentsError) {
      result.errors!.push(`Documents: ${documentsError.message}`);
      console.error('[seedService] Error deleting documents:', documentsError);
    } else {
      result.counts.documents = deletedDocuments?.length || 0;
      console.log('[seedService] Deleted documents:', deletedDocuments?.length || 0);
    }

    // 3. Delete properties
    // Properties table has permissive RLS (just needs auth), so user_id filter is fine
    const { data: deletedProperties, error: propertiesError } = await supabase
      .from('re_properties')
      .delete()
      .eq('user_id', userId)
      .select('id');

    if (propertiesError) {
      result.errors!.push(`Properties: ${propertiesError.message}`);
      console.error('[seedService] Error deleting properties:', propertiesError);
    } else {
      result.counts.properties = deletedProperties?.length || 0;
      console.log('[seedService] Deleted properties:', deletedProperties?.length || 0);
    }

    // 4. Delete leads (last, no dependencies)
    // Leads table has workspace-based RLS for DELETE
    // RLS: workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
    if (workspaceIds.length > 0) {
      const { data: deletedLeads, error: leadsError } = await supabase
        .from('crm_leads')
        .delete()
        .in('workspace_id', workspaceIds)
        .select('id');

      if (leadsError) {
        result.errors!.push(`Leads: ${leadsError.message}`);
        console.error('[seedService] Error deleting leads:', leadsError);
      } else {
        result.counts.leads = deletedLeads?.length || 0;
        console.log('[seedService] Deleted leads:', deletedLeads?.length || 0);
      }
    } else {
      console.log('[seedService] No workspaces found, skipping lead deletion');
      result.counts.leads = 0;
    }

    // Check if any errors occurred
    if (result.errors && result.errors.length > 0) {
      result.success = false;
      console.error('[seedService] Clear completed with errors:', result.errors);
    } else {
      console.log('[seedService] Clear completed successfully');
      // Clean up empty errors array
      delete result.errors;
    }

    // Clean up empty warnings array
    if (result.warnings && result.warnings.length === 0) {
      delete result.warnings;
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error clearing database';
    console.error('[seedService] Fatal error during clear:', message);
    return {
      success: false,
      counts: result.counts,
      errors: [message],
    };
  }
}

// ============================================================================
// SEED DATABASE
// ============================================================================

/**
 * Seed the database with deterministic test data in proper foreign key order.
 *
 * Order of creation (dependencies listed):
 * 1. leads (no dependencies)
 * 2. properties (no dependencies)
 * 3. deals (depends on: leads, properties)
 *
 * @param userId - User ID to associate all data with
 * @returns SeedResult with counts of created records
 */
export async function seedDatabase(userId: string): Promise<SeedResult> {
  // Safety check
  const safetyCheck = canSeedDatabase();
  if (!safetyCheck.allowed) {
    return {
      success: false,
      counts: {
        leads: 0,
        properties: 0,
        deals: 0,
      },
      errors: [safetyCheck.reason || 'Safety check failed'],
    };
  }

  const result: SeedResult = {
    success: true,
    counts: {
      leads: 0,
      properties: 0,
      deals: 0,
    },
    errors: [],
    warnings: [],
  };

  try {
    console.log('[seedService] Starting database seed for user:', userId);

    // Step 1: Get user's workspace
    const { data: workspaceMember, error: workspaceError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (workspaceError || !workspaceMember) {
      return {
        success: false,
        counts: result.counts,
        errors: ['User does not belong to any active workspace. Cannot seed data.'],
      };
    }

    const workspaceId = workspaceMember.workspace_id;
    console.log('[seedService] Using workspace:', workspaceId);

    // Step 2: Clear existing data first
    console.log('[seedService] Clearing existing data...');
    const clearResult = await clearDatabase(userId);
    if (!clearResult.success) {
      result.warnings!.push('Clear operation had errors but continuing with seed');
    }

    // Step 3: Create leads
    console.log('[seedService] Creating leads...');
    const leadCount = getTestLeadCount();
    const createdLeads: Array<{ id: string }> = [];

    for (let i = 0; i < leadCount; i++) {
      const leadData = createTestLead(i, userId, workspaceId);
      const { data, error } = await supabase
        .from('crm_leads')
        .insert(leadData)
        .select('id')
        .single();

      if (error) {
        result.errors!.push(`Lead ${i}: ${error.message}`);
        console.error(`[seedService] Lead ${i} error:`, error);
        continue;
      }

      if (data) {
        createdLeads.push(data);
        result.counts.leads++;
      }
    }

    console.log('[seedService] Created leads:', result.counts.leads);

    if (result.counts.leads < leadCount) {
      result.warnings!.push(`Only created ${result.counts.leads}/${leadCount} leads`);
    }

    // Step 4: Create properties
    console.log('[seedService] Creating properties...');
    const propertyCount = getTestPropertyCount();
    const createdProperties: Array<{ id: string }> = [];

    for (let i = 0; i < propertyCount; i++) {
      const propertyData = createTestProperty(i, userId, workspaceId);
      const { data, error } = await supabase
        .from('re_properties')
        .insert(propertyData)
        .select('id')
        .single();

      if (error) {
        result.errors!.push(`Property ${i}: ${error.message}`);
        console.error(`[seedService] Property ${i} error:`, error);
        continue;
      }

      if (data) {
        createdProperties.push(data);
        result.counts.properties++;
      }
    }

    console.log('[seedService] Created properties:', result.counts.properties);

    if (result.counts.properties < propertyCount) {
      result.warnings!.push(`Only created ${result.counts.properties}/${propertyCount} properties`);
    }

    // Step 5: Create deals (linking leads to properties)
    console.log('[seedService] Creating deals...');
    const dealCount = Math.min(getTestDealCount(), createdLeads.length, createdProperties.length);

    for (let i = 0; i < dealCount; i++) {
      const leadId = createdLeads[i].id;
      const propertyId = createdProperties[i].id;
      const dealData = createTestDeal(i, userId, leadId, propertyId);

      const { data, error } = await supabase
        .from('deals')
        .insert(dealData)
        .select('id')
        .single();

      if (error) {
        result.errors!.push(`Deal ${i}: ${error.message}`);
        console.error(`[seedService] Deal ${i} error:`, error);
        continue;
      }

      if (data) {
        result.counts.deals++;
      }
    }

    console.log('[seedService] Created deals:', result.counts.deals);

    if (result.counts.deals < dealCount) {
      result.warnings!.push(`Only created ${result.counts.deals}/${dealCount} deals`);
    }

    // Check if any errors occurred
    if (result.errors && result.errors.length > 0) {
      result.success = false;
      console.error('[seedService] Seed completed with errors:', result.errors);
    } else {
      console.log('[seedService] Seed completed successfully');
      // Clean up empty errors array
      delete result.errors;
    }

    // Clean up empty warnings array
    if (result.warnings && result.warnings.length === 0) {
      delete result.warnings;
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error seeding database';
    console.error('[seedService] Fatal error during seed:', message);
    return {
      success: false,
      counts: result.counts,
      errors: [message],
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const seedService = {
  canSeedDatabase,
  clearDatabase,
  seedDatabase,
};

export default seedService;
