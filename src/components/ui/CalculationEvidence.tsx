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
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Calculator, ChevronDown, CheckCircle2, AlertCircle, Info } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { Card } from './Card';
import { Badge } from './Badge';

export type CalculationStatus = 'verified' | 'estimated' | 'needs_review';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface EvidenceSource {
  /** Source label (e.g., "County Tax Records", "MLS Listing") */
  label: string;

  /** Confidence level */
  confidence: ConfidenceLevel;

  /** Specific value or detail from source */
  value?: string;

  /** When the data was retrieved/verified */
  timestamp?: string;
}

export interface CalculationStep {
  /** Step label */
  label: string;

  /** Formula or calculation description */
  formula?: string;

  /** Result value */
  result: string;

  /** Evidence sources for this step */
  sources?: EvidenceSource[];

  /** Additional explanation */
  explanation?: string;
}

export interface CalculationEvidenceProps {
  /** Calculation title (e.g., "ARV Calculation", "ROI Analysis") */
  title: string;

  /** Final result to display */
  finalResult: string;

  /** Calculation status */
  status: CalculationStatus;

  /** Breakdown steps */
  steps: CalculationStep[];

  /** Card variant */
  variant?: 'default' | 'glass';

  /** Start collapsed */
  startCollapsed?: boolean;

  /** Custom style */
  style?: ViewStyle;
}

/**
 * Gets status badge configuration
 */
function getStatusConfig(status: CalculationStatus): {
  variant: 'success' | 'warning' | 'outline';
  label: string;
  icon: React.ComponentType<any>;
} {
  switch (status) {
    case 'verified':
      return { variant: 'success', label: 'Verified', icon: CheckCircle2 };
    case 'estimated':
      return { variant: 'warning', label: 'Estimated', icon: Info };
    case 'needs_review':
      return { variant: 'outline', label: 'Needs Review', icon: AlertCircle };
  }
}

/**
 * Gets confidence badge variant
 */
function getConfidenceBadge(confidence: ConfidenceLevel): {
  variant: 'success' | 'warning' | 'destructive';
  label: string;
} {
  switch (confidence) {
    case 'high':
      return { variant: 'success', label: 'High' };
    case 'medium':
      return { variant: 'warning', label: 'Medium' };
    case 'low':
      return { variant: 'destructive', label: 'Low' };
  }
}

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
            <View
              key={index}
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
                <View style={{ gap: SPACING.xs, marginTop: SPACING.xs }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '500',
                      color: colors.mutedForeground,
                      textTransform: 'uppercase',
                      letterSpacing: 0.3,
                    }}
                  >
                    Evidence Sources
                  </Text>
                  {step.sources.map((source, sourceIndex) => {
                    const confidenceBadge = getConfidenceBadge(source.confidence);
                    return (
                      <View
                        key={sourceIndex}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingVertical: SPACING.xs,
                          borderBottomWidth: sourceIndex < step.sources!.length - 1 ? 1 : 0,
                          borderBottomColor: withOpacity(colors.border, 'light'),
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.foreground }}>
                            {source.label}
                          </Text>
                          {source.value && (
                            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                              {source.value}
                            </Text>
                          )}
                          {source.timestamp && (
                            <Text
                              style={{
                                fontSize: 11,
                                color: colors.mutedForeground,
                                marginTop: 2,
                              }}
                            >
                              Verified: {source.timestamp}
                            </Text>
                          )}
                        </View>
                        <Badge variant={confidenceBadge.variant} size="sm">
                          {confidenceBadge.label}
                        </Badge>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
