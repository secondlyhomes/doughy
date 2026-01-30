// src/features/admin/components/SecurityScoreCard.tsx
// Visual security score card with circular progress indicator

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { BORDER_RADIUS, SPACING } from '@/constants/design-tokens';

interface SecurityScoreCardProps {
  /** Security score from 0-100 */
  score: number;
  /** Whether data is loading */
  loading?: boolean;
  /** Optional subtitle text */
  subtitle?: string;
}

/**
 * Get score color based on value
 */
function getScoreColor(score: number, colors: ReturnType<typeof useThemeColors>) {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.warning;
  return colors.destructive;
}

/**
 * Get score label based on value
 */
function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Needs Attention';
  return 'Critical';
}

/**
 * Get appropriate shield icon
 */
function getShieldIcon(score: number, size: number, color: string) {
  if (score >= 80) return <ShieldCheck size={size} color={color} />;
  if (score >= 60) return <Shield size={size} color={color} />;
  return <ShieldAlert size={size} color={color} />;
}

/**
 * SecurityScoreCard displays a visual health score with circular progress
 */
export const SecurityScoreCard = React.memo(function SecurityScoreCard({
  score,
  loading = false,
  subtitle,
}: SecurityScoreCardProps) {
  const colors = useThemeColors();
  const scoreColor = getScoreColor(score, colors);
  const scoreLabel = getScoreLabel(score);

  // Circular progress config
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = loading ? 0 : score / 100;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.content}>
        {/* Circular Progress */}
        <View style={styles.progressContainer}>
          <Svg width={size} height={size} style={styles.svg}>
            {/* Background circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={withOpacity(colors.muted, 'strong')}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={loading ? colors.muted : scoreColor}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>

          {/* Score text in center */}
          <View style={styles.scoreOverlay}>
            {loading ? (
              <Text style={[styles.scoreText, { color: colors.mutedForeground }]}>
                --
              </Text>
            ) : (
              <>
                <Text style={[styles.scoreText, { color: scoreColor }]}>
                  {Math.round(score)}
                </Text>
                <Text style={[styles.scoreMax, { color: colors.mutedForeground }]}>
                  /100
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Score info */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            {getShieldIcon(score, 24, scoreColor)}
            <Text style={[styles.title, { color: colors.foreground }]}>
              Security Health
            </Text>
          </View>

          <Text style={[styles.label, { color: scoreColor }]}>
            {loading ? 'Checking...' : scoreLabel}
          </Text>

          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  progressContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  svg: {
    transform: [{ rotate: '0deg' }],
  },
  scoreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '700',
  },
  scoreMax: {
    fontSize: 12,
    marginTop: -4,
  },
  infoContainer: {
    flex: 1,
    gap: SPACING.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: SPACING.xs,
  },
  subtitle: {
    fontSize: 13,
    marginTop: SPACING.xxs,
  },
});
