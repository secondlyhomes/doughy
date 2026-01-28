// src/features/rental-inbox/__tests__/hooks/useInbox.test.tsx
// Comprehensive tests for inbox hooks

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useInbox, useFilteredInbox, useConversation } from '../../hooks/useInbox';
import { useRentalConversationsStore } from '@/stores/rental-conversations-store';
import type {
  ConversationWithRelations,
  AIResponseQueueItem,
  Message,
} from '@/stores/rental-conversations-store';

// Mock the store
jest.mock('@/stores/rental-conversations-store');

const mockUseRentalConversationsStore = useRentalConversationsStore as jest.MockedFunction<
  typeof useRentalConversationsStore
>;

describe('Inbox Hooks', () => {
  // ============================================
  // Mock Data
  // ============================================

  const createMockConversation = (
    id: string,
    overrides?: Partial<ConversationWithRelations>
  ): ConversationWithRelations => ({
    id,
    user_id: 'user-1',
    contact_id: `contact-${id}`,
    property_id: `property-${id}`,
    booking_id: null,
    channel: 'email',
    platform: 'gmail',
    external_thread_id: `thread-${id}`,
    status: 'active',
    ai_enabled: true,
    ai_auto_respond: false,
    ai_confidence_threshold: 85,
    ai_personality: null,
    subject: null,
    message_count: 5,
    unread_count: 0,
    last_message_at: new Date().toISOString(),
    last_message_preview: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    contact: {
      id: `contact-${id}`,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
      contact_types: ['lead'],
    },
    property: {
      id: `property-${id}`,
      name: 'Beach House',
      address: '123 Ocean Ave',
    },
    lastMessage: null,
    pendingResponse: null,
    ...overrides,
  });

  const createMockPendingResponse = (
    id: string,
    conversationId: string
  ): AIResponseQueueItem => ({
    id,
    user_id: 'user-1',
    conversation_id: conversationId,
    trigger_message_id: 'msg-1',
    sent_message_id: null,
    suggested_response: 'Thank you for your interest!',
    confidence: 0.85,
    reasoning: 'FAQ response',
    intent: 'inquiry',
    detected_topics: ['availability'],
    alternatives: [],
    status: 'pending',
    final_response: null,
    reviewed_at: null,
    reviewed_by: null,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  });

  const createMockMessage = (id: string, conversationId: string): Message => ({
    id,
    conversation_id: conversationId,
    direction: 'inbound',
    content: 'Hello, I am interested in your property',
    content_type: 'text',
    sent_by: 'contact',
    ai_confidence: null,
    ai_model: null,
    ai_prompt_tokens: null,
    ai_completion_tokens: null,
    requires_approval: false,
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
  });

  // Default mock store state
  const defaultMockState = {
    conversationsWithRelations: [] as ConversationWithRelations[],
    conversations: [],
    messages: {} as Record<string, Message[]>,
    pendingResponses: [] as AIResponseQueueItem[],
    selectedConversationId: null,
    statusFilter: 'all' as const,
    channelFilter: 'all' as const,
    isLoading: false,
    isRefreshing: false,
    isSending: false,
    error: null,
    fetchConversations: jest.fn().mockResolvedValue(undefined),
    fetchConversationById: jest.fn().mockResolvedValue(null),
    fetchConversationsWithPending: jest.fn().mockResolvedValue(undefined),
    fetchPendingResponses: jest.fn().mockResolvedValue(undefined),
    fetchMessages: jest.fn().mockResolvedValue(undefined),
    sendMessage: jest.fn().mockResolvedValue(null),
    approveResponse: jest.fn().mockResolvedValue(true),
    rejectResponse: jest.fn().mockResolvedValue(true),
    toggleAI: jest.fn().mockResolvedValue(true),
    updateConversationStatus: jest.fn().mockResolvedValue(true),
    setSelectedConversationId: jest.fn(),
    setStatusFilter: jest.fn(),
    setChannelFilter: jest.fn(),
    clearError: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRentalConversationsStore.mockImplementation(() => ({
      ...defaultMockState,
    }));
  });

  // ============================================
  // useInbox Tests
  // ============================================

  describe('useInbox', () => {
    it('fetches conversations and pending responses on mount', async () => {
      const fetchConversations = jest.fn().mockResolvedValue(undefined);
      const fetchPendingResponses = jest.fn().mockResolvedValue(undefined);

      mockUseRentalConversationsStore.mockImplementation(() => ({
        ...defaultMockState,
        fetchConversations,
        fetchPendingResponses,
      }));

      renderHook(() => useInbox());

      await waitFor(() => {
        expect(fetchConversations).toHaveBeenCalled();
        expect(fetchPendingResponses).toHaveBeenCalled();
      });
    });

    it('returns conversations from store', () => {
      const mockConversations = [
        createMockConversation('conv-1'),
        createMockConversation('conv-2'),
      ];

      mockUseRentalConversationsStore.mockImplementation(() => ({
        ...defaultMockState,
        conversationsWithRelations: mockConversations,
      }));

      const { result } = renderHook(() => useInbox());

      expect(result.current.conversations).toHaveLength(2);
      expect(result.current.conversations[0].id).toBe('conv-1');
    });

    it('returns pendingCount from pendingResponses', () => {
      const mockPendingResponses = [
        createMockPendingResponse('queue-1', 'conv-1'),
        createMockPendingResponse('queue-2', 'conv-2'),
        createMockPendingResponse('queue-3', 'conv-3'),
      ];

      mockUseRentalConversationsStore.mockImplementation(() => ({
        ...defaultMockState,
        pendingResponses: mockPendingResponses,
      }));

      const { result } = renderHook(() => useInbox());

      expect(result.current.pendingCount).toBe(3);
    });

    it('returns conversationsNeedingReview correctly', () => {
      const mockConversations = [
        createMockConversation('conv-1'),
        createMockConversation('conv-2'),
        createMockConversation('conv-3'),
      ];

      const mockPendingResponses = [
        createMockPendingResponse('queue-1', 'conv-1'),
        createMockPendingResponse('queue-2', 'conv-3'),
      ];

      mockUseRentalConversationsStore.mockImplementation(() => ({
        ...defaultMockState,
        conversationsWithRelations: mockConversations,
        pendingResponses: mockPendingResponses,
      }));

      const { result } = renderHook(() => useInbox());

      expect(result.current.conversationsNeedingReview).toHaveLength(2);
      expect(result.current.conversationsNeedingReview.map((c) => c.id)).toEqual([
        'conv-1',
        'conv-3',
      ]);
    });

    it('returns loading states', () => {
      mockUseRentalConversationsStore.mockImplementation(() => ({
        ...defaultMockState,
        isLoading: true,
        isRefreshing: false,
      }));

      const { result } = renderHook(() => useInbox());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isRefreshing).toBe(false);
    });

    it('returns error from store', () => {
      mockUseRentalConversationsStore.mockImplementation(() => ({
        ...defaultMockState,
        error: 'Failed to fetch',
      }));

      const { result } = renderHook(() => useInbox());

      expect(result.current.error).toBe('Failed to fetch');
    });

    describe('refresh', () => {
      it('calls both fetch functions', async () => {
        const fetchConversations = jest.fn().mockResolvedValue(undefined);
        const fetchPendingResponses = jest.fn().mockResolvedValue(undefined);

        mockUseRentalConversationsStore.mockImplementation(() => ({
          ...defaultMockState,
          fetchConversations,
          fetchPendingResponses,
        }));

        const { result } = renderHook(() => useInbox());

        await act(async () => {
          await result.current.refresh();
        });

        // Called twice: once on mount, once on refresh
        expect(fetchConversations).toHaveBeenCalledTimes(2);
        expect(fetchPendingResponses).toHaveBeenCalledTimes(2);
      });
    });

    describe('quickApprove', () => {
      it('calls approveResponse with default metadata', async () => {
        const approveResponse = jest.fn().mockResolvedValue(true);

        mockUseRentalConversationsStore.mockImplementation(() => ({
          ...defaultMockState,
          approveResponse,
        }));

        const { result } = renderHook(() => useInbox());

        let success: boolean;
        await act(async () => {
          success = await result.current.quickApprove('queue-1');
        });

        expect(success!).toBe(true);
        expect(approveResponse).toHaveBeenCalledWith('queue-1', {
          editedResponse: undefined,
          editSeverity: 'none',
          responseTimeSeconds: 0,
        });
      });
    });

    describe('clearError', () => {
      it('calls store clearError', () => {
        const clearError = jest.fn();

        mockUseRentalConversationsStore.mockImplementation(() => ({
          ...defaultMockState,
          clearError,
        }));

        const { result } = renderHook(() => useInbox());

        act(() => {
          result.current.clearError();
        });

        expect(clearError).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // useFilteredInbox Tests
  // ============================================

  describe('useFilteredInbox', () => {
    const setupFilteredInbox = (
      conversations: ConversationWithRelations[],
      pendingResponses: AIResponseQueueItem[] = []
    ) => {
      mockUseRentalConversationsStore.mockImplementation(() => ({
        ...defaultMockState,
        conversationsWithRelations: conversations,
        pendingResponses,
      }));
    };

    describe('filter by status', () => {
      it('returns all non-archived by default', () => {
        const conversations = [
          createMockConversation('conv-1', { status: 'active' }),
          createMockConversation('conv-2', { status: 'resolved' }),
          createMockConversation('conv-3', { status: 'archived' }),
        ];

        setupFilteredInbox(conversations);

        const { result } = renderHook(() => useFilteredInbox('all', 'recent', ''));

        expect(result.current).toHaveLength(2);
        expect(result.current.map((c) => c.id)).toEqual(['conv-1', 'conv-2']);
      });

      it('filters by needs_review', () => {
        const conversations = [
          createMockConversation('conv-1'),
          createMockConversation('conv-2'),
          createMockConversation('conv-3'),
        ];

        const pendingResponses = [createMockPendingResponse('queue-1', 'conv-2')];

        setupFilteredInbox(conversations, pendingResponses);

        const { result } = renderHook(() =>
          useFilteredInbox('needs_review', 'recent', '')
        );

        expect(result.current).toHaveLength(1);
        expect(result.current[0].id).toBe('conv-2');
      });

      it('filters by archived', () => {
        const conversations = [
          createMockConversation('conv-1', { status: 'active' }),
          createMockConversation('conv-2', { status: 'archived' }),
        ];

        setupFilteredInbox(conversations);

        const { result } = renderHook(() =>
          useFilteredInbox('archived', 'recent', '')
        );

        expect(result.current).toHaveLength(1);
        expect(result.current[0].id).toBe('conv-2');
      });
    });

    describe('search filter', () => {
      it('filters by contact name', () => {
        const conversations = [
          createMockConversation('conv-1', {
            contact: {
              id: 'c1',
              first_name: 'Alice',
              last_name: 'Smith',
              email: 'alice@example.com',
              phone: null,
              contact_types: ['lead'],
            },
          }),
          createMockConversation('conv-2', {
            contact: {
              id: 'c2',
              first_name: 'Bob',
              last_name: 'Jones',
              email: 'bob@example.com',
              phone: null,
              contact_types: ['lead'],
            },
          }),
        ];

        setupFilteredInbox(conversations);

        const { result } = renderHook(() =>
          useFilteredInbox('all', 'recent', 'alice')
        );

        expect(result.current).toHaveLength(1);
        expect(result.current[0].contact?.first_name).toBe('Alice');
      });

      it('filters by contact email', () => {
        const conversations = [
          createMockConversation('conv-1', {
            contact: {
              id: 'c1',
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@company.com',
              phone: null,
              contact_types: ['lead'],
            },
          }),
          createMockConversation('conv-2', {
            contact: {
              id: 'c2',
              first_name: 'Jane',
              last_name: 'Doe',
              email: 'jane@different.com',
              phone: null,
              contact_types: ['lead'],
            },
          }),
        ];

        setupFilteredInbox(conversations);

        const { result } = renderHook(() =>
          useFilteredInbox('all', 'recent', 'company.com')
        );

        expect(result.current).toHaveLength(1);
        expect(result.current[0].contact?.email).toBe('john@company.com');
      });

      it('filters by property name', () => {
        const conversations = [
          createMockConversation('conv-1', {
            property: { id: 'p1', name: 'Beach House', address: '123 Main St' },
          }),
          createMockConversation('conv-2', {
            property: { id: 'p2', name: 'Mountain Cabin', address: '456 Oak Ave' },
          }),
        ];

        setupFilteredInbox(conversations);

        const { result } = renderHook(() =>
          useFilteredInbox('all', 'recent', 'beach')
        );

        expect(result.current).toHaveLength(1);
        expect(result.current[0].property?.name).toBe('Beach House');
      });

      it('filters by property address', () => {
        const conversations = [
          createMockConversation('conv-1', {
            property: { id: 'p1', name: 'House A', address: '123 Ocean Blvd' },
          }),
          createMockConversation('conv-2', {
            property: { id: 'p2', name: 'House B', address: '456 Mountain Rd' },
          }),
        ];

        setupFilteredInbox(conversations);

        const { result } = renderHook(() =>
          useFilteredInbox('all', 'recent', 'ocean')
        );

        expect(result.current).toHaveLength(1);
        expect(result.current[0].property?.address).toBe('123 Ocean Blvd');
      });

      it('search is case insensitive', () => {
        const conversations = [
          createMockConversation('conv-1', {
            contact: {
              id: 'c1',
              first_name: 'JOHN',
              last_name: 'DOE',
              email: null,
              phone: null,
              contact_types: [],
            },
          }),
        ];

        setupFilteredInbox(conversations);

        const { result } = renderHook(() =>
          useFilteredInbox('all', 'recent', 'john')
        );

        expect(result.current).toHaveLength(1);
      });
    });

    describe('sorting', () => {
      it('sorts by recent (newest first) by default', () => {
        const now = Date.now();
        const conversations = [
          createMockConversation('conv-1', {
            last_message_at: new Date(now - 3600000).toISOString(), // 1 hour ago
          }),
          createMockConversation('conv-2', {
            last_message_at: new Date(now).toISOString(), // Now
          }),
          createMockConversation('conv-3', {
            last_message_at: new Date(now - 7200000).toISOString(), // 2 hours ago
          }),
        ];

        setupFilteredInbox(conversations);

        const { result } = renderHook(() =>
          useFilteredInbox('all', 'recent', '')
        );

        expect(result.current.map((c) => c.id)).toEqual([
          'conv-2',
          'conv-1',
          'conv-3',
        ]);
      });

      it('sorts by oldest first', () => {
        const now = Date.now();
        const conversations = [
          createMockConversation('conv-1', {
            last_message_at: new Date(now - 3600000).toISOString(),
          }),
          createMockConversation('conv-2', {
            last_message_at: new Date(now).toISOString(),
          }),
          createMockConversation('conv-3', {
            last_message_at: new Date(now - 7200000).toISOString(),
          }),
        ];

        setupFilteredInbox(conversations);

        const { result } = renderHook(() =>
          useFilteredInbox('all', 'oldest', '')
        );

        expect(result.current.map((c) => c.id)).toEqual([
          'conv-3',
          'conv-1',
          'conv-2',
        ]);
      });

      it('sorts by pending_first (pending conversations first, then by recent)', () => {
        const now = Date.now();
        const conversations = [
          createMockConversation('conv-1', {
            last_message_at: new Date(now).toISOString(),
          }),
          createMockConversation('conv-2', {
            last_message_at: new Date(now - 1000).toISOString(),
          }),
          createMockConversation('conv-3', {
            last_message_at: new Date(now - 2000).toISOString(),
          }),
        ];

        // Only conv-2 has a pending response
        const pendingResponses = [createMockPendingResponse('queue-1', 'conv-2')];

        setupFilteredInbox(conversations, pendingResponses);

        const { result } = renderHook(() =>
          useFilteredInbox('all', 'pending_first', '')
        );

        // conv-2 should be first (has pending), then others by recency
        expect(result.current[0].id).toBe('conv-2');
      });
    });

    describe('hasPendingResponse flag', () => {
      it('adds hasPendingResponse flag to conversations', () => {
        const conversations = [
          createMockConversation('conv-1'),
          createMockConversation('conv-2'),
        ];

        const pendingResponses = [createMockPendingResponse('queue-1', 'conv-1')];

        setupFilteredInbox(conversations, pendingResponses);

        const { result } = renderHook(() =>
          useFilteredInbox('all', 'recent', '')
        );

        const conv1 = result.current.find((c) => c.id === 'conv-1');
        const conv2 = result.current.find((c) => c.id === 'conv-2');

        expect(conv1?.hasPendingResponse).toBe(true);
        expect(conv2?.hasPendingResponse).toBe(false);
      });
    });
  });

  // ============================================
  // useConversation Tests
  // ============================================

  describe('useConversation', () => {
    it('returns conversation by id', () => {
      const mockConversation = createMockConversation('conv-1');

      mockUseRentalConversationsStore.mockImplementation(() => ({
        ...defaultMockState,
        conversationsWithRelations: [mockConversation],
      }));

      const { result } = renderHook(() => useConversation('conv-1'));

      expect(result.current.conversation?.id).toBe('conv-1');
    });

    it('returns undefined for unknown conversation', () => {
      mockUseRentalConversationsStore.mockImplementation(() => ({
        ...defaultMockState,
        conversationsWithRelations: [createMockConversation('conv-1')],
      }));

      const { result } = renderHook(() => useConversation('unknown'));

      expect(result.current.conversation).toBeUndefined();
    });

    it('returns messages for conversation', () => {
      const mockMessages = [
        createMockMessage('msg-1', 'conv-1'),
        createMockMessage('msg-2', 'conv-1'),
      ];

      mockUseRentalConversationsStore.mockImplementation(() => ({
        ...defaultMockState,
        conversationsWithRelations: [createMockConversation('conv-1')],
        messages: { 'conv-1': mockMessages },
      }));

      const { result } = renderHook(() => useConversation('conv-1'));

      expect(result.current.messages).toHaveLength(2);
    });

    it('returns empty array when no messages', () => {
      mockUseRentalConversationsStore.mockImplementation(() => ({
        ...defaultMockState,
        conversationsWithRelations: [createMockConversation('conv-1')],
        messages: {},
      }));

      const { result } = renderHook(() => useConversation('conv-1'));

      expect(result.current.messages).toEqual([]);
    });

    it('returns pending response for conversation', () => {
      const pendingResponse = createMockPendingResponse('queue-1', 'conv-1');

      mockUseRentalConversationsStore.mockImplementation(() => ({
        ...defaultMockState,
        conversationsWithRelations: [createMockConversation('conv-1')],
        pendingResponses: [pendingResponse],
      }));

      const { result } = renderHook(() => useConversation('conv-1'));

      expect(result.current.pendingResponse?.id).toBe('queue-1');
    });

    it('fetches conversation and messages on mount', async () => {
      const fetchConversationById = jest.fn().mockResolvedValue(null);
      const fetchMessages = jest.fn().mockResolvedValue(undefined);

      mockUseRentalConversationsStore.mockImplementation(() => ({
        ...defaultMockState,
        fetchConversationById,
        fetchMessages,
      }));

      renderHook(() => useConversation('conv-1'));

      await waitFor(() => {
        expect(fetchConversationById).toHaveBeenCalledWith('conv-1');
        expect(fetchMessages).toHaveBeenCalledWith('conv-1');
      });
    });

    describe('send', () => {
      it('sends message to conversation', async () => {
        const sendMessage = jest.fn().mockResolvedValue({
          id: 'new-msg',
          content: 'Hello!',
        });

        mockUseRentalConversationsStore.mockImplementation(() => ({
          ...defaultMockState,
          conversationsWithRelations: [createMockConversation('conv-1')],
          sendMessage,
        }));

        const { result } = renderHook(() => useConversation('conv-1'));

        await act(async () => {
          await result.current.send('Hello!');
        });

        expect(sendMessage).toHaveBeenCalledWith('conv-1', 'Hello!');
      });
    });

    describe('approve', () => {
      it('approves pending response with metadata', async () => {
        const approveResponse = jest.fn().mockResolvedValue(true);
        const pendingResponse = createMockPendingResponse('queue-1', 'conv-1');

        mockUseRentalConversationsStore.mockImplementation(() => ({
          ...defaultMockState,
          conversationsWithRelations: [createMockConversation('conv-1')],
          pendingResponses: [pendingResponse],
          approveResponse,
        }));

        const { result } = renderHook(() => useConversation('conv-1'));

        await act(async () => {
          await result.current.approve({
            editedResponse: undefined,
            editSeverity: 'none',
            responseTimeSeconds: 5,
          });
        });

        expect(approveResponse).toHaveBeenCalledWith('queue-1', {
          editedResponse: undefined,
          editSeverity: 'none',
          responseTimeSeconds: 5,
        });
      });

      it('returns false when no pending response', async () => {
        mockUseRentalConversationsStore.mockImplementation(() => ({
          ...defaultMockState,
          conversationsWithRelations: [createMockConversation('conv-1')],
          pendingResponses: [], // No pending responses
        }));

        const { result } = renderHook(() => useConversation('conv-1'));

        let success: boolean;
        await act(async () => {
          success = await result.current.approve({
            editedResponse: undefined,
            editSeverity: 'none',
            responseTimeSeconds: 5,
          });
        });

        expect(success!).toBe(false);
      });
    });

    describe('reject', () => {
      it('rejects pending response', async () => {
        const rejectResponse = jest.fn().mockResolvedValue(true);
        const pendingResponse = createMockPendingResponse('queue-1', 'conv-1');

        mockUseRentalConversationsStore.mockImplementation(() => ({
          ...defaultMockState,
          conversationsWithRelations: [createMockConversation('conv-1')],
          pendingResponses: [pendingResponse],
          rejectResponse,
        }));

        const { result } = renderHook(() => useConversation('conv-1'));

        await act(async () => {
          await result.current.reject(10);
        });

        expect(rejectResponse).toHaveBeenCalledWith('queue-1', 10);
      });
    });

    describe('setAIEnabled', () => {
      it('toggles AI for conversation', async () => {
        const toggleAI = jest.fn().mockResolvedValue(true);

        mockUseRentalConversationsStore.mockImplementation(() => ({
          ...defaultMockState,
          conversationsWithRelations: [createMockConversation('conv-1')],
          toggleAI,
        }));

        const { result } = renderHook(() => useConversation('conv-1'));

        await act(async () => {
          await result.current.setAIEnabled(false);
        });

        expect(toggleAI).toHaveBeenCalledWith('conv-1', false);
      });
    });
  });
});
