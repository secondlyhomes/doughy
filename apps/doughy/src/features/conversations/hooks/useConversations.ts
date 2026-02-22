// useConversations Hook - React Native
// Zone D: Conversations list management
// Note: Uses mock data until conversations table is added to Supabase

import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { Conversation } from '../types';

// Mock data for development - will be replaced with real API calls
// when conversations table is added to Supabase
const INITIAL_MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    user_id: 'user-1',
    title: 'Market Analysis for Downtown Properties',
    last_message: 'The downtown area shows strong appreciation potential...',
    last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    message_count: 8,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    user_id: 'user-1',
    title: 'Lead Follow-up Strategy',
    last_message: 'Based on your lead data, I recommend prioritizing...',
    last_message_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    message_count: 12,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    user_id: 'user-1',
    title: 'Property Comparison: Oak Street vs Maple Ave',
    last_message: 'After comparing both properties, the Oak Street property offers...',
    last_message_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    message_count: 6,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    user_id: 'user-1',
    title: 'Investment ROI Calculator',
    last_message: 'For this property, the estimated ROI over 5 years would be...',
    last_message_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    message_count: 4,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const CONVERSATIONS_QUERY_KEY = ['conversations'];

// Helper to get current conversations from cache or initial data
function getConversationsFromCache(queryClient: QueryClient): Conversation[] {
  return queryClient.getQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY) ?? INITIAL_MOCK_CONVERSATIONS;
}

async function fetchConversations(queryClient: QueryClient): Promise<Conversation[]> {
  // TODO: Replace with real Supabase query when conversations table exists
  // const { data, error } = await supabase.from('conversations').select('*')
  const conversations = getConversationsFromCache(queryClient);
  return conversations.filter(c => !c.is_archived);
}

export function useConversations() {
  const queryClient = useQueryClient();

  const {
    data: conversations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: () => fetchConversations(queryClient),
    initialData: INITIAL_MOCK_CONVERSATIONS.filter(c => !c.is_archived),
  });

  return {
    conversations,
    isLoading,
    error,
    refetch,
  };
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string): Promise<Conversation> => {
      // TODO: Replace with real Supabase insert when conversations table exists
      const newConversation: Conversation = {
        id: `conv-${Date.now()}`,
        user_id: 'user-1',
        title: title || 'New Conversation',
        message_count: 0,
        created_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      };

      // Update cache optimistically
      queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (old = []) => [
        newConversation,
        ...old,
      ]);

      return newConversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // TODO: Replace with real Supabase soft delete when conversations table exists
      // Update cache optimistically
      queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (old = []) =>
        old.map(c => (c.id === id ? { ...c, is_archived: true } : c))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
  });
}

export default useConversations;
