/**
 * OverrideComparisonCard
 * Before/after comparison display for calculation overrides.
 * Shows the AI-calculated value alongside the user's new override value.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, ICON_SIZES } from '@/constants/design-tokens';
import { Card } from './Card';
import { Badge } from './Badge';
import { CalculationOverride, getDisplayValue } from './override-calculation-types';

export interface OverrideComparisonCardProps {
  /** Calculation being overridden */
  calculation: CalculationOverride;

  /** New value entered by user */
  newValue: string;
}

export function OverrideComparisonCard({ calculation, newValue }: OverrideComparisonCardProps) {
  const colors = useThemeColors();

  return (
    <View style={{ gap: SPACING.md }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
        Value Comparison
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.md,
        }}
      >
        {/* AI Value */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: SPACING.xs }}>
            AI Calculated
          </Text>
          <Card variant="default">
            <View style={{ padding: SPACING.md, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
                {getDisplayValue(calculation.aiValue, calculation)}
              </Text>
              <Badge variant="outline" size="sm" style={{ marginTop: SPACING.xs }}>
                Current
              </Badge>
            </View>
          </Card>
        </View>

        {/* Arrow */}
        <ArrowRight size={ICON_SIZES.lg} color={colors.mutedForeground} />

        {/* New Value */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: SPACING.xs }}>
            Your Override
          </Text>
          <Card variant="default">
            <View style={{ padding: SPACING.md, alignItems: 'center' }}>
              {newValue ? (
                <>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: colors.primary }}>
                    {getDisplayValue(newValue, calculation)}
                  </Text>
                  <Badge variant="default" size="sm" style={{ marginTop: SPACING.xs }}>
                    New
                  </Badge>
                </>
              ) : (
                <Text style={{ fontSize: 14, color: colors.mutedForeground }}>Enter value</Text>
              )}
            </View>
          </Card>
        </View>
      </View>
    </View>
  );
}
