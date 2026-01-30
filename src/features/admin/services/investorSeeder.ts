// src/features/admin/services/investorSeeder.ts
// Zone B: Investor database seeding service for development testing
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
  createTestInvestorConversation,
  createTestInvestorMessages,
  createTestInvestorAIQueueItem,
  getTestLeadCount,
  getTestPropertyCount,
  getTestDealCount,
  getTestCaptureItemCount,
  getTestInvestorConversationCount,
  getTestInvestorAIQueueCount,
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
    investorConversations: number;
    investorMessages: number;
    investorAIQueue: number;
  };
  errors?: string[];
  warnings?: string[];
}

export interface ClearResult {
  success: boolean;
  counts: {
    investorAIQueue: number;
    investorMessages: number;
    investorConversations: number;
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
// HELPERS
// ============================================================================

/**
 * Check if a Supabase error indicates the table does not exist.
 * PostgreSQL error code 42P01 = "undefined_table"
 */
function isTableNotFoundError(error: { code?: string; message?: string }): boolean {
  return error.code === '42P01' ||
    (!!error.message?.includes('relation') && !!error.message?.includes('does not exist'));
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

  // Layer 2: Verify configuration exists (fail closed - if we can't verify, don't allow)
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
        investorAIQueue: 0,
        investorMessages: 0,
        investorConversations: 0,
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
      investorAIQueue: 0,
      investorMessages: 0,
      investorConversations: 0,
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
    console.log('[investorSeeder] Starting database clear for user:', userId);

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
    console.log('[investorSeeder] Deleting from workspaces:', workspaceIds);

    // Delete in reverse foreign key order (children first, then parents)
    // Only delete from tables that actually exist in the database schema

    // 0a. Delete investor_ai_queue_items (depends on investor_conversations, investor_messages)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: deletedAIQueue, error: aiQueueError } = await (supabase.from('investor_ai_queue_items' as any) as any)
      .delete()
      .eq('user_id', userId)
      .select('id');

    if (aiQueueError) {
      if (isTableNotFoundError(aiQueueError)) {
        // Table not yet created - this is expected before migration runs
        result.warnings!.push('investor_ai_queue_items table not yet created (run migration first)');
        console.info('[investorSeeder] investor_ai_queue_items table not found, skipping');
      } else {
        // Real error - treat as error, not warning
        result.errors!.push(`Investor AI Queue: ${aiQueueError.message}`);
        console.error('[investorSeeder] Error deleting investor AI queue:', aiQueueError);
      }
    } else {
      result.counts.investorAIQueue = deletedAIQueue?.length || 0;
      console.log('[investorSeeder] Deleted investor AI queue items:', deletedAIQueue?.length || 0);
    }

    // 0b. Delete investor_messages (depends on investor_conversations)
    // First get conversation IDs, then delete messages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userConversations, error: convQueryError } = await (supabase.from('investor_conversations' as any) as any)
      .select('id')
      .eq('user_id', userId);

    if (convQueryError) {
      if (isTableNotFoundError(convQueryError)) {
        // Table not yet created - skip messages deletion too
        result.warnings!.push('investor_conversations table not yet created (run migration first)');
        console.info('[investorSeeder] investor_conversations table not found, skipping messages deletion');
      } else {
        // Real error - this is critical because we can't safely delete messages
        result.errors!.push(`Failed to query investor conversations: ${convQueryError.message}`);
        console.error('[investorSeeder] Error querying investor conversations:', convQueryError);
      }
    } else if (userConversations && userConversations.length > 0) {
      const conversationIds = userConversations.map((c: { id: string }) => c.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: deletedMessages, error: messagesError } = await (supabase.from('investor_messages' as any) as any)
        .delete()
        .in('conversation_id', conversationIds)
        .select('id');

      if (messagesError) {
        if (isTableNotFoundError(messagesError)) {
          result.warnings!.push('investor_messages table not yet created (run migration first)');
          console.info('[investorSeeder] investor_messages table not found, skipping');
        } else {
          result.errors!.push(`Investor Messages: ${messagesError.message}`);
          console.error('[investorSeeder] Error deleting investor messages:', messagesError);
        }
      } else {
        result.counts.investorMessages = deletedMessages?.length || 0;
        console.log('[investorSeeder] Deleted investor messages:', deletedMessages?.length || 0);
      }
    }

    // 0c. Delete investor_conversations (depends on leads)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: deletedConversations, error: conversationsError } = await (supabase.from('investor_conversations' as any) as any)
      .delete()
      .eq('user_id', userId)
      .select('id');

    if (conversationsError) {
      if (isTableNotFoundError(conversationsError)) {
        result.warnings!.push('investor_conversations table not yet created (run migration first)');
        console.info('[investorSeeder] investor_conversations table not found, skipping');
      } else {
        result.errors!.push(`Investor Conversations: ${conversationsError.message}`);
        console.error('[investorSeeder] Error deleting investor conversations:', conversationsError);
      }
    } else {
      result.counts.investorConversations = deletedConversations?.length || 0;
      console.log('[investorSeeder] Deleted investor conversations:', deletedConversations?.length || 0);
    }

    // 1. Delete capture_items (has foreign keys to leads, properties, deals)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: deletedCaptureItems, error: captureItemsError } = await (supabase.from('ai_capture_items' as any) as any)
      .delete()
      .eq('user_id', userId)
      .select('id');

    if (captureItemsError) {
      result.errors!.push(`Capture Items: ${captureItemsError.message}`);
      console.error('[investorSeeder] Error deleting capture items:', captureItemsError);
    } else {
      result.counts.captureItems = deletedCaptureItems?.length || 0;
      console.log('[investorSeeder] Deleted capture items:', deletedCaptureItems?.length || 0);
    }

    // 2. Delete deals (has foreign keys to leads and properties)
    // Deals table has user_id based RLS, not workspace_id based
    const { data: deletedDeals, error: dealsError } = await supabase
      .from('investor_deals_pipeline')
      .delete()
      .eq('user_id', userId)
      .select('id');

    if (dealsError) {
      result.errors!.push(`Deals: ${dealsError.message}`);
      console.error('[investorSeeder] Error deleting deals:', dealsError);
    } else {
      result.counts.deals = deletedDeals?.length || 0;
      console.log('[investorSeeder] Deleted deals:', deletedDeals?.length || 0);
    }

    // 3. Delete re_documents (has foreign keys to properties and deals)
    // Documents table has user_id based RLS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: deletedDocuments, error: documentsError } = await (supabase.from('investor_documents' as any) as any)
      .delete()
      .eq('user_id', userId)
      .select('id');

    if (documentsError) {
      result.errors!.push(`Documents: ${documentsError.message}`);
      console.error('[investorSeeder] Error deleting documents:', documentsError);
    } else {
      result.counts.documents = deletedDocuments?.length || 0;
      console.log('[investorSeeder] Deleted documents:', deletedDocuments?.length || 0);
    }

    // 4. Delete properties (now has FK to leads via lead_id)
    // Properties table has permissive RLS (just needs auth), so user_id filter is fine
    const { data: deletedProperties, error: propertiesError } = await supabase
      .from('investor_properties')
      .delete()
      .eq('user_id', userId)
      .select('id');

    if (propertiesError) {
      result.errors!.push(`Properties: ${propertiesError.message}`);
      console.error('[investorSeeder] Error deleting properties:', propertiesError);
    } else {
      result.counts.properties = deletedProperties?.length || 0;
      console.log('[investorSeeder] Deleted properties:', deletedProperties?.length || 0);
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
        console.error('[investorSeeder] Error deleting leads:', leadsError);
      } else {
        result.counts.leads = deletedLeads?.length || 0;
        console.log('[investorSeeder] Deleted leads:', deletedLeads?.length || 0);
      }
    } else {
      console.log('[investorSeeder] No workspaces found, skipping lead deletion');
      result.counts.leads = 0;
    }

    // Check if any errors occurred
    if (result.errors && result.errors.length > 0) {
      result.success = false;
      console.error('[investorSeeder] Clear completed with errors:', result.errors);
    } else {
      console.log('[investorSeeder] Clear completed successfully');
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
    console.error('[investorSeeder] Fatal error during clear:', message);
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
        investorConversations: 0,
        investorMessages: 0,
        investorAIQueue: 0,
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
      investorConversations: 0,
      investorMessages: 0,
      investorAIQueue: 0,
    },
    errors: [],
    warnings: [],
  };

