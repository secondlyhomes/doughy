/**
 * ChatHeader Component
 *
 * Displays room name, online count, and connection status.
 */

import React from 'react';
import { View, Text } from 'react-native';
import type { ChatHeaderProps } from '../types';
import { styles } from '../styles';

export function ChatHeader({ roomId, onlineCount, isConnected }: ChatHeaderProps) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>Chat: {roomId}</Text>
        <Text style={styles.headerSubtitle}>{onlineCount} online</Text>
      </View>
      <View
        style={[
          styles.connectionDot,
          { backgroundColor: isConnected ? '#4ECDC4' : '#FF6B6B' },
        ]}
      />
    </View>
  );
}
