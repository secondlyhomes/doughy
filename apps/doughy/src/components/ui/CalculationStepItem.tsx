import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import { EvidenceSourceList } from './EvidenceSourceList';
import type { CalculationStep } from './calculation-evidence-types';

interface CalculationStepItemProps {
  step: CalculationStep;
  index: number;
}

export function CalculationStepItem({ step, index }: CalculationStepItemProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: withOpacity(colors.primary, 'subtle'),
        borderWidth: 1,
        borderColor: withOpacity(colors.primary, 'light'),
        gap: SPACING.sm,
      }}
    >
      {/* Step Label */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
          {index + 1}. {step.label}
        </Text>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.primary }}>
          {step.result}
        </Text>
      </View>

      {/* Formula */}
      {step.formula && (
        <View
          style={{
            padding: SPACING.sm,
            borderRadius: BORDER_RADIUS.sm,
            backgroundColor: colors.card,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'monospace',
              color: colors.mutedForeground,
            }}
          >
            {step.formula}
          </Text>
        </View>
      )}

      {/* Explanation */}
      {step.explanation && (
        <Text style={{ fontSize: 13, color: colors.mutedForeground, lineHeight: 18 }}>
          {step.explanation}
        </Text>
      )}

      {/* Evidence Sources */}
      {step.sources && step.sources.length > 0 && (
        <EvidenceSourceList sources={step.sources} />
      )}
    </View>
  );
}
