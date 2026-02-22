// src/features/admin/screens/ai-security-dashboard/ThreatScoresSection.tsx
// Threat scores section showing flagged users with elevated threat levels

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';

import { UserThreatScore } from './types';
import { SectionHeader } from './DashboardHelpers';
import { ThreatScoreCard } from './ThreatScoreCard';

interface ThreatScoresSectionProps {
  threatScores: UserThreatScore[];
  onUserPress: (userId: string) => void;
}

export function ThreatScoresSection({ threatScores, onUserPress }: ThreatScoresSectionProps) {
  const colors = useThemeColors();

  return (
    <>
      <SectionHeader title="Threat Scores" colors={colors} />
      {threatScores.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: BORDER_RADIUS.lg,
            padding: 16,
            alignItems: 'center',
            marginBottom: SPACING.lg,
          }}
        >
          <Ionicons name="shield-checkmark" size={ICON_SIZES['2xl']} color={colors.success} />
          <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>
            No elevated threat scores
          </Text>
        </View>
      ) : (
        <View style={{ marginBottom: SPACING.lg }}>
          {threatScores.slice(0, 10).map((user) => (
            <TouchableOpacity
              key={user.userId}
              activeOpacity={PRESS_OPACITY.DEFAULT}
              onPress={() => onUserPress(user.userId)}
            >
              <ThreatScoreCard user={user} />
            </TouchableOpacity>
          ))}
          {threatScores.length > 10 && (
            <View style={{ alignItems: 'center', paddingTop: 8 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                +{threatScores.length - 10} more users
              </Text>
            </View>
          )}
        </View>
      )}
    </>
  );
}
