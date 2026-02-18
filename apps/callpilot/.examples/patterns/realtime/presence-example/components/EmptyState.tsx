/**
 * EmptyState Component
 *
 * Displayed when no other users are online.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles';

export function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No one else is online</Text>
      <Text style={styles.emptySubtext}>
        Open this screen in another device to see real-time presence
      </Text>
    </View>
  );
}
