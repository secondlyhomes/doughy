// src/stores/__tests__/rental-conversations-store.test.ts
// Comprehensive tests for the rental conversations Zustand store

import { act } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import {
  useRentalConversationsStore,
  selectConversations,
  selectConversationsWithRelations,
  selectMessages,
  selectPendingResponses,
  selectPendingCount,
  selectNeedsReviewConversations,
  type Conversation,
  type ConversationWithRelations,
  type Message,
  type AIResponseQueueItem,
  type ApprovalMetadata,
} from '../rental-conversations-store';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    })),
  },
}));
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('useRentalConversationsStore', () => {
  // Reset store state before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state
    const store = useRentalConversationsStore.getState();
    store.reset();
  });

  // ============================================
  // Mock Data
  // ============================================

  const mockConversation: Conversation = {
    id: 'conv-1',
    user_id: 'user-1',
    contact_id: 'contact-1',
    property_id: 'property-1',
    booking_id: null,
    channel: 'email',
    platform: 'gmail',
    external_thread_id: 'thread-123',
    status: 'active',
    is_ai_enabled: true,
    is_ai_auto_respond: false,
    ai_confidence_threshold: 85,
    ai_personality: null,
    subject: null,
    message_count: 5,
    unread_count: 0,
    last_message_at: new Date().toISOString(),
    last_message_preview: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockConversationWithRelations: ConversationWithRelations = {
    ...mockConversation,
    contact: {
      id: 'contact-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
      contact_types: ['lead'],
    },
    property: {
      id: 'property-1',
      name: 'Beach House',
      address: '123 Ocean Ave',
    },
    lastMessage: null,
    pendingResponse: null,
  };

  const mockMessage: Message = {
    id: 'msg-1',
    conversation_id: 'conv-1',
    direction: 'inbound',
    content: 'Hello, I am interested in your property',
    content_type: 'text',
    sent_by: 'contact',
    ai_confidence: null,
    ai_model: null,
    ai_prompt_token_count: null,
    ai_completion_token_count: null,
    is_requires_approval: false,
    approved_by: null,
    approved_at: null,
    edited_content: null,
    delivered_at: null,
    read_at: null,
    failed_at: null,
    failure_reason: null,
    attachments: [],
    metadata: {},
    created_at: new Date().toISOString(),
  };

  const mockPendingResponse: AIResponseQueueItem = {
    id: 'queue-1',
    user_id: 'user-1',
    conversation_id: 'conv-1',
    trigger_message_id: 'msg-1',
    sent_message_id: null,
    suggested_response: 'Thank you for your interest! The property is available.',
    confidence: 0.85,
    reasoning: 'FAQ response',
    intent: 'inquiry',
    detected_topics: ['availability'],
    alternatives: [],
    status: 'pending',
    final_response: null,
    reviewed_at: null,
    reviewed_by: null,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    created_at: new Date().toISOString(),
    // Learning context fields
    message_type: 'inquiry',
    topic: 'availability',
    contact_type: 'lead',
  };

  const mockExpiredResponse: AIResponseQueueItem = {
    ...mockPendingResponse,
    id: 'queue-expired',
    expires_at: new Date(Date.now() - 1000).toISOString(), // Already expired
  };

  // ============================================
  // Initial State Tests
  // ============================================

  describe('Initial State', () => {
    it('starts with empty conversations array', () => {
      const state = useRentalConversationsStore.getState();
      expect(state.conversations).toEqual([]);
    });

    it('starts with empty conversationsWithRelations array', () => {
      const state = useRentalConversationsStore.getState();
      expect(state.conversationsWithRelations).toEqual([]);
    });

    it('starts with empty messages object', () => {
      const state = useRentalConversationsStore.getState();
      expect(state.messages).toEqual({});
    });

    it('starts with empty pendingResponses array', () => {
      const state = useRentalConversationsStore.getState();
      expect(state.pendingResponses).toEqual([]);
    });

    it('starts with null selectedConversationId', () => {
      const state = useRentalConversationsStore.getState();
      expect(state.selectedConversationId).toBeNull();
    });

    it('starts with default filters', () => {
      const state = useRentalConversationsStore.getState();
      expect(state.statusFilter).toBe('all');
      expect(state.channelFilter).toBe('all');
    });

    it('starts with loading states as false', () => {
      const state = useRentalConversationsStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(false);
      expect(state.isSending).toBe(false);
    });

    it('starts with null error', () => {
      const state = useRentalConversationsStore.getState();
      expect(state.error).toBeNull();
    });
  });

  // ============================================
  // fetchConversations Tests
  // ============================================

  describe('fetchConversations', () => {
    it('sets isLoading to true while fetching', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue(
            new Promise(() => {}) // Never resolves - simulates in-flight request
          ),
        }),
      } as any);

      const store = useRentalConversationsStore.getState();

      // Start the fetch but don't await it
      act(() => {
        store.fetchConversations();
      });

      // Check loading state
      const stateWhileLoading = useRentalConversationsStore.getState();
      expect(stateWhileLoading.isLoading).toBe(true);
    });

    it('populates conversations on successful fetch', async () => {
      const mockData = [mockConversationWithRelations];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      } as any);

      const store = useRentalConversationsStore.getState();

      await act(async () => {
        await store.fetchConversations();
      });

      const state = useRentalConversationsStore.getState();
      expect(state.conversations.length).toBe(1);
      expect(state.conversationsWithRelations.length).toBe(1);
      expect(state.conversationsWithRelations[0].contact?.first_name).toBe('John');
      expect(state.isLoading).toBe(false);
    });

    it('handles fetch errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' },
          }),
        }),
      } as any);

      const store = useRentalConversationsStore.getState();

      await act(async () => {
        await store.fetchConversations();
      });

      const state = useRentalConversationsStore.getState();
      // Store wraps errors with user-friendly messages
      expect(state.error).toBe('Failed to fetch conversations');
      expect(state.isLoading).toBe(false);
    });

    it('clears error before fetching', async () => {
      // Set an existing error
      useRentalConversationsStore.setState({ error: 'Previous error' });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      const store = useRentalConversationsStore.getState();

      await act(async () => {
        await store.fetchConversations();
      });

      const state = useRentalConversationsStore.getState();
      expect(state.error).toBeNull();
    });

    it('queries the correct table with proper select query', async () => {
      const selectMock = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
      } as any);

      const store = useRentalConversationsStore.getState();

      await act(async () => {
        await store.fetchConversations();
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
      // Verify select includes relations (using FK hint format)
      const selectQuery = selectMock.mock.calls[0][0];
      expect(selectQuery).toContain('contact:contacts!landlord_conversations_contact_id_fkey');
      expect(selectQuery).toContain('property:properties');
    });
  });

  // ============================================
  // fetchMessages Tests
  // ============================================

  describe('fetchMessages', () => {
    it('fetches messages for a specific conversation', async () => {
      const mockMessages = [mockMessage];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockMessages,
              error: null,
            }),
          }),
        }),
      } as any);

      const store = useRentalConversationsStore.getState();

      await act(async () => {
        await store.fetchMessages('conv-1');
      });

      const state = useRentalConversationsStore.getState();
      expect(state.messages['conv-1']).toHaveLength(1);
      expect(state.messages['conv-1'][0].content).toBe('Hello, I am interested in your property');
    });

    it('handles message fetch errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Failed to fetch messages' },
            }),
          }),
        }),
      } as any);

      const store = useRentalConversationsStore.getState();

      await act(async () => {
        await store.fetchMessages('conv-1');
      });

      const state = useRentalConversationsStore.getState();
      expect(state.error).toBe('Failed to fetch messages');
    });

    it('queries rental_messages table with correct conversation_id', async () => {
      const eqMock = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: eqMock,
        }),
      } as any);

      const store = useRentalConversationsStore.getState();

      await act(async () => {
        await store.fetchMessages('conv-1');
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('landlord_messages');
      expect(eqMock).toHaveBeenCalledWith('conversation_id', 'conv-1');
    });
  });

  // ============================================
  // sendMessage Tests
  // ============================================

  describe('sendMessage', () => {
    it('sends a message and updates local state', async () => {
      const newMessage: Message = {
        ...mockMessage,
        id: 'msg-new',
        direction: 'outbound',
        content: 'Hello, yes the property is available!',
        sent_by: 'user',
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: newMessage,
              error: null,
            }),
          }),
        }),
      } as any);

      const store = useRentalConversationsStore.getState();

      let result: Message | null = null;
      await act(async () => {
        result = await store.sendMessage('conv-1', 'Hello, yes the property is available!');
      });

      expect(result).not.toBeNull();
      expect(result?.content).toBe('Hello, yes the property is available!');

      const state = useRentalConversationsStore.getState();
      expect(state.isSending).toBe(false);
      expect(state.messages['conv-1']).toContainEqual(expect.objectContaining({
        id: 'msg-new',
      }));
    });

    it('sets isSending while sending', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue(
              new Promise(() => {}) // Never resolves
            ),
          }),
        }),
      } as any);

      const store = useRentalConversationsStore.getState();

      act(() => {
        store.sendMessage('conv-1', 'Test message');
      });

      const stateWhileSending = useRentalConversationsStore.getState();
      expect(stateWhileSending.isSending).toBe(true);
    });

    it('handles send errors and returns null', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Failed to send message' },
            }),
          }),
        }),
      } as any);

      const store = useRentalConversationsStore.getState();

      let result: Message | null;
      await act(async () => {
        result = await store.sendMessage('conv-1', 'Test message');
      });

      expect(result!).toBeNull();
      const state = useRentalConversationsStore.getState();
      expect(state.error).toBe('Failed to send message');
    });
  });

  // ============================================
  // fetchPendingResponses Tests
  // ============================================

  describe('fetchPendingResponses', () => {
    it('fetches pending AI responses', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockPendingResponse],
              error: null,
            }),
          }),
        }),
      } as any);

      const store = useRentalConversationsStore.getState();

      await act(async () => {
        await store.fetchPendingResponses();
      });

      const state = useRentalConversationsStore.getState();
      expect(state.pendingResponses).toHaveLength(1);
      expect(state.pendingResponses[0].confidence).toBe(0.85);
    });

    it('queries rental_ai_queue with pending status filter', async () => {
      const eqMock = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: eqMock,
        }),
      } as any);

      const store = useRentalConversationsStore.getState();

      await act(async () => {
        await store.fetchPendingResponses();
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('rental_ai_queue');
      expect(eqMock).toHaveBeenCalledWith('status', 'pending');
    });
  });

  // ============================================
  // approveResponse Tests
  // ============================================

  describe('approveResponse', () => {
    beforeEach(() => {
      // Set up initial state with pending response
      useRentalConversationsStore.setState({
        pendingResponses: [mockPendingResponse],
        conversationsWithRelations: [mockConversationWithRelations],
      });
    });

    it('validates response exists before approving', async () => {
      const store = useRentalConversationsStore.getState();

      let result: boolean;
      await act(async () => {
        result = await store.approveResponse('non-existent-id', {
          editedResponse: undefined,
          editSeverity: 'none',
          responseTimeSeconds: 5,
        });
      });

      expect(result!).toBe(false);
      const state = useRentalConversationsStore.getState();
      expect(state.error).toBe('Response not found');
    });

    it('validates response not expired before approving', async () => {
      // Replace with expired response
      useRentalConversationsStore.setState({
        pendingResponses: [mockExpiredResponse],
      });

      const store = useRentalConversationsStore.getState();

      let result: boolean;
      await act(async () => {
        result = await store.approveResponse('queue-expired', {
          editedResponse: undefined,
          editSeverity: 'none',
          responseTimeSeconds: 5,
        });
      });

      expect(result!).toBe(false);
      const state = useRentalConversationsStore.getState();
      expect(state.error).toBe('Cannot approve: response has expired');
      // Expired response should be removed from state
      expect(state.pendingResponses).toHaveLength(0);
    });

    it('approves response and updates queue status', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'rental_ai_queue') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gt: jest.fn().mockReturnValue({
                  select: jest.fn().mockResolvedValue({
                    data: [{ id: 'queue-1' }],
                    count: 1,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'ai_response_outcomes') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      const store = useRentalConversationsStore.getState();

      let result: boolean;
      await act(async () => {
        result = await store.approveResponse('queue-1', {
          editedResponse: undefined,
          editSeverity: 'none',
          responseTimeSeconds: 10,
        });
      });

      expect(result!).toBe(true);
      const state = useRentalConversationsStore.getState();
      // Pending response should be removed
      expect(state.pendingResponses).toHaveLength(0);
    });

    it('handles edited responses with severity', async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gt: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: [{ id: 'queue-1' }],
              count: 1,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'rental_ai_queue') {
          return { update: updateMock } as any;
        }
        if (table === 'ai_response_outcomes') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      const store = useRentalConversationsStore.getState();
      const metadata: ApprovalMetadata = {
        editedResponse: 'I have edited this response significantly',
        editSeverity: 'major',
        responseTimeSeconds: 30,
      };

      await act(async () => {
        await store.approveResponse('queue-1', metadata);
      });

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'edited',
          final_response: 'I have edited this response significantly',
        })
      );
    });

    it('logs outcome for adaptive learning', async () => {
      const insertMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'rental_ai_queue') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gt: jest.fn().mockReturnValue({
                  select: jest.fn().mockResolvedValue({
                    data: [{ id: 'queue-1' }],
                    count: 1,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'ai_response_outcomes') {
          return { insert: insertMock } as any;
        }
        return {} as any;
      });

      const store = useRentalConversationsStore.getState();

      await act(async () => {
        await store.approveResponse('queue-1', {
          editedResponse: undefined,
          editSeverity: 'none',
          responseTimeSeconds: 15,
        });
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'approved',
          initial_confidence: 0.85,
          response_time_seconds: 15,
        })
      );
    });

    it('handles database error during approval', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'rental_ai_queue') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gt: jest.fn().mockReturnValue({
                  select: jest.fn().mockRejectedValue(new Error('Database error')),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const store = useRentalConversationsStore.getState();

      let result: boolean;
      await act(async () => {
        result = await store.approveResponse('queue-1', {
          editedResponse: undefined,
          editSeverity: 'none',
          responseTimeSeconds: 5,
        });
      });

      expect(result!).toBe(false);
      const state = useRentalConversationsStore.getState();
      expect(state.error).toBe('Database error');
    });
  });

  // ============================================
  // rejectResponse Tests
  // ============================================

  describe('rejectResponse', () => {
    beforeEach(() => {
      useRentalConversationsStore.setState({
        pendingResponses: [mockPendingResponse],
        conversationsWithRelations: [mockConversationWithRelations],
      });
    });

    it('rejects response and updates queue status', async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'rental_ai_queue') {
          return { update: updateMock } as any;
        }
        if (table === 'ai_response_outcomes') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      const store = useRentalConversationsStore.getState();

      let result: boolean;
      await act(async () => {
        result = await store.rejectResponse('queue-1', 20);
      });

      expect(result!).toBe(true);
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rejected',
        })
      );

      const state = useRentalConversationsStore.getState();
      expect(state.pendingResponses).toHaveLength(0);
    });

    it('logs rejection outcome for adaptive learning', async () => {
      const insertMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'rental_ai_queue') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: null,
              }),
            }),
          } as any;
        }
        if (table === 'ai_response_outcomes') {
          return { insert: insertMock } as any;
        }
        return {} as any;
      });

      const store = useRentalConversationsStore.getState();

      await act(async () => {
        await store.rejectResponse('queue-1', 25);
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'rejected',
          edit_severity: 'none',
          response_time_seconds: 25,
          final_response: null,
        })
      );
    });

    it('handles rejection errors', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'rental_ai_queue') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockRejectedValue(new Error('Rejection failed')),
            }),
          } as any;
        }
        return {} as any;
      });

      const store = useRentalConversationsStore.getState();

      let result: boolean;
      await act(async () => {
        result = await store.rejectResponse('queue-1', 10);
      });

      expect(result!).toBe(false);
      const state = useRentalConversationsStore.getState();
      expect(state.error).toBe('Rejection failed');
    });
  });

  // ============================================
  // toggleAI Tests
  // ============================================

  describe('toggleAI', () => {
    beforeEach(() => {
      useRentalConversationsStore.setState({
        conversations: [mockConversation],
        conversationsWithRelations: [mockConversationWithRelations],
      });
    });

    it('enables AI for a conversation', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      const store = useRentalConversationsStore.getState();

      let result: boolean;
      await act(async () => {
        result = await store.toggleAI('conv-1', true);
      });

      expect(result!).toBe(true);
      const state = useRentalConversationsStore.getState();
      expect(state.conversations[0].is_ai_enabled).toBe(true);
    });

    it('disables AI for a conversation', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      const store = useRentalConversationsStore.getState();

      await act(async () => {
        await store.toggleAI('conv-1', false);
      });

      const state = useRentalConversationsStore.getState();
      expect(state.conversations[0].is_ai_enabled).toBe(false);
      expect(state.conversationsWithRelations[0].is_ai_enabled).toBe(false);
    });
  });

  // ============================================
  // updateConversationStatus Tests
  // ============================================

  describe('updateConversationStatus', () => {
    beforeEach(() => {
      useRentalConversationsStore.setState({
        conversations: [mockConversation],
        conversationsWithRelations: [mockConversationWithRelations],
      });
    });

    it('updates conversation status', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      const store = useRentalConversationsStore.getState();

      let result: boolean;
      await act(async () => {
        result = await store.updateConversationStatus('conv-1', 'resolved');
      });

      expect(result!).toBe(true);
      const state = useRentalConversationsStore.getState();
      expect(state.conversations[0].status).toBe('resolved');
    });

    it('handles status update errors', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(new Error('Status update failed')),
        }),
      } as any);

      const store = useRentalConversationsStore.getState();

      let result: boolean;
      await act(async () => {
        result = await store.updateConversationStatus('conv-1', 'archived');
      });

      expect(result!).toBe(false);
      const state = useRentalConversationsStore.getState();
      expect(state.error).toBe('Status update failed');
    });
  });

  // ============================================
  // Filter Actions Tests
  // ============================================

  describe('Filter Actions', () => {
    it('sets status filter', () => {
      const store = useRentalConversationsStore.getState();

      act(() => {
        store.setStatusFilter('active');
      });

      const state = useRentalConversationsStore.getState();
      expect(state.statusFilter).toBe('active');
    });

    it('sets channel filter', () => {
      const store = useRentalConversationsStore.getState();

      act(() => {
        store.setChannelFilter('email');
      });

      const state = useRentalConversationsStore.getState();
      expect(state.channelFilter).toBe('email');
    });

    it('sets selectedConversationId', () => {
      const store = useRentalConversationsStore.getState();

      act(() => {
        store.setSelectedConversationId('conv-1');
      });

      const state = useRentalConversationsStore.getState();
      expect(state.selectedConversationId).toBe('conv-1');
    });
  });

  // ============================================
  // Utility Actions Tests
  // ============================================

  describe('Utility Actions', () => {
    it('clears error', () => {
      useRentalConversationsStore.setState({ error: 'Some error' });

      const store = useRentalConversationsStore.getState();

      act(() => {
        store.clearError();
      });

      const state = useRentalConversationsStore.getState();
      expect(state.error).toBeNull();
    });

    it('resets to initial state', () => {
      // Set some state
      useRentalConversationsStore.setState({
        conversations: [mockConversation],
        pendingResponses: [mockPendingResponse],
        error: 'Some error',
        isLoading: true,
      });

      const store = useRentalConversationsStore.getState();

      act(() => {
        store.reset();
      });

      const state = useRentalConversationsStore.getState();
      expect(state.conversations).toEqual([]);
      expect(state.pendingResponses).toEqual([]);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  // ============================================
  // Selectors Tests
  // ============================================

  describe('Selectors', () => {
    beforeEach(() => {
      useRentalConversationsStore.setState({
        conversations: [mockConversation],
        conversationsWithRelations: [mockConversationWithRelations],
        messages: { 'conv-1': [mockMessage] },
        pendingResponses: [mockPendingResponse],
      });
    });

    it('selectConversations returns conversations', () => {
      const state = useRentalConversationsStore.getState();
      const result = selectConversations(state);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('conv-1');
    });

    it('selectConversationsWithRelations returns conversations with relations', () => {
      const state = useRentalConversationsStore.getState();
      const result = selectConversationsWithRelations(state);
      expect(result).toHaveLength(1);
      expect(result[0].contact?.first_name).toBe('John');
    });

    it('selectMessages returns messages for a conversation', () => {
      const state = useRentalConversationsStore.getState();
      const result = selectMessages('conv-1')(state);
      expect(result).toHaveLength(1);
      expect(result[0].content).toContain('interested');
    });

    it('selectMessages returns empty array for unknown conversation', () => {
      const state = useRentalConversationsStore.getState();
      const result = selectMessages('unknown')(state);
      expect(result).toEqual([]);
    });

    it('selectPendingResponses returns pending responses', () => {
      const state = useRentalConversationsStore.getState();
      const result = selectPendingResponses(state);
      expect(result).toHaveLength(1);
      expect(result[0].confidence).toBe(0.85);
    });

    it('selectPendingCount returns count of pending responses', () => {
      const state = useRentalConversationsStore.getState();
      const result = selectPendingCount(state);
      expect(result).toBe(1);
    });

    it('selectNeedsReviewConversations returns conversations with pending responses', () => {
      const state = useRentalConversationsStore.getState();
      const result = selectNeedsReviewConversations(state);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('conv-1');
    });

    it('selectNeedsReviewConversations returns empty when no pending responses match', () => {
      useRentalConversationsStore.setState({
        pendingResponses: [{
          ...mockPendingResponse,
          conversation_id: 'other-conv', // Different conversation
        }],
      });

      const state = useRentalConversationsStore.getState();
      const result = selectNeedsReviewConversations(state);
      expect(result).toHaveLength(0);
    });
  });
});
