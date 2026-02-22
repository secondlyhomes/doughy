/**
 * CalculationEvidence Component
 * Displays calculation breakdown with collapsible steps and evidence sources
 *
 * Features:
 * - Collapsible calculation steps with smooth animations
 * - Evidence source attribution with confidence indicators
 * - Formula display with variables
 * - Step-by-step breakdown
 * - Semantic colors for calculation status
 * - Accessibility support
 *
 * Follows Zone B design system with zero hardcoded values.
 * Uses React Native Reanimated for performant animations.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Calculator, ChevronDown } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { Card } from './Card';
import { Badge } from './Badge';
import { CalculationStepItem } from './CalculationStepItem';
import { getStatusConfig } from './calculation-evidence-helpers';

export type {
  CalculationStatus,
  ConfidenceLevel,
  EvidenceSource,
  CalculationStep,
  CalculationEvidenceProps,
} from './calculation-evidence-types';

import type { CalculationEvidenceProps } from './calculation-evidence-types';

export function CalculationEvidence({
  title,
  finalResult,
  status,
  steps,
  variant = 'default',
  startCollapsed = false,
  style,
}: CalculationEvidenceProps) {
  const colors = useThemeColors();
  const [isExpanded, setIsExpanded] = useState(!startCollapsed);

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  // Rotation animation for chevron
  const chevronRotation = useSharedValue(startCollapsed ? 0 : 180);

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    chevronRotation.value = withTiming(newExpanded ? 180 : 0, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  return (
    <Card variant={variant} style={style}>
      {/* Header */}
      <TouchableOpacity
        onPress={toggleExpanded}
        style={{
          padding: SPACING.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        accessibilityRole="button"
        accessibilityLabel={`${title} calculation, ${isExpanded ? 'collapse' : 'expand'} details`}
        accessibilityState={{ expanded: isExpanded }}
      >
        <View style={{ flex: 1, gap: SPACING.sm }}>
          {/* Title Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: BORDER_RADIUS.md,
                backgroundColor: withOpacity(colors.primary, 'muted'),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calculator size={ICON_SIZES.md} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
              {title}
            </Text>
          </View>

          {/* Result */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary }}>
              {finalResult}
            </Text>
            <Badge variant={statusConfig.variant} size="sm">
              <StatusIcon size={12} color={colors.foreground} />
              <Text> {statusConfig.label}</Text>
            </Badge>
          </View>
        </View>

        {/* Expand/Collapse Chevron */}
        <Animated.View style={chevronStyle}>
          <ChevronDown size={ICON_SIZES.md} color={colors.mutedForeground} />
        </Animated.View>
      </TouchableOpacity>

      {/* Breakdown Steps */}
      {isExpanded && (
        <View
          style={{
            paddingHorizontal: SPACING.lg,
            paddingBottom: SPACING.lg,
            gap: SPACING.md,
          }}
        >
          {/* Steps Header */}
          <View
            style={{
              paddingTop: SPACING.md,
              paddingBottom: SPACING.sm,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.mutedForeground,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Calculation Breakdown
            </Text>
          </View>

          {/* Step Items */}
          {steps.map((step, index) => (
            <CalculationStepItem key={index} step={step} index={index} />
          ))}
        </View>
      )}
    </Card>
  );
}
