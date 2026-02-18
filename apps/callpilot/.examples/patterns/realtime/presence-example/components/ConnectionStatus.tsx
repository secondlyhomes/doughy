/**
 * ConnectionStatus Component
 *
 * Displays connection status indicator with dot and text.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { styles, colors } from '../styles';

interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  const dotColor = isConnected ? colors.connected : colors.disconnected;
  const statusText = isConnected ? 'Connected' : 'Disconnected';

  return (
    <View style={styles.connectionStatus}>
      <View style={[styles.connectionDot, { backgroundColor: dotColor }]} />
      <Text style={styles.connectionText}>{statusText}</Text>
    </View>
  );
}
