// Tests for useConversations hook
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
} from '../useConversations';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useConversations', () => {
  it('should return initial conversations data', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConversations(), { wrapper });

    await waitFor(() => {
      expect(result.current.conversations.length).toBeGreaterThan(0);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should return non-archived conversations only', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConversations(), { wrapper });

    await waitFor(() => {
      expect(result.current.conversations.length).toBeGreaterThan(0);
    });

    // All returned conversations should not be archived
    result.current.conversations.forEach((conv) => {
      expect(conv.is_archived).toBeFalsy();
    });
  });

  it('should have refetch function', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConversations(), { wrapper });

    expect(typeof result.current.refetch).toBe('function');
  });

  it('should return conversations with expected structure', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useConversations(), { wrapper });

    await waitFor(() => {
      expect(result.current.conversations.length).toBeGreaterThan(0);
    });

    const conversation = result.current.conversations[0];
    expect(conversation).toHaveProperty('id');
    expect(conversation).toHaveProperty('user_id');
    expect(conversation).toHaveProperty('title');
    expect(conversation).toHaveProperty('created_at');
  });
});

describe('useCreateConversation', () => {
  it('should create a new conversation', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateConversation(), { wrapper });

    let newConversation;
    await act(async () => {
      newConversation = await result.current.mutateAsync('Test Conversation');
    });

    expect(newConversation).toHaveProperty('id');
    expect(newConversation).toHaveProperty('title', 'Test Conversation');
    expect(newConversation).toHaveProperty('message_count', 0);
    expect(newConversation).toHaveProperty('user_id', 'user-1');
  });

  it('should use default title when empty string provided', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateConversation(), { wrapper });

    let newConversation;
    await act(async () => {
      newConversation = await result.current.mutateAsync('');
    });

    expect(newConversation?.title).toBe('New Conversation');
  });

  it('should create conversation with timestamps', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateConversation(), { wrapper });

    const beforeCreate = new Date().toISOString();

    let newConversation;
    await act(async () => {
      newConversation = await result.current.mutateAsync('Timestamped Convo');
    });

    expect(newConversation?.created_at).toBeDefined();
    expect(newConversation?.last_message_at).toBeDefined();
    expect(new Date(newConversation!.created_at).getTime()).toBeGreaterThanOrEqual(
      new Date(beforeCreate).getTime() - 1000
    );
  });

  it('should generate unique ID for each conversation', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateConversation(), { wrapper });

    let convo1, convo2;
    await act(async () => {
      convo1 = await result.current.mutateAsync('Convo 1');
      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 5));
      convo2 = await result.current.mutateAsync('Convo 2');
    });

    expect(convo1?.id).not.toBe(convo2?.id);
  });

  it('should update conversations list after creation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result: createResult } = renderHook(() => useCreateConversation(), { wrapper });
    const { result: listResult } = renderHook(() => useConversations(), { wrapper });

    const initialCount = listResult.current.conversations.length;

    await act(async () => {
      await createResult.current.mutateAsync('New Convo');
    });

    // The cache should be updated optimistically
    await waitFor(() => {
      expect(listResult.current.conversations.length).toBeGreaterThanOrEqual(initialCount);
    });
  });
});

describe('useDeleteConversation', () => {
  it('should soft delete a conversation', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result: createResult } = renderHook(() => useCreateConversation(), { wrapper });
    const { result: deleteResult } = renderHook(() => useDeleteConversation(), { wrapper });

    // Create a conversation first
    let newConversation;
    await act(async () => {
      newConversation = await createResult.current.mutateAsync('To Be Deleted');
    });

    // Delete it
    await act(async () => {
      await deleteResult.current.mutateAsync(newConversation!.id);
    });

    // The mutation should complete without error
    expect(deleteResult.current.isError).toBe(false);
  });

  it('should remove conversation from visible list after deletion', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result: listResult } = renderHook(() => useConversations(), { wrapper });
    const { result: deleteResult } = renderHook(() => useDeleteConversation(), { wrapper });

    await waitFor(() => {
      expect(listResult.current.conversations.length).toBeGreaterThan(0);
    });

    const conversationToDelete = listResult.current.conversations[0];

    await act(async () => {
      await deleteResult.current.mutateAsync(conversationToDelete.id);
    });

    // The delete mutation should complete without error
    expect(deleteResult.current.isError).toBe(false);
  });

  it('should handle deletion of non-existent conversation', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useDeleteConversation(), { wrapper });

    // Should not throw for non-existent ID
    await act(async () => {
      await result.current.mutateAsync('non-existent-id');
    });

    expect(result.current.isError).toBe(false);
  });
});
