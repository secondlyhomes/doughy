// Tests for conversationDeletionService.ts
import { conversationDeletionService } from '../conversationDeletionService';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase');
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('conversationDeletionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn(); // Suppress console.error during tests
  });

  describe('archiveConversation', () => {
    it('successfully archives a conversation', async () => {
      const mockUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockUpdate);

      const result = await conversationDeletionService.archiveConversation('conv-1');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockUpdate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_archived: true,
        })
      );
    });

    it('returns error when archive fails', async () => {
      const mockUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Database error' } }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockUpdate);

      const result = await conversationDeletionService.archiveConversation('conv-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('handles exceptions gracefully', async () => {
      mockSupabase.from = jest.fn().mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const result = await conversationDeletionService.archiveConversation('conv-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });

    it('handles unknown error type', async () => {
      mockSupabase.from = jest.fn().mockImplementation(() => {
        throw 'String error'; // Non-Error type
      });

      const result = await conversationDeletionService.archiveConversation('conv-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error archiving conversation');
    });
  });

  describe('deleteConversation', () => {
    it('successfully deletes conversation and messages', async () => {
      const mockMessagesQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      const mockConversationsQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ error: null, count: 1 }),
      };

      mockSupabase.from = jest.fn()
        .mockReturnValueOnce(mockMessagesQuery) // First call for messages
        .mockReturnValueOnce(mockConversationsQuery); // Second call for conversation

      const result = await conversationDeletionService.deleteConversation('conv-1');

      expect(result.success).toBe(true);
      expect(result.partialFailure).toBeUndefined();
      expect(mockMessagesQuery.delete).toHaveBeenCalled();
      expect(mockConversationsQuery.delete).toHaveBeenCalled();
    });

    it('handles message deletion failure', async () => {
      const mockMessagesQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Messages deletion failed' } }),
      };

      mockSupabase.from = jest.fn().mockReturnValue(mockMessagesQuery);

      const result = await conversationDeletionService.deleteConversation('conv-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to delete messages');
      expect(result.partialFailure).toBeUndefined();
    });

    it('handles partial failure (messages deleted, conversation failed)', async () => {
      const mockMessagesQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      const mockConversationsQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ error: { message: 'Conv deletion failed' }, count: null }),
      };

      mockSupabase.from = jest.fn()
        .mockReturnValueOnce(mockMessagesQuery)
        .mockReturnValueOnce(mockConversationsQuery);

      const result = await conversationDeletionService.deleteConversation('conv-1');

      expect(result.success).toBe(false);
      expect(result.partialFailure).toBe(true);
      expect(result.error).toContain('Conversation deletion failed after messages were deleted');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Partial failure')
      );
    });

    it('handles idempotent deletion (already deleted)', async () => {
      const mockMessagesQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      const mockConversationsQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ error: null, count: 0 }),
      };

      mockSupabase.from = jest.fn()
        .mockReturnValueOnce(mockMessagesQuery)
        .mockReturnValueOnce(mockConversationsQuery);

      const result = await conversationDeletionService.deleteConversation('conv-1');

      expect(result.success).toBe(true);
    });

    it('handles exceptions during deletion', async () => {
      mockSupabase.from = jest.fn().mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = await conversationDeletionService.deleteConversation('conv-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.partialFailure).toBe(false);
    });

    it('tracks partial failure on exception after messages deleted', async () => {
      const mockMessagesQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      let callCount = 0;
      mockSupabase.from = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return mockMessagesQuery;
        throw new Error('Conversation deletion exception');
      });

      const result = await conversationDeletionService.deleteConversation('conv-1');

      expect(result.success).toBe(false);
      expect(result.partialFailure).toBe(true);
    });
  });

  describe('archiveMultiple', () => {
    it('successfully archives multiple conversations', async () => {
      const mockUpdate = {
        update: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ error: null, count: 3 }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockUpdate);

      const result = await conversationDeletionService.archiveMultiple(['c1', 'c2', 'c3']);

      expect(result.deleted).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it('handles empty array', async () => {
      const result = await conversationDeletionService.archiveMultiple([]);

      expect(result.deleted).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toEqual([]);
    });

    it('handles archive failure for multiple', async () => {
      const mockUpdate = {
        update: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ error: { message: 'Batch error' }, count: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockUpdate);

      const result = await conversationDeletionService.archiveMultiple(['c1', 'c2']);

      expect(result.deleted).toBe(0);
      expect(result.failed).toBe(2);
      expect(result.errors).toContain('Batch error');
    });

    it('handles exceptions during batch archive', async () => {
      mockSupabase.from = jest.fn().mockImplementation(() => {
        throw new Error('Connection error');
      });

      const result = await conversationDeletionService.archiveMultiple(['c1', 'c2']);

      expect(result.deleted).toBe(0);
      expect(result.failed).toBe(2);
      expect(result.errors).toContain('Connection error');
    });
  });

  describe('deleteMultiple', () => {
    it('successfully deletes multiple conversations', async () => {
      const mockMessagesQuery = {
        delete: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ error: null }),
      };
      const mockConversationsQuery = {
        delete: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ error: null, count: 2 }),
      };

      mockSupabase.from = jest.fn()
        .mockReturnValueOnce(mockMessagesQuery)
        .mockReturnValueOnce(mockConversationsQuery);

      const result = await conversationDeletionService.deleteMultiple(['c1', 'c2']);

      expect(result.deleted).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toEqual([]);
      expect(result.partialFailureIds).toEqual([]);
    });

    it('handles empty array', async () => {
      const result = await conversationDeletionService.deleteMultiple([]);

      expect(result.deleted).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('handles messages deletion failure', async () => {
      const mockMessagesQuery = {
        delete: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ error: { message: 'Messages error' } }),
      };

      mockSupabase.from = jest.fn().mockReturnValue(mockMessagesQuery);

      const result = await conversationDeletionService.deleteMultiple(['c1', 'c2']);

      expect(result.deleted).toBe(0);
      expect(result.failed).toBe(2);
      expect(result.errors).toContain('Failed to delete messages: Messages error');
      // partialFailureIds should be empty array since messages weren't deleted
      expect(result.partialFailureIds).toEqual([]);
    });

    it('handles partial failure in batch delete', async () => {
      const mockMessagesQuery = {
        delete: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ error: null }),
      };
      const mockConversationsQuery = {
        delete: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ error: { message: 'Conv error' }, count: null }),
      };

      mockSupabase.from = jest.fn()
        .mockReturnValueOnce(mockMessagesQuery)
        .mockReturnValueOnce(mockConversationsQuery);

      const result = await conversationDeletionService.deleteMultiple(['c1', 'c2']);

      expect(result.deleted).toBe(0);
      expect(result.failed).toBe(2);
      expect(result.partialFailureIds).toEqual(['c1', 'c2']);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Partial failure')
      );
    });

    it('handles fewer deletions than expected', async () => {
      const mockMessagesQuery = {
        delete: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ error: null }),
      };
      const mockConversationsQuery = {
        delete: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ error: null, count: 1 }),
      };

      mockSupabase.from = jest.fn()
        .mockReturnValueOnce(mockMessagesQuery)
        .mockReturnValueOnce(mockConversationsQuery);

      const result = await conversationDeletionService.deleteMultiple(['c1', 'c2', 'c3']);

      expect(result.deleted).toBe(1);
      expect(result.failed).toBe(2); // 3 - 1 = 2
    });
  });

  describe('restoreConversation', () => {
    it('successfully restores an archived conversation', async () => {
      const mockUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockUpdate);

      const result = await conversationDeletionService.restoreConversation('conv-1');

      expect(result.success).toBe(true);
      expect(mockUpdate.update).toHaveBeenCalledWith({
        is_archived: false,
        archived_at: null,
      });
    });

    it('handles restore failure', async () => {
      const mockUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Restore failed' } }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockUpdate);

      const result = await conversationDeletionService.restoreConversation('conv-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Restore failed');
    });
  });

  describe('purgeArchivedOlderThan', () => {
    it('successfully purges old archived conversations', async () => {
      const mockConversations = [
        { id: 'c1' },
        { id: 'c2' },
      ];
      const mockSelectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: mockConversations, error: null }),
      };

      // Mock deleteMultiple success
      const mockMessagesQuery = {
        delete: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ error: null }),
      };
      const mockConversationsQuery = {
        delete: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ error: null, count: 2 }),
      };

      mockSupabase.from = jest.fn()
        .mockReturnValueOnce(mockSelectQuery) // Select old conversations
        .mockReturnValueOnce(mockMessagesQuery) // Delete messages
        .mockReturnValueOnce(mockConversationsQuery); // Delete conversations

      const cutoffDate = new Date('2024-01-01');
      const result = await conversationDeletionService.purgeArchivedOlderThan(cutoffDate);

      expect(result.deleted).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('handles no conversations to purge', async () => {
      const mockSelectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabase.from = jest.fn().mockReturnValue(mockSelectQuery);

      const cutoffDate = new Date('2024-01-01');
      const result = await conversationDeletionService.purgeArchivedOlderThan(cutoffDate);

      expect(result.deleted).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('handles fetch error', async () => {
      const mockSelectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: null, error: { message: 'Fetch error' } }),
      };

      mockSupabase.from = jest.fn().mockReturnValue(mockSelectQuery);

      const cutoffDate = new Date('2024-01-01');
      const result = await conversationDeletionService.purgeArchivedOlderThan(cutoffDate);

      expect(result.deleted).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toContain('Failed to fetch conversations: Fetch error');
    });

    it('validates data structure before processing', async () => {
      const invalidData = [
        { id: 'valid-1' },
        { noId: 'invalid' }, // Missing id
        null, // Null entry
        { id: 123 }, // Wrong type for id
      ];

      const mockSelectQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: invalidData, error: null }),
      };

      const mockMessagesQuery = {
        delete: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ error: null }),
      };
      const mockConversationsQuery = {
        delete: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ error: null, count: 1 }),
      };

      mockSupabase.from = jest.fn()
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockMessagesQuery)
        .mockReturnValueOnce(mockConversationsQuery);

      const cutoffDate = new Date('2024-01-01');
      const result = await conversationDeletionService.purgeArchivedOlderThan(cutoffDate);

      // Should only process valid ID
      expect(result.deleted).toBe(1);
    });

    it('handles exceptions during purge', async () => {
      mockSupabase.from = jest.fn().mockImplementation(() => {
        throw new Error('Purge error');
      });

      const cutoffDate = new Date('2024-01-01');
      const result = await conversationDeletionService.purgeArchivedOlderThan(cutoffDate);

      expect(result.deleted).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toContain('Purge error');
    });
  });
});
