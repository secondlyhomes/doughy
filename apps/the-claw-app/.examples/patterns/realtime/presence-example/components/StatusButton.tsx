/**
 * StatusButton Component
 *
 * Toggle button for changing user's online/away status.
 */

import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { styles } from '../styles';

interface StatusButtonProps {
  currentStatus: 'online' | 'away';
  onToggle: () => void;
}

export function StatusButton({ currentStatus, onToggle }: StatusButtonProps) {
  const statusText = currentStatus === 'online' ? 'Online' : 'Away';

  return (
    <TouchableOpacity style={styles.statusButton} onPress={onToggle}>
      <Text style={styles.statusButtonText}>
        My Status: {statusText} (Tap to toggle)
      </Text>
    </TouchableOpacity>
  );
}
