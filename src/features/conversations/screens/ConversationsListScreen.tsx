// Conversations List Screen - React Native
// Zone D: List of AI chat conversations
// Uses useThemeColors() for reliable dark mode support

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import { ScreenHeader, LoadingSpinner, SimpleFAB, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useRouter } from 'expo-router';
import {
  MessageCircle,
  Trash2,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';

import { useConversations, useCreateConversation, useDeleteConversation } from '../hooks/useConversations';
import { Conversation } from '../types';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

function formatTimeAgo(dateString: string | undefined): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

interface ConversationCardProps {
  conversation: Conversation;
  onPress: () => void;
  onDelete: () => void;
}

const ConversationCard = React.memo(function ConversationCard({ conversation, onPress, onDelete }: ConversationCardProps) {
  const colors = useThemeColors();
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  }, [onDelete]);

  return (
    <TouchableOpacity
      className="rounded-xl p-4 mb-3"
      style={{ backgroundColor: colors.card }}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`Conversation: ${conversation.title || 'Untitled'}, ${conversation.message_count} messages`}
      accessibilityRole="button"
      accessibilityHint="Opens conversation"
    >
      <View className="flex-row items-start">
        <View className="rounded-full p-2 mr-3" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
          <MessageCircle size={20} color={colors.info} />
        </View>

        <View className="flex-1">
          <Text className="text-base font-semibold mb-1" style={{ color: colors.foreground }} numberOfLines={1}>
            {conversation.title || 'Untitled Conversation'}
          </Text>

          {conversation.last_message && (
            <Text className="text-sm mb-2" style={{ color: colors.mutedForeground }} numberOfLines={2}>
              {conversation.last_message}
            </Text>
          )}

          <View className="flex-row items-center">
            <Clock size={12} color={colors.mutedForeground} />
            <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>
              {formatTimeAgo(conversation.last_message_at)}
            </Text>
            <View className="mx-2 w-1 h-1 rounded-full" style={{ backgroundColor: colors.mutedForeground }} />
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              {conversation.message_count} messages
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <TouchableOpacity
            testID="delete-conversation-button"
            className="p-2"
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={`Delete conversation: ${conversation.title || 'Untitled'}`}
            accessibilityRole="button"
          >
            <Trash2 size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <ChevronRight size={18} color={colors.mutedForeground} accessibilityElementsHidden />
        </View>
      </View>
    </TouchableOpacity>
  );
});

export function ConversationsListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { conversations, isLoading, refetch } = useConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleNewConversation = async () => {
    // Cancel previous operation if still ongoing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const newConversation = await createConversation.mutateAsync('New Conversation');
      // Only navigate if not aborted
      if (!abortControllerRef.current.signal.aborted) {
        router.push(`/(tabs)/conversations/${newConversation.id}`);
      }
    } catch (error) {
      // Don't show error if operation was aborted
      if (!abortControllerRef.current.signal.aborted) {
        Alert.alert('Error', 'Failed to create conversation');
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleConversationPress = useCallback((conversation: Conversation) => {
    router.push(`/(tabs)/conversations/${conversation.id}`);
  }, [router]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    const controller = new AbortController();

    try {
      await deleteConversation.mutateAsync(id);
    } catch (error) {
      // Don't show error if operation was aborted
      if (!controller.signal.aborted) {
        Alert.alert('Error', 'Failed to delete conversation');
      }
    }
  }, [deleteConversation]);

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <ConversationCard
        conversation={item}
        onPress={() => handleConversationPress(item)}
        onDelete={() => handleDeleteConversation(item.id)}
      />
    ),
    [handleConversationPress, handleDeleteConversation]
  );

  const keyExtractor = useCallback((item: Conversation) => item.id, []);

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <ScreenHeader title="Conversations" subtitle="Your AI chat history" />

      {isLoading ? (
        <LoadingSpinner fullScreen color={colors.info} />
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SAFE_PADDING }}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.info}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <View className="rounded-full p-4 mb-4" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
                <Sparkles size={32} color={colors.info} />
              </View>
              <Text className="text-lg font-semibold mb-2" style={{ color: colors.foreground }}>
                No conversations yet
              </Text>
              <Text className="text-center px-8 mb-4" style={{ color: colors.mutedForeground }}>
                Start a conversation with the AI assistant to get help with your leads and properties
              </Text>
              <TouchableOpacity
                className="px-6 py-3 rounded-lg"
                style={{ backgroundColor: colors.primary }}
                onPress={handleNewConversation}
                accessibilityLabel="Start a new conversation"
                accessibilityRole="button"
              >
                <Text className="font-medium" style={{ color: colors.primaryForeground }}>Start Chatting</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <SimpleFAB
        testID="new-conversation-fab"
        onPress={handleNewConversation}
        loading={createConversation.isPending}
        accessibilityLabel="Start new conversation"
      />
    </ThemedSafeAreaView>
  );
}

export default ConversationsListScreen;
