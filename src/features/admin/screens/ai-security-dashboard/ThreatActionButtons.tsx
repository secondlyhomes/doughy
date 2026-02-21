// src/features/admin/screens/ai-security-dashboard/ThreatActionButtons.tsx
// Action buttons for resetting threat score and blocking/unblocking users

import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui';
import { SPACING, ICON_SIZES } from '@/constants/design-tokens';

interface ThreatActionButtonsProps {
  actionLoading: string | null;
  onResetScore: () => void;
  onBlockUser: () => void;
}

export function ThreatActionButtons({ actionLoading, onResetScore, onBlockUser }: ThreatActionButtonsProps) {
  const colors = useThemeColors();

  return (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: SPACING.lg }}>
      <Button
        variant="outline"
        onPress={onResetScore}
        disabled={actionLoading !== null}
        style={{ flex: 1 }}
      >
        {actionLoading === 'reset' ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="refresh" size={ICON_SIZES.md} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: '500' }}>Reset Score</Text>
          </View>
        )}
      </Button>
      <Button
        variant="destructive"
        onPress={onBlockUser}
        disabled={actionLoading !== null}
        style={{ flex: 1 }}
      >
        {actionLoading === 'block' ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="ban" size={ICON_SIZES.md} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '500' }}>Block User</Text>
          </View>
        )}
      </Button>
    </View>
  );
}
