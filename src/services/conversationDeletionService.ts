// src/services/conversationDeletionService.ts
// Zone D: Conversation deletion service for managing conversation lifecycle
// Note: This service uses dynamic table access since 'conversations' table
// is not yet defined in the Supabase schema. Operations will work once
// the table is created.
//
// IMPORTANT: For production use, consider implementing cascade deletes via:
// 1. Database-level ON DELETE CASCADE foreign key constraints
// 2. Supabase RLS policies with cascade triggers
// 3. A Supabase Edge Function with proper transaction handling
//
// The current implementation uses application-level cascade with best-effort
// consistency. For critical data, database-level constraints are recommended.

import { supabase } from '@/lib/supabase';

// Type-safe access to conversations table (bypasses strict schema typing)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const conversationsTable = () => supabase.from('conversations' as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const messagesTable = () => supabase.from('comms_messages' as any);

export interface DeleteConversationResult {
  success: boolean;
  error?: string;
  /** Indicates if partial deletion occurred (e.g., messages deleted but conversation remains) */
  partialFailure?: boolean;
  /** Non-fatal warnings that don't prevent operation success */
  warnings?: string[];
}

export interface DeleteMultipleResult {
  deleted: number;
  failed: number;
  errors: string[];
  /** IDs of conversations that may have orphaned messages due to partial failures */
  partialFailureIds?: string[];
  /** Non-fatal warnings about edge cases or partial successes */
  warnings?: string[];
}

/**
 * Service for managing conversation deletion operations.
 * Supports both soft delete (archive) and hard delete patterns.
 */