  try {
    console.log('[investorSeeder] Starting database seed for user:', userId);

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
    console.log('[investorSeeder] Using workspace:', workspaceId);

    // Step 2: Clear existing data first
    console.log('[investorSeeder] Clearing existing data...');
    const clearResult = await clearDatabase(userId);
    if (!clearResult.success) {
      // CRITICAL: Do not continue seeding if clear failed - would cause data corruption
      console.error('[investorSeeder] Clear failed, aborting seed to prevent data corruption');
      return {
        success: false,
        counts: { leads: 0, properties: 0, deals: 0, captureItems: 0, investorConversations: 0, investorMessages: 0, investorAIQueue: 0 },
        errors: [`Clear database failed: ${clearResult.errors?.join(', ') || 'Unknown error'}. Seed aborted to prevent data corruption.`],
      };
    }

    // Step 3: Create leads
    console.log('[investorSeeder] Creating leads...');
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

    console.log('[investorSeeder] Created leads:', result.counts.leads);

    if (result.counts.leads < leadCount) {
      result.warnings!.push(`Only created ${result.counts.leads}/${leadCount} leads`);
    }

    // Step 4: Create properties with lead_id relationships
    // Distribution:
    // - Properties 0-39: Linked to leads 0-19 (each lead gets 2 properties)
    // - Properties 40-59: Linked to leads 20-39 (each lead gets 1 property)
    // - Properties 60-99: Orphan properties (no lead_id - skip trace needed)
    console.log('[investorSeeder] Creating properties...');
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
        .from('investor_properties')
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

    console.log('[investorSeeder] Created properties:', result.counts.properties);

    if (result.counts.properties < propertyCount) {
      result.warnings!.push(`Only created ${result.counts.properties}/${propertyCount} properties`);
    }

    // Step 5: Create deals (linking leads to properties)
    console.log('[investorSeeder] Creating deals...');
    const dealCount = Math.min(getTestDealCount(), createdLeads.length, createdProperties.length);
    const createdDeals: Array<{ id: string }> = [];

    for (let i = 0; i < dealCount; i++) {
      const leadId = createdLeads[i].id;
      const propertyId = createdProperties[i].id;
      const dealData = createTestDeal(i, userId, leadId, propertyId);

      const { data, error } = await supabase
        .from('investor_deals_pipeline')
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

    console.log('[investorSeeder] Created deals:', result.counts.deals);

    if (result.counts.deals < dealCount) {
      result.warnings!.push(`Only created ${result.counts.deals}/${dealCount} deals`);
    }

    // Step 6: Create capture items
    console.log('[investorSeeder] Creating capture items...');
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
      const { error } = await (supabase.from('ai_capture_items' as any) as any)
        .insert(captureItemData);

      if (error) {
        result.errors!.push(`Capture Item ${i}: ${error.message}`);
        console.error(`[seedService] Capture Item ${i} error:`, error);
        continue;
      }

      result.counts.captureItems++;
    }

    console.log('[investorSeeder] Created capture items:', result.counts.captureItems);

    if (result.counts.captureItems < captureItemCount) {
      result.warnings!.push(`Only created ${result.counts.captureItems}/${captureItemCount} capture items`);
    }

    // Step 7: Create investor conversations and messages
    // Links to first 6 leads and optionally their properties
    console.log('[investorSeeder] Creating investor conversations...');
    const conversationCount = Math.min(getTestInvestorConversationCount(), createdLeads.length);
    const createdConversations: Array<{ id: string; lead_index: number }> = [];

    for (let i = 0; i < conversationCount; i++) {
      const leadId = createdLeads[i].id;
      // Link to property if lead has one (properties 0-39 are linked to leads 0-19)
      const propertyId = i < 20 && createdProperties.length > i * 2 ? createdProperties[i * 2].id : undefined;
      // Link to deal if exists
      const dealId = i < createdDeals.length ? createdDeals[i].id : undefined;

      const conversationData = createTestInvestorConversation(i, userId, leadId, propertyId, dealId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('investor_conversations' as any) as any)
        .insert(conversationData)
        .select('id')
        .single();

      if (error) {
        if (isTableNotFoundError(error)) {
          // Table not yet created - warn but don't fail
          if (i === 0) { // Only log once
            result.warnings!.push('investor_conversations table not yet created (run migration first)');
            console.info('[investorSeeder] investor_conversations table not found, skipping seed');
          }
          break; // No point trying more conversations
        } else {
          // Real error
          result.errors!.push(`Investor Conversation ${i}: ${error.message}`);
          console.error(`[seedService] Investor Conversation ${i} error:`, error);
        }
        continue;
      }

      if (data) {
        createdConversations.push({ id: data.id, lead_index: i });
        result.counts.investorConversations++;
      }
    }

    console.log('[investorSeeder] Created investor conversations:', result.counts.investorConversations);

    // Step 8: Create messages for each conversation
    console.log('[investorSeeder] Creating investor messages...');
    for (const conv of createdConversations) {
      const messagesData = createTestInvestorMessages(conv.lead_index, conv.id);

      for (const msgData of messagesData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('investor_messages' as any) as any)
          .insert(msgData);

        if (error) {
          if (isTableNotFoundError(error)) {
            // Table not yet created - warn but don't fail
            result.warnings!.push('investor_messages table not yet created (run migration first)');
            console.info('[investorSeeder] investor_messages table not found, skipping seed');
            break; // No point trying more messages
          } else {
            // Real error
            result.errors!.push(`Investor Message for conv ${conv.id}: ${error.message}`);
            console.error(`[seedService] Investor Message error:`, error);
          }
          continue;
        }

        result.counts.investorMessages++;
      }
    }

