// src/features/admin/screens/ai-security-dashboard/UserInfoCard.tsx
// Displays user avatar, email, ID, and threat score summary

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/contexts/ThemeContext';
import { Badge } from '@/components/ui';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';

import type { UserThreatScore } from './types';

interface UserInfoCardProps {
  userEmail: string | null;
  userId: string;
  userScore: UserThreatScore | null;
}

export function UserInfoCard({ userEmail, userId, userScore }: UserInfoCardProps) {
  const colors = useThemeColors();

  const getScoreColor = (score: number): string => {
    if (score >= 800) return colors.destructive;
    if (score >= 500) return colors.warning;
    if (score >= 200) return '#f59e0b';
    return colors.success;
  };

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: 16,
        marginBottom: SPACING.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.muted,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="person" size={ICON_SIZES.xl} color={colors.mutedForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
            {userEmail || 'Unknown User'}
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }} numberOfLines={1}>
            {userId}
          </Text>
        </View>
      </View>

      {/* Threat Score */}
      {userScore && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Threat Score</Text>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '700',
                color: getScoreColor(userScore.currentScore),
              }}
            >
              {userScore.currentScore}
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Events (24h)</Text>
            <Text style={{ fontSize: 24, fontWeight: '600', color: colors.foreground }}>
              {userScore.events24h}
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            {userScore.isFlagged && (
              <Badge variant="destructive">
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>FLAGGED</Text>
              </Badge>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