export const conversationDeletionService = {
  /**
   * Soft delete a conversation by marking it as archived.
   * This preserves data for potential recovery.
   */
  async archiveConversation(conversationId: string): Promise<DeleteConversationResult> {
    try {
      const { error } = await conversationsTable()
        .update({ is_archived: true, archived_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error archiving conversation';
      return { success: false, error: message };
    }
  },

  /**
   * Hard delete a conversation and all associated messages.
   * This is irreversible.
   *
   * Note: This operation is not atomic. If message deletion succeeds but
   * conversation deletion fails, the result will indicate a partial failure.
   * For production, use database-level CASCADE constraints.
   */
  async deleteConversation(conversationId: string): Promise<DeleteConversationResult> {
    let messagesDeleted = false;
    const warnings: string[] = [];

    try {
      // First delete associated messages
      const { error: messagesError } = await messagesTable()
        .delete()
        .eq('conversation_id', conversationId);

      if (messagesError) {
        return { success: false, error: `Failed to delete messages: ${messagesError.message}` };
      }

      messagesDeleted = true;

      // Then delete the conversation
      const { error, count } = await conversationsTable()
        .delete()
        .eq('id', conversationId)
        .select('id');

      if (error) {
        // Messages were deleted but conversation deletion failed - partial failure
        console.error(`Partial failure: Messages deleted but conversation ${conversationId} remains`);
        return {
          success: false,
          error: `Conversation deletion failed after messages were deleted: ${error.message}`,
          partialFailure: true
        };
      }

      // Check if conversation actually existed
      if (count === 0) {
        warnings.push('Conversation may have already been deleted or never existed');
        return { success: true, warnings: warnings.length > 0 ? warnings : undefined };
      }

      return { success: true, warnings: warnings.length > 0 ? warnings : undefined };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error deleting conversation';
      return {
        success: false,
        error: message,
        partialFailure: messagesDeleted
      };
    }
  },

  /**
   * Archive multiple conversations at once.
   */
  async archiveMultiple(conversationIds: string[]): Promise<DeleteMultipleResult> {
    const result: DeleteMultipleResult = { deleted: 0, failed: 0, errors: [] };

    if (conversationIds.length === 0) {
      return result;
    }

    try {
      const { error, count } = await conversationsTable()
        .update({ is_archived: true, archived_at: new Date().toISOString() })
        .in('id', conversationIds);

      if (error) {
        result.failed = conversationIds.length;
        result.errors.push(error.message);
      } else {
        result.deleted = count ?? conversationIds.length;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error archiving conversations';
      result.failed = conversationIds.length;
      result.errors.push(message);
    }

    return result;
  },

  /**
   * Hard delete multiple conversations at once.
   * This is irreversible.
   *
   * Note: This operation is not atomic. Partial failures may occur.
   */
  async deleteMultiple(conversationIds: string[]): Promise<DeleteMultipleResult> {
    const result: DeleteMultipleResult = { deleted: 0, failed: 0, errors: [], partialFailureIds: [], warnings: [] };

    if (conversationIds.length === 0) {
      return result;
    }

    let messagesDeleted = false;

    try {
      // First delete all associated messages
      const { error: messagesError } = await messagesTable()
        .delete()
        .in('conversation_id', conversationIds);

      if (messagesError) {
        // If we can't delete messages, don't proceed with conversation deletion
        result.errors.push(`Failed to delete messages: ${messagesError.message}`);
        result.failed = conversationIds.length;
        return result;
      }

      messagesDeleted = true;

      // Then delete the conversations
      const { error, count } = await conversationsTable()
        .delete()
        .in('id', conversationIds);

      if (error) {
        // Messages were deleted but conversations remain - partial failure
        result.failed = conversationIds.length;
        result.errors.push(`Conversations deletion failed after messages were deleted: ${error.message}`);
        result.partialFailureIds = conversationIds;
        console.error(`Partial failure: Messages deleted but ${conversationIds.length} conversations may remain orphaned`);
      } else {
        const actualDeleted = count ?? 0;
        result.deleted = actualDeleted;
        // If fewer conversations were deleted than expected, some may not have existed
        if (actualDeleted < conversationIds.length) {
          result.failed = conversationIds.length - actualDeleted;
          result.warnings!.push(`${conversationIds.length - actualDeleted} conversations may have already been deleted or never existed`);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error deleting conversations';
      result.failed = conversationIds.length;
      result.errors.push(message);
      if (messagesDeleted) {
        result.partialFailureIds = conversationIds;
      }
    }

    // Clean up empty warnings array
    if (result.warnings!.length === 0) {
      delete result.warnings;
    }

    return result;
  },

  /**
   * Restore an archived conversation.
   */
  async restoreConversation(conversationId: string): Promise<DeleteConversationResult> {
    try {
      const { error } = await conversationsTable()
        .update({ is_archived: false, archived_at: null })
        .eq('id', conversationId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error restoring conversation';
      return { success: false, error: message };
    }
  },

  /**
   * Permanently delete all archived conversations older than a given date.
   * Use this for cleanup of old archived data.
   *
   * This method uses a two-phase approach to minimize race conditions:
   * 1. Fetches IDs with a FOR UPDATE lock (if supported) or uses a timestamp window
   * 2. Deletes by IDs to ensure consistency
   */
  async purgeArchivedOlderThan(date: Date): Promise<DeleteMultipleResult> {
    const result: DeleteMultipleResult = { deleted: 0, failed: 0, errors: [], partialFailureIds: [] };

    try {
      // Use a slightly older timestamp to avoid race conditions with recent archives
      const safeDate = new Date(date.getTime() - 1000); // 1 second buffer

      // Get IDs of conversations to purge
      const { data: conversationsToDelete, error: fetchError } = await conversationsTable()
        .select('id')
        .eq('is_archived', true)
        .lt('archived_at', safeDate.toISOString());

      if (fetchError) {
        result.errors.push(`Failed to fetch conversations: ${fetchError.message}`);
        return result;
      }

      if (!conversationsToDelete || conversationsToDelete.length === 0) {
        return result;
      }

      // Validate the data structure before processing
      const ids: string[] = [];
      for (const conv of conversationsToDelete as unknown[]) {
        if (conv && typeof conv === 'object' && 'id' in conv && typeof (conv as { id: unknown }).id === 'string') {
          ids.push((conv as { id: string }).id);
        }
      }

      if (ids.length === 0) {
        return result;
      }

      return this.deleteMultiple(ids);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error purging conversations';
      result.errors.push(message);
      return result;
    }
  },
};

export default conversationDeletionService;
