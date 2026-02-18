/**
 * ConnectionStatus Component
 *
 * Displays real-time connection indicator (Live/Offline).
 */

import React from 'react';
import { View, Text } from 'react-native';
import type { ConnectionStatusProps } from '../types';
import { styles } from '../styles';

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <View style={styles.connectionStatus}>
      <View
        style={[
          styles.connectionDot,
          { backgroundColor: isConnected ? '#4ECDC4' : '#FF6B6B' },
        ]}
      />
      <Text style={styles.connectionText}>
        {isConnected ? 'Live' : 'Offline'}
      </Text>
    </View>
  );
}
