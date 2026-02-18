// src/features/admin/screens/ai-security-dashboard/ThreatScoreCard.tsx
// User threat score card component

import React from 'react';
import { View, Text } from 'react-native';

import { useThemeColors } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING } from '@/constants/design-tokens';

import type { UserThreatScore } from './types';
import { formatRelativeTime } from './utils';

interface ThreatScoreCardProps {
  user: UserThreatScore;
}

export function ThreatScoreCard({ user }: ThreatScoreCardProps) {
  const colors = useThemeColors();

  const getScoreColor = (score: number): string => {
    if (score >= 800) return colors.destructive;
    if (score >= 500) return colors.warning;
    if (score >= 200) return '#f59e0b'; // amber
    return colors.success;
  };

  const scoreColor = getScoreColor(user.currentScore);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Score indicator */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: scoreColor + '20',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: SPACING.md,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: scoreColor }}>
          {user.currentScore}
        </Text>
      </View>

      {/* User info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '500', color: colors.foreground }} numberOfLines={1}>
          {user.userEmail || user.userId.slice(0, 8) + '...'}
        </Text>
        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
          {user.events24h} events in 24h
        </Text>
      </View>

      {/* Status badges */}
      <View style={{ alignItems: 'flex-end' }}>
        {user.isFlagged && (
          <View
            style={{
              backgroundColor: colors.destructive,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 4,
            }}
          >
            <Text style={{ fontSize: 10, color: '#fff', fontWeight: '600' }}>FLAGGED</Text>
          </View>
        )}
        <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: SPACING.xs }}>
          {formatRelativeTime(user.lastEventAt)}
        </Text>
      </View>
    </View>
  );
}
