// src/services/conversationDeletionService.ts
// Zone D: Conversation deletion service for managing conversation lifecycle
// Note: This service uses dynamic table access since 'conversations' table
// is not yet defined in the Supabase schema. Operations will work once
// the table is created.

import { supabase } from '@/lib/supabase';

// Type-safe access to conversations table (bypasses strict schema typing)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const conversationsTable = () => supabase.from('conversations' as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const messagesTable = () => supabase.from('messages' as any);

export interface DeleteConversationResult {
  success: boolean;
  error?: string;
}

export interface DeleteMultipleResult {
  deleted: number;
  failed: number;
  errors: string[];
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
   */
  async deleteConversation(conversationId: string): Promise<DeleteConversationResult> {
    try {
      // First delete associated messages
      const { error: messagesError } = await messagesTable()
        .delete()
        .eq('conversation_id', conversationId);

      if (messagesError) {
        return { success: false, error: `Failed to delete messages: ${messagesError.message}` };
      }

      // Then delete the conversation
      const { error } = await conversationsTable()
        .delete()
        .eq('id', conversationId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error deleting conversation';
      return { success: false, error: message };
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
   */
  async deleteMultiple(conversationIds: string[]): Promise<DeleteMultipleResult> {
    const result: DeleteMultipleResult = { deleted: 0, failed: 0, errors: [] };

    if (conversationIds.length === 0) {
      return result;
    }

    try {
      // First delete all associated messages
      const { error: messagesError } = await messagesTable()
        .delete()
        .in('conversation_id', conversationIds);

      if (messagesError) {
        result.errors.push(`Failed to delete messages: ${messagesError.message}`);
      }

      // Then delete the conversations
      const { error, count } = await conversationsTable()
        .delete()
        .in('id', conversationIds);

      if (error) {
        result.failed = conversationIds.length;
        result.errors.push(error.message);
      } else {
        result.deleted = count ?? conversationIds.length;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error deleting conversations';
      result.failed = conversationIds.length;
      result.errors.push(message);
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
   */
  async purgeArchivedOlderThan(date: Date): Promise<DeleteMultipleResult> {
    const result: DeleteMultipleResult = { deleted: 0, failed: 0, errors: [] };

    try {
      // Get IDs of conversations to purge
      const { data: conversationsToDelete, error: fetchError } = await conversationsTable()
        .select('id')
        .eq('is_archived', true)
        .lt('archived_at', date.toISOString());

      if (fetchError) {
        result.errors.push(`Failed to fetch conversations: ${fetchError.message}`);
        return result;
      }

      if (!conversationsToDelete || conversationsToDelete.length === 0) {
        return result;
      }

      const ids = conversationsToDelete.map(c => c.id);
      return this.deleteMultiple(ids);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error purging conversations';
      result.errors.push(message);
      return result;
    }
  },
};

export default conversationDeletionService;
