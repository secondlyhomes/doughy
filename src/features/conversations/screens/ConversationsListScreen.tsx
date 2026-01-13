// Conversations List Screen - React Native
// Zone D: List of AI chat conversations

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  MessageCircle,
  Plus,
  Trash2,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';

import { useConversations, useCreateConversation, useDeleteConversation } from '../hooks/useConversations';
import { Conversation } from '../types';
import { ConversationsStackParamList } from '@/routes/types';

type ConversationsNavigationProp = NativeStackNavigationProp<ConversationsStackParamList>;

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

function ConversationCard({ conversation, onPress, onDelete }: ConversationCardProps) {
  const handleDelete = () => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <TouchableOpacity
      className="bg-card rounded-xl p-4 mb-3"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start">
        <View className="bg-primary/10 rounded-full p-2 mr-3">
          <MessageCircle size={20} color="#3b82f6" />
        </View>

        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground mb-1" numberOfLines={1}>
            {conversation.title || 'Untitled Conversation'}
          </Text>

          {conversation.last_message && (
            <Text className="text-sm text-muted-foreground mb-2" numberOfLines={2}>
              {conversation.last_message}
            </Text>
          )}

          <View className="flex-row items-center">
            <Clock size={12} color="#9ca3af" />
            <Text className="text-xs text-muted-foreground ml-1">
              {formatTimeAgo(conversation.last_message_at)}
            </Text>
            <View className="mx-2 w-1 h-1 rounded-full bg-muted-foreground" />
            <Text className="text-xs text-muted-foreground">
              {conversation.message_count} messages
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <TouchableOpacity
            className="p-2"
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={18} color="#9ca3af" />
          </TouchableOpacity>
          <ChevronRight size={18} color="#9ca3af" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ConversationsListScreen() {
  const navigation = useNavigation<ConversationsNavigationProp>();
  const { conversations, isLoading, refetch } = useConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();

  const handleNewConversation = async () => {
    try {
      const newConversation = await createConversation.mutateAsync('New Conversation');
      // Navigate to the chat screen with the new conversation
      navigation.navigate('ConversationDetail', { leadId: newConversation.id });
    } catch (error) {
      Alert.alert('Error', 'Failed to create conversation');
    }
  };

  const handleConversationPress = useCallback((conversation: Conversation) => {
    navigation.navigate('ConversationDetail', { leadId: conversation.id });
  }, [navigation]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    try {
      await deleteConversation.mutateAsync(id);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete conversation');
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
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-foreground">Conversations</Text>
        <Text className="text-muted-foreground">Your AI chat history</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor="#3b82f6"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <View className="bg-primary/10 rounded-full p-4 mb-4">
                <Sparkles size={32} color="#3b82f6" />
              </View>
              <Text className="text-lg font-semibold text-foreground mb-2">
                No conversations yet
              </Text>
              <Text className="text-muted-foreground text-center px-8 mb-4">
                Start a conversation with the AI assistant to get help with your leads and properties
              </Text>
              <TouchableOpacity
                className="bg-primary px-6 py-3 rounded-lg"
                onPress={handleNewConversation}
              >
                <Text className="text-primary-foreground font-medium">Start Chatting</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
        onPress={handleNewConversation}
        disabled={createConversation.isPending}
      >
        {createConversation.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Plus size={24} color="white" />
        )}
      </TouchableOpacity>
    </View>
  );
}

export default ConversationsListScreen;