    console.log('[investorSeeder] Created investor messages:', result.counts.investorMessages);

    // Step 9: Create AI queue items for conversations with unread messages
    // Only create pending items for active conversations with AI enabled
    console.log('[investorSeeder] Creating investor AI queue items...');
    const aiQueueCount = Math.min(getTestInvestorAIQueueCount(), createdConversations.length);

    for (let i = 0; i < aiQueueCount; i++) {
      const conv = createdConversations[i];
      const queueData = createTestInvestorAIQueueItem(i, userId, conv.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('investor_ai_queue_items' as any) as any)
        .insert(queueData);

      if (error) {
        if (isTableNotFoundError(error)) {
          // Table not yet created - warn but don't fail
          if (i === 0) { // Only log once
            result.warnings!.push('investor_ai_queue_items table not yet created (run migration first)');
            console.info('[investorSeeder] investor_ai_queue_items table not found, skipping seed');
          }
          break; // No point trying more queue items
        } else {
          // Real error
          result.errors!.push(`Investor AI Queue ${i}: ${error.message}`);
          console.error(`[seedService] Investor AI Queue ${i} error:`, error);
        }
        continue;
      }

      result.counts.investorAIQueue++;
    }

    console.log('[investorSeeder] Created investor AI queue items:', result.counts.investorAIQueue);

    // Check if any errors occurred
    if (result.errors && result.errors.length > 0) {
      result.success = false;
      console.error('[investorSeeder] Seed completed with errors:', result.errors);
    } else {
      console.log('[investorSeeder] Seed completed successfully');
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
    console.error('[investorSeeder] Fatal error during seed:', message);
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

/**
 * Investor database seeding service for development testing.
 * Provides triple-layered safety checks to prevent production use.
 */
export const investorSeeder = {
  canSeedInvestorDatabase: canSeedDatabase,
  clearInvestorData: clearDatabase,
  seedInvestorData: seedDatabase,
};

// Backward compatibility alias - will be removed in future version
export const seedService = {
  canSeedDatabase,
  clearDatabase,
  seedDatabase,
};

export default investorSeeder;
