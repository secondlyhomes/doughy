// src/features/admin/services/investor-seeder/seed-database.ts
// Seed investor data into the database

import { supabase } from '@/lib/supabase';
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
} from '../../factories/testDataFactories';

import type { SeedResult } from './types';
import { canSeedDatabase, isTableNotFoundError } from './safety-checks';
import { clearDatabase } from './clear-database';

/**
 * Seed the database with deterministic test data in proper foreign key order.
 *
 * @param userId - User ID to associate all data with
 * @returns SeedResult with counts of created records
 */
export async function seedDatabase(userId: string): Promise<SeedResult> {
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

    // Get user's workspace
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

    // Clear existing data first
    console.log('[investorSeeder] Clearing existing data...');
    const clearResult = await clearDatabase(userId);
    if (!clearResult.success) {
      console.error('[investorSeeder] Clear failed, aborting seed to prevent data corruption');
      return {
        success: false,
        counts: result.counts,
        errors: [`Clear database failed: ${clearResult.errors?.join(', ') || 'Unknown error'}. Seed aborted.`],
      };
    }

    // Create leads
    console.log('[investorSeeder] Creating leads...');
    const leadCount = getTestLeadCount();
    const createdLeads: Array<{ id: string }> = [];

    for (let i = 0; i < leadCount; i++) {
      const leadData = createTestLead(i, userId, workspaceId);
      const { data, error } = await supabase
        .schema('crm').from('leads')
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

    // Create properties with lead_id relationships
    console.log('[investorSeeder] Creating properties...');
    const propertyCount = getTestPropertyCount();
    const createdProperties: Array<{ id: string }> = [];

    const getLeadIdForProperty = (propertyIndex: number): string | undefined => {
      if (propertyIndex < 40) {
        const leadIndex = Math.floor(propertyIndex / 2);
        return leadIndex < createdLeads.length ? createdLeads[leadIndex].id : undefined;
      } else if (propertyIndex < 60) {
        const leadIndex = 20 + (propertyIndex - 40);
        return leadIndex < createdLeads.length ? createdLeads[leadIndex].id : undefined;
      }
      return undefined;
    };

    for (let i = 0; i < propertyCount; i++) {
      const leadId = getLeadIdForProperty(i);
      const propertyData = createTestProperty(i, userId, workspaceId, leadId);
      const { data, error } = await supabase
        .schema('investor').from('properties')
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

    // Create deals
    console.log('[investorSeeder] Creating deals...');
    const dealCount = Math.min(getTestDealCount(), createdLeads.length, createdProperties.length);
    const createdDeals: Array<{ id: string }> = [];

    for (let i = 0; i < dealCount; i++) {
      const leadId = createdLeads[i].id;
      const propertyId = createdProperties[i].id;
      const dealData = createTestDeal(i, userId, leadId, propertyId);

      const { data, error } = await supabase
        .schema('investor').from('deals_pipeline')
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

    // Create capture items
    console.log('[investorSeeder] Creating capture items...');
    const captureItemCount = getTestCaptureItemCount();

    for (let i = 0; i < captureItemCount; i++) {
      const context = {
        leadId: createdLeads.length > 0 ? createdLeads[i % createdLeads.length].id : undefined,
        propertyId: createdProperties.length > 0 ? createdProperties[i % createdProperties.length].id : undefined,
        dealId: createdDeals.length > 0 ? createdDeals[i % createdDeals.length].id : undefined,
      };

      const captureItemData = createTestCaptureItem(i, userId, context);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.schema('ai').from('capture_items' as any) as any)
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

    // Create investor conversations
    console.log('[investorSeeder] Creating investor conversations...');
    const conversationCount = Math.min(getTestInvestorConversationCount(), createdLeads.length);
    const createdConversations: Array<{ id: string; lead_index: number }> = [];

    for (let i = 0; i < conversationCount; i++) {
      const leadId = createdLeads[i].id;
      const propertyId = i < 20 && createdProperties.length > i * 2 ? createdProperties[i * 2].id : undefined;
      const dealId = i < createdDeals.length ? createdDeals[i].id : undefined;

      const conversationData = createTestInvestorConversation(i, userId, leadId, propertyId, dealId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.schema('investor').from('conversations' as any) as any)
        .insert(conversationData)
        .select('id')
        .single();

      if (error) {
        if (isTableNotFoundError(error)) {
          if (i === 0) {
            result.warnings!.push('investor_conversations table not yet created (run migration first)');
            console.info('[investorSeeder] investor_conversations table not found, skipping seed');
          }
          break;
        } else {
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

    // Create messages for each conversation
    console.log('[investorSeeder] Creating investor messages...');
    for (const conv of createdConversations) {
      const messagesData = createTestInvestorMessages(conv.lead_index, conv.id);

      for (const msgData of messagesData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.schema('investor').from('messages' as any) as any)
          .insert(msgData);

        if (error) {
          if (isTableNotFoundError(error)) {
            result.warnings!.push('investor_messages table not yet created (run migration first)');
            console.info('[investorSeeder] investor_messages table not found, skipping seed');
            break;
          } else {
            result.errors!.push(`Investor Message for conv ${conv.id}: ${error.message}`);
            console.error(`[seedService] Investor Message error:`, error);
          }
          continue;
        }

        result.counts.investorMessages++;
      }
    }

    console.log('[investorSeeder] Created investor messages:', result.counts.investorMessages);

    // Create AI queue items
    console.log('[investorSeeder] Creating investor AI queue items...');
    const aiQueueCount = Math.min(getTestInvestorAIQueueCount(), createdConversations.length);

    for (let i = 0; i < aiQueueCount; i++) {
      const conv = createdConversations[i];
      const queueData = createTestInvestorAIQueueItem(i, userId, conv.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.schema('investor').from('ai_queue_items' as any) as any)
        .insert(queueData);

      if (error) {
        if (isTableNotFoundError(error)) {
          if (i === 0) {
            result.warnings!.push('investor_ai_queue_items table not yet created (run migration first)');
            console.info('[investorSeeder] investor_ai_queue_items table not found, skipping seed');
          }
          break;
        } else {
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
