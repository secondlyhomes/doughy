// src/features/admin/services/investor-seeder/clear-database.ts
// Clear investor data from the database

import { supabase } from '@/lib/supabase';

import type { ClearResult } from './types';
import { canSeedDatabase, isTableNotFoundError } from './safety-checks';

/**
 * Clear all user data from the database in reverse foreign key order.
 * This prevents foreign key constraint violations.
 *
 * @param userId - User ID to scope deletions to (RLS protection)
 * @returns ClearResult with counts of deleted records
 */
export async function clearDatabase(userId: string): Promise<ClearResult> {
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

    // Delete investor_ai_queue_items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: deletedAIQueue, error: aiQueueError } = await (supabase.from('investor_ai_queue_items' as any) as any)
      .delete()
      .eq('user_id', userId)
      .select('id');

    if (aiQueueError) {
      if (isTableNotFoundError(aiQueueError)) {
        result.warnings!.push('investor_ai_queue_items table not yet created (run migration first)');
        console.info('[investorSeeder] investor_ai_queue_items table not found, skipping');
      } else {
        result.errors!.push(`Investor AI Queue: ${aiQueueError.message}`);
        console.error('[investorSeeder] Error deleting investor AI queue:', aiQueueError);
      }
    } else {
      result.counts.investorAIQueue = deletedAIQueue?.length || 0;
      console.log('[investorSeeder] Deleted investor AI queue items:', deletedAIQueue?.length || 0);
    }

    // Delete investor_messages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userConversations, error: convQueryError } = await (supabase.from('investor_conversations' as any) as any)
      .select('id')
      .eq('user_id', userId);

    if (convQueryError) {
      if (isTableNotFoundError(convQueryError)) {
        result.warnings!.push('investor_conversations table not yet created (run migration first)');
        console.info('[investorSeeder] investor_conversations table not found, skipping messages deletion');
      } else {
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

    // Delete investor_conversations
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

    // Delete capture_items
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

    // Delete deals
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

    // Delete documents
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

    // Delete properties
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

    // Delete leads (last, no dependencies)
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
