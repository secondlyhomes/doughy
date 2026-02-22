// src/features/lead-inbox/components/DeliveryStatusIndicator.tsx
// Delivery status indicator (check marks, clock, failed) for outbound messages

import React from 'react';
import { View, Text } from 'react-native';
import { Check, Clock } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { styles } from './lead-message-bubble-styles';

interface DeliveryStatusIndicatorProps {
  isFailed: boolean;
  isRead: boolean;
  isDelivered: boolean;
}

export const DeliveryStatusIndicator = ({
  isFailed,
  isRead,
  isDelivered,
}: DeliveryStatusIndicatorProps) => {
  const colors = useThemeColors();

  if (isFailed) {
    return (
      <Text style={[styles.failedText, { color: colors.destructive }]}>
        Failed
      </Text>
    );
  }

  if (isRead) {
    return (
      <View style={styles.statusIconRow}>
        <Check size={12} color={colors.success} />
        <Check size={12} color={colors.success} style={{ marginLeft: -6 }} />
      </View>
    );
  }

  if (isDelivered) {
    return <Check size={12} color={colors.mutedForeground} />;
  }

  return <Clock size={12} color={colors.mutedForeground} />;
};
