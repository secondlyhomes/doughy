// src/components/deals/MetricCard.tsx
// Progressive Disclosure Metric Card - Zone G
// Three-state expandable card: Collapsed -> Expanded (breakdown) -> Actionable

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getShadowStyle } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES, PRESS_OPACITY, DEFAULT_HIT_SLOP } from '@/constants/design-tokens';
import { getConfidenceColors, getConfidenceLabel, formatValue } from './metric-card-helpers';
import { MetricCardCompact } from './MetricCardCompact';
import { MetricCardBreakdown } from './MetricCardBreakdown';
import { MetricCardActions } from './MetricCardActions';
import type { MetricCardProps, CardState } from './metric-card-types';

// Re-export types for consumers
export type {
  ConfidenceLevel,
  BreakdownItem,
  MetricBreakdown,
  MetricAction,
  MetricCardProps,
} from './metric-card-types';

export function MetricCard({
  label,
  value,
  icon,
  breakdown,
  actions,
  confidence,
  compact = false,
  disabled = false,
  style,
  onEvidencePress,
}: MetricCardProps) {
  const colors = useThemeColors();
  const [state, setState] = useState<CardState>('collapsed');

  // Animation values
  const expandProgress = useSharedValue(0);
  const chevronRotation = useSharedValue(0);

  // Confidence-based colors
  const confidenceColors = confidence
    ? getConfidenceColors(confidence, colors)
    : { bg: colors.card, border: colors.border, indicator: colors.mutedForeground };

  // Determine if expandable (has breakdown or actions)
  const isExpandable = Boolean(breakdown || actions);
  const hasActions = Boolean(actions && actions.length > 0);

  // Handle card tap - cycles through states
  const handlePress = useCallback(() => {
    if (disabled || !isExpandable) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Cycle through states
    let newState: CardState;
    if (state === 'collapsed') {
      newState = 'expanded';
      expandProgress.value = withSpring(1, { damping: 15, stiffness: 150 });
      // Instant flip on open (no animation)
      chevronRotation.value = 180;
    } else if (state === 'expanded' && hasActions) {
      newState = 'actionable';
      expandProgress.value = withSpring(2, { damping: 15, stiffness: 150 });
    } else {
      newState = 'collapsed';
      // Smooth animation on close
      expandProgress.value = withSpring(0, { damping: 20, stiffness: 200 });
      chevronRotation.value = withSpring(0, { damping: 20, stiffness: 200 });
    }
    setState(newState);
  }, [state, disabled, isExpandable, hasActions, expandProgress, chevronRotation]);

  // Handle chevron tap - always collapses with smooth animation
  const handleChevronPress = useCallback(() => {
    if (state === 'collapsed') return; // Nothing to collapse

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Smooth close animation
    expandProgress.value = withSpring(0, { damping: 20, stiffness: 200 });
    chevronRotation.value = withSpring(0, { damping: 20, stiffness: 200 });
    setState('collapsed');
  }, [state, expandProgress, chevronRotation]);

  // Animated styles
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const expandedContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expandProgress.value, [0, 1, 2], [0, 1, 1]),
    maxHeight: interpolate(expandProgress.value, [0, 1, 2], [0, 200, 300]),
    marginTop: interpolate(expandProgress.value, [0, 1, 2], [0, SPACING.md, SPACING.md]),
  }));

  // Compact mode rendering
  if (compact) {
    return (
      <MetricCardCompact
        label={label}
        value={value}
        icon={icon}
        confidence={confidence}
        confidenceIndicatorColor={confidenceColors.indicator}
        style={style}
      />
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || !isExpandable}
      activeOpacity={PRESS_OPACITY.DEFAULT}
      style={[
        {
          borderRadius: BORDER_RADIUS.xl,
          backgroundColor: confidenceColors.bg,
          borderWidth: 1,
          borderColor: confidenceColors.border,
          overflow: 'hidden',
          ...getShadowStyle(colors, { size: 'sm' }),
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${formatValue(value)}${confidence ? `, ${getConfidenceLabel(confidence)}` : ''}. ${isExpandable ? 'Tap to expand.' : ''}`}
      accessibilityState={{ expanded: state !== 'collapsed' }}
    >
      {/* Main Content */}
      <View style={{ padding: SPACING.md }}>
        {/* Header Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            {icon}
            <Text style={{ fontSize: 13, fontWeight: '500', color: colors.mutedForeground }}>
              {label}
            </Text>
            {confidence && (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: confidenceColors.indicator,
                }}
              />
            )}
          </View>

          {/* Expand indicator - tapping chevron always closes */}
          {isExpandable && (
            <TouchableOpacity
              onPress={handleChevronPress}
              hitSlop={DEFAULT_HIT_SLOP}
              disabled={state === 'collapsed'}
            >
              <Animated.View style={chevronStyle}>
                <ChevronDown size={ICON_SIZES.sm} color={colors.mutedForeground} />
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>

        {/* Value */}
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: colors.foreground,
            marginTop: SPACING.xs,
          }}
        >
          {formatValue(value)}
        </Text>

        {/* Expanded Content */}
        {isExpandable && state !== 'collapsed' && (
          <Animated.View style={expandedContentStyle}>
            {breakdown && (
              <MetricCardBreakdown
                breakdown={breakdown}
                onEvidencePress={onEvidencePress}
              />
            )}

            {actions && actions.length > 0 && (
              <MetricCardActions
                actions={actions}
                state={state}
                hasActions={hasActions}
              />
            )}
          </Animated.View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default MetricCard;
