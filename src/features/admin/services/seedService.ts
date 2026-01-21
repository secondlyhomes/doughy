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
  createTestCaptureItem,
  getTestLeadCount,
  getTestPropertyCount,
  getTestDealCount,
  getTestCaptureItemCount,
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
    captureItems: number;
  };
  errors?: string[];
  warnings?: string[];
}

export interface ClearResult {
  success: boolean;
  counts: {
    captureItems: number;
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
 * 1. capture_items (depends on: leads, properties, deals)
 * 2. deals (depends on: leads, properties)
 * 3. re_documents (depends on: properties, deals)
 * 4. re_properties (now has FK to leads via lead_id)
 * 5. crm_leads
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
        captureItems: 0,
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
      captureItems: 0,
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

    // 1. Delete capture_items (has foreign keys to leads, properties, deals)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: deletedCaptureItems, error: captureItemsError } = await (supabase.from('capture_items' as any) as any)
      .delete()
      .eq('user_id', userId)
      .select('id');

    if (captureItemsError) {
      result.errors!.push(`Capture Items: ${captureItemsError.message}`);
      console.error('[seedService] Error deleting capture items:', captureItemsError);
    } else {
      result.counts.captureItems = deletedCaptureItems?.length || 0;
      console.log('[seedService] Deleted capture items:', deletedCaptureItems?.length || 0);
    }

    // 2. Delete deals (has foreign keys to leads and properties)
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

    // 3. Delete re_documents (has foreign keys to properties and deals)
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

    // 4. Delete properties (now has FK to leads via lead_id)
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

    // 5. Delete leads (last, no dependencies)
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
 * 2. properties (depends on leads via lead_id for linking)
 * 3. deals (depends on: leads, properties)
 * 4. capture_items (depends on: leads, properties, deals)
 *
 * Property-Lead Distribution:
 * - Properties 0-39: Linked to leads 0-19 (2 properties each)
 * - Properties 40-59: Linked to leads 20-39 (1 property each)
 * - Properties 60-99: Orphan properties (no lead_id)
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
        captureItems: 0,
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
      captureItems: 0,
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

    // Step 4: Create properties with lead_id relationships
    // Distribution:
    // - Properties 0-39: Linked to leads 0-19 (each lead gets 2 properties)
    // - Properties 40-59: Linked to leads 20-39 (each lead gets 1 property)
    // - Properties 60-99: Orphan properties (no lead_id - skip trace needed)
    console.log('[seedService] Creating properties...');
    const propertyCount = getTestPropertyCount();
    const createdProperties: Array<{ id: string }> = [];

    const getLeadIdForProperty = (propertyIndex: number): string | undefined => {
      if (propertyIndex < 40) {
        // Properties 0-39: Each of leads 0-19 gets 2 properties
        const leadIndex = Math.floor(propertyIndex / 2);
        // Only link if the lead exists (handles partial lead creation due to errors)
        return leadIndex < createdLeads.length ? createdLeads[leadIndex].id : undefined;
      } else if (propertyIndex < 60) {
        // Properties 40-59: Each of leads 20-39 gets 1 property
        const leadIndex = 20 + (propertyIndex - 40);
        // Only link if the lead exists
        return leadIndex < createdLeads.length ? createdLeads[leadIndex].id : undefined;
      }
      // Properties 60-99: Orphan properties (no lead_id - skip trace needed)
      return undefined;
    };

    for (let i = 0; i < propertyCount; i++) {
      const leadId = getLeadIdForProperty(i);
      const propertyData = createTestProperty(i, userId, workspaceId, leadId);
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
    const createdDeals: Array<{ id: string }> = [];

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
        createdDeals.push(data);
        result.counts.deals++;
      }
    }

    console.log('[seedService] Created deals:', result.counts.deals);

    if (result.counts.deals < dealCount) {
      result.warnings!.push(`Only created ${result.counts.deals}/${dealCount} deals`);
    }

    // Step 6: Create capture items
    console.log('[seedService] Creating capture items...');
    const captureItemCount = getTestCaptureItemCount();

    for (let i = 0; i < captureItemCount; i++) {
      // Create context for assignments - cycle through available entities
      // If no entities exist, the respective ID will be undefined (acceptable for capture items)
      const context = {
        leadId: createdLeads.length > 0 ? createdLeads[i % createdLeads.length].id : undefined,
        propertyId: createdProperties.length > 0 ? createdProperties[i % createdProperties.length].id : undefined,
        dealId: createdDeals.length > 0 ? createdDeals[i % createdDeals.length].id : undefined,
      };

      const captureItemData = createTestCaptureItem(i, userId, context);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('capture_items' as any) as any)
        .insert(captureItemData);

      if (error) {
        result.errors!.push(`Capture Item ${i}: ${error.message}`);
        console.error(`[seedService] Capture Item ${i} error:`, error);
        continue;
      }

      result.counts.captureItems++;
    }

    console.log('[seedService] Created capture items:', result.counts.captureItems);

    if (result.counts.captureItems < captureItemCount) {
      result.warnings!.push(`Only created ${result.counts.captureItems}/${captureItemCount} capture items`);
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
