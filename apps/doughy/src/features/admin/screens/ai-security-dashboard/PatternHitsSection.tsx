// src/features/admin/screens/ai-security-dashboard/PatternHitsSection.tsx
// Pattern management section showing top pattern hits with manage action

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';

import { SecurityPattern } from './types';
import { SectionHeaderWithAction } from './DashboardHelpers';
import { PatternRow } from './PatternHitRow';

interface PatternHitsSectionProps {
  patterns: SecurityPattern[];
  onManagePatterns: () => void;
}

export function PatternHitsSection({ patterns, onManagePatterns }: PatternHitsSectionProps) {
  const colors = useThemeColors();
  const activePatterns = patterns.filter((p) => p.hitCount > 0);

  return (
    <>
      <SectionHeaderWithAction
        title="Security Patterns"
        actionLabel="Manage"
        onAction={onManagePatterns}
        colors={colors}
      />
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: BORDER_RADIUS.lg,
          padding: 16,
          marginBottom: SPACING.lg,
        }}
      >
        {activePatterns.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 16 }}>
            <Text style={{ color: colors.mutedForeground }}>
              No pattern hits recorded
            </Text>
            <Button
              variant="outline"
              onPress={onManagePatterns}
              style={{ marginTop: 12 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="add" size={ICON_SIZES.md} color={colors.primary} />
                <Text style={{ color: colors.primary }}>Add Pattern</Text>
              </View>
            </Button>
          </View>
        ) : (
          <>
            {activePatterns
              .sort((a, b) => b.hitCount - a.hitCount)
              .slice(0, 5)
              .map((pattern) => (
                <PatternRow key={pattern.id} pattern={pattern} colors={colors} />
              ))}
            {activePatterns.length > 5 && (
              <TouchableOpacity
                onPress={onManagePatterns}
                style={{ alignItems: 'center', paddingTop: 12 }}
              >
                <Text style={{ color: colors.primary, fontSize: 13 }}>
                  View all {patterns.length} patterns
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </>
  );
}
