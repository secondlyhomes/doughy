// src/features/admin/screens/security-health/KeysNeedingAttentionCard.tsx
// Card displaying API keys that need rotation or have errors

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BORDER_RADIUS } from '@/constants/design-tokens';
import type { ApiKeyWithAge } from '../../types/security';

interface KeysNeedingAttentionCardProps {
  keysNeedingAttention: ApiKeyWithAge[];
  onViewAll: () => void;
}

export function KeysNeedingAttentionCard({
  keysNeedingAttention,
  onViewAll,
}: KeysNeedingAttentionCardProps) {
  const colors = useThemeColors();

  if (keysNeedingAttention.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: 16,
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: '600',
          color: colors.foreground,
          marginBottom: 12,
        }}
      >
        Keys Needing Attention
      </Text>

      {keysNeedingAttention.slice(0, 5).map((key) => (
        <View
          key={key.service}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: key.hasError
                ? colors.destructive
                : key.ageStatus === 'stale'
                ? colors.destructive
                : colors.warning,
              marginRight: 8,
            }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: colors.foreground }}>
              {key.name}
            </Text>
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
              {key.hasError
                ? 'Has errors'
                : key.ageDays > 0
                ? `Updated ${key.ageDays} days ago`
                : 'Unknown age'}
            </Text>
          </View>
        </View>
      ))}

      {keysNeedingAttention.length > 5 && (
        <Text
          style={{
            fontSize: 12,
            color: colors.primary,
            marginTop: 8,
            textAlign: 'center',
          }}
          onPress={onViewAll}
        >
          +{keysNeedingAttention.length - 5} more
        </Text>
      )}
    </View>
  );
}
