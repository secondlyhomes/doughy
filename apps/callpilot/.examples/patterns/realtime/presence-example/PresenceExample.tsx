/**
 * Presence Example Component
 *
 * Shows online users with avatars, status indicators, and typing notifications.
 * Production-ready implementation with proper cleanup and error handling.
 *
 * This is a thin orchestration component that composes extracted pieces.
 */

import React, { useCallback } from 'react';
import { View, Text, FlatList } from 'react-native';
import { usePresence } from './hooks/usePresence';
import { ConnectionStatus } from './components/ConnectionStatus';
import { StatusButton } from './components/StatusButton';
import { UserListItem } from './components/UserListItem';
import { EmptyState } from './components/EmptyState';
import { ErrorBanner } from './components/ErrorBanner';
import { styles } from './styles';
import type { UserPresence } from './types';

export function PresenceExample() {
  const { onlineUsers, myStatus, isConnected, error, toggleStatus } = usePresence();

  const renderUser = useCallback(
    ({ item }: { item: UserPresence }) => <UserListItem user={item} />,
    []
  );

  const keyExtractor = useCallback((item: UserPresence) => item.userId, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Online Users ({onlineUsers.length})</Text>
        <ConnectionStatus isConnected={isConnected} />
      </View>

      {/* Error Banner */}
      {error && <ErrorBanner message={error} />}

      {/* Status Toggle */}
      <StatusButton currentStatus={myStatus} onToggle={toggleStatus} />

      {/* User List or Empty State */}
      {onlineUsers.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={onlineUsers}
          renderItem={renderUser}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}
