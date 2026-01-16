// src/components/deals/MetricCard.tsx
// Progressive Disclosure Metric Card - Zone G
// Three-state expandable card: Collapsed -> Expanded (breakdown) -> Actionable

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { ChevronDown, ChevronUp, Info } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity, getShadowStyle } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { Button } from '@/components/ui';

// ============================================
// Types
// ============================================

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface BreakdownItem {
  label: string;
  value: string | number;
  isSubtraction?: boolean;
}

export interface MetricBreakdown {
  formula: string;
  items: BreakdownItem[];
}

export interface MetricAction {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

export interface MetricCardProps {
  /** Label for the metric (e.g., "MAO", "Net Profit") */
  label: string;

  /** Main value to display */
  value: string | number;

  /** Icon to display next to label */
  icon?: React.ReactNode;

  /** Optional breakdown showing calculation details */
  breakdown?: MetricBreakdown;

  /** Optional actions when fully expanded */
  actions?: MetricAction[];

  /** Confidence level for color coding */
  confidence?: ConfidenceLevel;

  /** Compact mode for sticky headers */
  compact?: boolean;

  /** Whether card is disabled */
  disabled?: boolean;

  /** Custom style */
  style?: ViewStyle;

  /** Callback when evidence info is pressed */
  onEvidencePress?: () => void;
}

// ============================================
// Card State Enum
// ============================================

type CardState = 'collapsed' | 'expanded' | 'actionable';

// ============================================
// Helper Functions
// ============================================

function getConfidenceColors(confidence: ConfidenceLevel, colors: ReturnType<typeof useThemeColors>) {
  switch (confidence) {
    case 'high':
      return {
        bg: withOpacity(colors.success, 'subtle'),
        border: withOpacity(colors.success, 'light'),
        indicator: colors.success,
      };
    case 'medium':
      return {
        bg: withOpacity(colors.warning, 'subtle'),
        border: withOpacity(colors.warning, 'light'),
        indicator: colors.warning,
      };
    case 'low':
      return {
        bg: withOpacity(colors.destructive, 'subtle'),
        border: withOpacity(colors.destructive, 'light'),
        indicator: colors.destructive,
      };
    default:
      return {
        bg: colors.card,
        border: colors.border,
        indicator: colors.mutedForeground,
      };
  }
}

function getConfidenceLabel(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return 'High confidence';
    case 'medium':
      return 'Medium confidence';
    case 'low':
      return 'Low confidence';
  }
}

function formatValue(value: string | number): string {
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return value;
}

// ============================================
// MetricCard Component
// ============================================

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

  // Handle card tap
  const handlePress = useCallback(() => {
    if (disabled || !isExpandable) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Cycle through states
    let newState: CardState;
    if (state === 'collapsed') {
      newState = 'expanded';
      expandProgress.value = withSpring(1, { damping: 15, stiffness: 150 });
      chevronRotation.value = withTiming(180, { duration: 200, easing: Easing.out(Easing.ease) });
    } else if (state === 'expanded' && hasActions) {
      newState = 'actionable';
      expandProgress.value = withSpring(2, { damping: 15, stiffness: 150 });
    } else {
      newState = 'collapsed';
      expandProgress.value = withSpring(0, { damping: 15, stiffness: 150 });
      chevronRotation.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) });
    }
    setState(newState);
  }, [state, disabled, isExpandable, hasActions, expandProgress, chevronRotation]);

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
      <View
        style={[
          {
            flex: 1,
            alignItems: 'center',
            paddingVertical: SPACING.sm,
            paddingHorizontal: SPACING.sm,
          },
          style,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
          {icon}
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{label}</Text>
        </View>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, marginTop: 2 }}>
          {formatValue(value)}
        </Text>
        {confidence && (
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: confidenceColors.indicator,
              marginTop: 4,
            }}
          />
        )}
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || !isExpandable}
      activeOpacity={0.7}
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

          {/* Expand indicator */}
          {isExpandable && (
            <Animated.View style={chevronStyle}>
              <ChevronDown size={ICON_SIZES.sm} color={colors.mutedForeground} />
            </Animated.View>
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
            {/* Breakdown Section */}
            {breakdown && (
              <View
                style={{
                  padding: SPACING.md,
                  borderRadius: BORDER_RADIUS.md,
                  backgroundColor: withOpacity(colors.background, 'medium'),
                  gap: SPACING.sm,
                }}
              >
                {/* Formula */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'monospace',
                      color: colors.mutedForeground,
                    }}
                  >
                    {breakdown.formula}
                  </Text>
                  {onEvidencePress && (
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onEvidencePress();
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Info size={ICON_SIZES.sm} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Breakdown Items */}
                {breakdown.items.map((item) => (
                  <View
                    key={`${item.label}-${item.value}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: SPACING.xs,
                      borderTopWidth: 1,
                      borderTopColor: withOpacity(colors.border, 'light'),
                    }}
                  >
                    <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
                      {item.isSubtraction ? '−' : '+'} {item.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: item.isSubtraction ? colors.destructive : colors.foreground,
                      }}
                    >
                      {formatValue(item.value)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Actions Section (only in actionable state) */}
            {state === 'actionable' && actions && actions.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: SPACING.sm,
                  marginTop: SPACING.sm,
                }}
              >
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      action.onPress();
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </View>
            )}

            {/* Hint to expand to actions */}
            {state === 'expanded' && hasActions && (
              <Text
                style={{
                  fontSize: 11,
                  color: colors.mutedForeground,
                  textAlign: 'center',
                  marginTop: SPACING.sm,
                }}
              >
                Tap again for actions
              </Text>
            )}
          </Animated.View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default MetricCard;
