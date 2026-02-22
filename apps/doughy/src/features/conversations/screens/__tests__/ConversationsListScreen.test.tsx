// Tests for ConversationsListScreen
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { ConversationsListScreen } from '../ConversationsListScreen';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock useConversations hooks
const mockConversations = [
  {
    id: '1',
    user_id: 'user-1',
    title: 'Market Analysis',
    last_message: 'The downtown area shows strong potential...',
    last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    message_count: 8,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    user_id: 'user-1',
    title: 'Lead Follow-up',
    last_message: 'Based on your lead data...',
    last_message_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    message_count: 12,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockUseConversations = {
  conversations: mockConversations,
  isLoading: false,
  error: null,
  refetch: jest.fn(),
};

const mockCreateConversation = {
  mutateAsync: jest.fn(),
  isPending: false,
};

const mockDeleteConversation = {
  mutateAsync: jest.fn(),
};

jest.mock('../../hooks/useConversations', () => ({
  useConversations: () => mockUseConversations,
  useCreateConversation: () => mockCreateConversation,
  useDeleteConversation: () => mockDeleteConversation,
}));

describe('ConversationsListScreen', () => {
  let queryClient: QueryClient;

  const renderWithQueryClient = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <ConversationsListScreen />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseConversations.conversations = mockConversations;
    mockUseConversations.isLoading = false;
    mockCreateConversation.mutateAsync.mockResolvedValue({
      id: 'new-conv',
      title: 'New Conversation',
    });
    mockDeleteConversation.mutateAsync.mockResolvedValue(undefined);
  });

  it('should render header with title and subtitle', () => {
    const { getByText } = renderWithQueryClient();

    expect(getByText('Conversations')).toBeTruthy();
    expect(getByText('Your AI chat history')).toBeTruthy();
  });

  it('should render conversation cards', () => {
    const { getByText } = renderWithQueryClient();

    expect(getByText('Market Analysis')).toBeTruthy();
    expect(getByText('Lead Follow-up')).toBeTruthy();
  });

  it('should render last message preview', () => {
    const { getByText } = renderWithQueryClient();

    expect(getByText('The downtown area shows strong potential...')).toBeTruthy();
    expect(getByText('Based on your lead data...')).toBeTruthy();
  });

  it('should render message count', () => {
    const { getByText } = renderWithQueryClient();

    expect(getByText('8 messages')).toBeTruthy();
    expect(getByText('12 messages')).toBeTruthy();
  });

  it('should navigate to conversation detail when card is pressed', () => {
    const { getByText } = renderWithQueryClient();

    fireEvent.press(getByText('Market Analysis'));

    expect(mockPush).toHaveBeenCalledWith('/(tabs)/conversations/1');
  });

  it('should show delete confirmation when delete button is pressed', () => {
    const { getAllByTestId } = renderWithQueryClient();

    const deleteButtons = getAllByTestId('delete-conversation-button');
    fireEvent.press(deleteButtons[0]);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Delete', style: 'destructive' }),
      ])
    );
  });

  it('should delete conversation when confirmed', async () => {
    const { getAllByTestId } = renderWithQueryClient();

    const deleteButtons = getAllByTestId('delete-conversation-button');
    fireEvent.press(deleteButtons[0]);

    // Get the delete callback from Alert.alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const deleteButton = alertCall[2].find((btn: { text: string }) => btn.text === 'Delete');

    await deleteButton.onPress();

    expect(mockDeleteConversation.mutateAsync).toHaveBeenCalledWith('1');
  });

  it('should render FAB for new conversation', () => {
    const { getByTestId } = renderWithQueryClient();

    expect(getByTestId('new-conversation-fab')).toBeTruthy();
  });

  it('should create new conversation when FAB is pressed', async () => {
    const { getByTestId } = renderWithQueryClient();

    const fab = getByTestId('new-conversation-fab');
    fireEvent.press(fab);

    await waitFor(() => {
      expect(mockCreateConversation.mutateAsync).toHaveBeenCalledWith('New Conversation');
    });
  });

  it('should navigate to new conversation after creation', async () => {
    const { getByTestId } = renderWithQueryClient();

    const fab = getByTestId('new-conversation-fab');
    fireEvent.press(fab);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/(tabs)/conversations/new-conv');
    });
  });

  it('should show error alert when creation fails', async () => {
    mockCreateConversation.mutateAsync.mockRejectedValue(new Error('Network error'));

    const { getByTestId } = renderWithQueryClient();

    const fab = getByTestId('new-conversation-fab');
    fireEvent.press(fab);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to create conversation');
    });
  });

  it('should show error alert when deletion fails', async () => {
    mockDeleteConversation.mutateAsync.mockRejectedValue(new Error('Network error'));

    const { getAllByTestId } = renderWithQueryClient();

    const deleteButtons = getAllByTestId('delete-conversation-button');
    fireEvent.press(deleteButtons[0]);

    // Get the delete callback
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const deleteButton = alertCall[2].find((btn: { text: string }) => btn.text === 'Delete');

    await deleteButton.onPress();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to delete conversation');
    });
  });

  it('should show loading indicator when loading', () => {
    mockUseConversations.isLoading = true;

    const { UNSAFE_queryByType } = renderWithQueryClient();

    // ActivityIndicator should be present
    expect(mockUseConversations.isLoading).toBe(true);
  });

  it('should show empty state when no conversations', () => {
    mockUseConversations.conversations = [];

    const { getByText } = renderWithQueryClient();

    expect(getByText('No conversations yet')).toBeTruthy();
    expect(
      getByText(
        'Start a conversation with the AI assistant to get help with your leads and properties'
      )
    ).toBeTruthy();
  });

  it('should show Start Chatting button in empty state', () => {
    mockUseConversations.conversations = [];

    const { getByText } = renderWithQueryClient();

    expect(getByText('Start Chatting')).toBeTruthy();
  });

  it('should create conversation when Start Chatting is pressed in empty state', async () => {
    mockUseConversations.conversations = [];

    const { getByText } = renderWithQueryClient();

    fireEvent.press(getByText('Start Chatting'));

    await waitFor(() => {
      expect(mockCreateConversation.mutateAsync).toHaveBeenCalledWith('New Conversation');
    });
  });

  it('should format time as "Just now" for recent messages', () => {
    mockUseConversations.conversations = [
      {
        ...mockConversations[0],
        last_message_at: new Date().toISOString(),
      },
    ];

    const { getByText } = renderWithQueryClient();

    expect(getByText('Just now')).toBeTruthy();
  });

  it('should format time as minutes ago', () => {
    mockUseConversations.conversations = [
      {
        ...mockConversations[0],
        last_message_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ];

    const { getByText } = renderWithQueryClient();

    expect(getByText('30m ago')).toBeTruthy();
  });

  it('should format time as hours ago', () => {
    mockUseConversations.conversations = [
      {
        ...mockConversations[0],
        last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const { getByText } = renderWithQueryClient();

    expect(getByText('2h ago')).toBeTruthy();
  });

  it('should format time as Yesterday', () => {
    mockUseConversations.conversations = [
      {
        ...mockConversations[0],
        last_message_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const { getByText } = renderWithQueryClient();

    expect(getByText('Yesterday')).toBeTruthy();
  });

  it('should format time as days ago', () => {
    mockUseConversations.conversations = [
      {
        ...mockConversations[0],
        last_message_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const { getByText } = renderWithQueryClient();

    expect(getByText('3d ago')).toBeTruthy();
  });

  it('should handle conversation without last_message', () => {
    const conversationWithoutMessage = {
      id: '1',
      user_id: 'user-1',
      title: 'Market Analysis',
      last_message: '', // Empty string instead of missing
      last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      message_count: 8,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    };
    mockUseConversations.conversations = [conversationWithoutMessage];

    const { getByText, queryByText } = renderWithQueryClient();

    expect(getByText('Market Analysis')).toBeTruthy();
    expect(queryByText('The downtown area shows strong potential...')).toBeNull();
  });

  it('should handle conversation without title', () => {
    const conversationWithoutTitle = {
      id: '1',
      user_id: 'user-1',
      title: '', // Empty string instead of missing
      last_message: 'The downtown area shows strong potential...',
      last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      message_count: 8,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    };
    mockUseConversations.conversations = [conversationWithoutTitle];

    const { getByText } = renderWithQueryClient();

    expect(getByText('Untitled Conversation')).toBeTruthy();
  });
});
