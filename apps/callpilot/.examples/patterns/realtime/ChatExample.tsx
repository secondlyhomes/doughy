/**
 * Real-Time Chat Example
 *
 * Full-featured chat with:
 * - Real-time message updates
 * - Typing indicators
 * - Online presence
 * - Message persistence
 * - Optimistic updates
 */

import React, { useRef } from 'react';
import { FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import type { ChatProps, Message } from './types';
import { useChat } from './hooks/useChat';
import {
  ChatHeader,
  ChatInput,
  LoadingState,
  MessageBubble,
  TypingIndicator,
} from './components';
import { styles } from './styles';

export function ChatExample({ roomId = 'general' }: ChatProps) {
  const flatListRef = useRef<FlatList>(null);

  const {
    messages,
    newMessage,
    isLoading,
    isSending,
    isConnected,
    onlineCount,
    typingUsers,
    currentUserId,
    sendMessage,
    handleTextChange,
  } = useChat(roomId);

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} isOwnMessage={item.user_id === currentUserId} />
  );

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ChatHeader
        roomId={roomId}
        onlineCount={onlineCount}
        isConnected={isConnected}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      <TypingIndicator typingUsers={typingUsers} />

      <ChatInput
        value={newMessage}
        onChangeText={handleTextChange}
        onSend={sendMessage}
        isSending={isSending}
      />
    </KeyboardAvoidingView>
  );
}
