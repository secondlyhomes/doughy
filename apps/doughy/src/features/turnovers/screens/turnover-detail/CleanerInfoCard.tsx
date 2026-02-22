// src/features/turnovers/screens/turnover-detail/CleanerInfoCard.tsx
// Cleaner info card for turnover detail screen

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import { formatDateTime } from './utils';

interface CleanerInfoCardProps {
  cleaner: {
    name: string;
    phone?: string | null;
  };
  scheduledAt?: string | null;
}

export function CleanerInfoCard({ cleaner, scheduledAt }: CleanerInfoCardProps) {
  const colors = useThemeColors();

  return (
    <Card className="mb-4">
      <Text
        style={{
          color: colors.foreground,
          fontSize: FONT_SIZES.lg,
          fontWeight: '600',
          marginBottom: SPACING.md,
        }}
      >
        Assigned Cleaner
      </Text>

      <View className="flex-row items-center gap-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.muted }}
        >
          <Text style={{ fontSize: 20 }}>🧹</Text>
        </View>
        <View className="flex-1">
          <Text
            style={{
              color: colors.foreground,
              fontSize: FONT_SIZES.base,
              fontWeight: '500',
            }}
          >
            {cleaner.name}
          </Text>
          {cleaner.phone && (
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: FONT_SIZES.sm,
              }}
            >
              {cleaner.phone}
            </Text>
          )}
        </View>
      </View>

      {scheduledAt && (
        <View className="mt-3 pt-3 border-t border-border">
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: FONT_SIZES.xs,
            }}
          >
            Scheduled for
          </Text>
          <Text
            style={{
              color: colors.foreground,
              fontSize: FONT_SIZES.base,
            }}
          >
            {formatDateTime(scheduledAt)}
          </Text>
        </View>
      )}
    </Card>
  );
}
