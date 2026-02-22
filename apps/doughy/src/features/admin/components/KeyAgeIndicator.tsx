// src/features/admin/components/KeyAgeIndicator.tsx
// Visual indicator for API key age with color-coded status

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import {
  calculateKeyAgeDays,
  getKeyAgeStatus,
  formatKeyAge,
  getAgeStatusMessage,
} from '../services/securityHealthService';
import { KEY_AGE_COLORS, type KeyAgeStatus } from '../types/security';

interface KeyAgeIndicatorProps {
  /** When the key was last updated (ISO string) */
  updatedAt: string | null;
  /** When the key was created (ISO string) - used if updatedAt is null */
  createdAt: string | null;
  /** Compact mode shows only the badge */
  compact?: boolean;
  /** Show the full date in addition to relative time */
  showDate?: boolean;
}

/**
 * Get the appropriate icon for an age status
 */
function getStatusIcon(status: KeyAgeStatus, size: number, color: string) {
  switch (status) {
    case 'fresh':
      return <CheckCircle size={size} color={color} />;
    case 'aging':
      return <Clock size={size} color={color} />;
    case 'stale':
      return <AlertTriangle size={size} color={color} />;
  }
}

/**
 * KeyAgeIndicator shows the age of an API key with visual status
 *
 * Colors:
 * - Green (fresh): Key < 60 days old
 * - Yellow (aging): Key 60-180 days old
 * - Red (stale): Key > 180 days old
 */
export const KeyAgeIndicator = React.memo(function KeyAgeIndicator({
  updatedAt,
  createdAt,
  compact = false,
  showDate = false,
}: KeyAgeIndicatorProps) {
  const colors = useThemeColors();

  // Calculate age from the most recent date
  const effectiveDate = updatedAt || createdAt;
  const ageDays = calculateKeyAgeDays(effectiveDate);
  const ageStatus = getKeyAgeStatus(ageDays);

  // Get color based on status
  const statusColorKey = KEY_AGE_COLORS[ageStatus];
  const statusColor = colors[statusColorKey];

  // Format the age string
  const ageText = formatKeyAge(ageDays);
  const statusMessage = getAgeStatusMessage(ageStatus);

  // Format full date if requested
  const fullDate = effectiveDate
    ? new Date(effectiveDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  if (compact) {
    return (
      <View
        style={[
          styles.compactBadge,
          { backgroundColor: withOpacity(statusColor, 'muted') },
        ]}
      >
        {getStatusIcon(ageStatus, 10, statusColor)}
        <Text style={[styles.compactText, { color: statusColor }]}>
          {ageText}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          { backgroundColor: withOpacity(statusColor, 'muted') },
        ]}
      >
        {getStatusIcon(ageStatus, 12, statusColor)}
        <Text style={[styles.ageText, { color: statusColor }]}>
          Updated {ageText}
        </Text>
      </View>

      {(showDate || ageStatus !== 'fresh') && (
        <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
          {fullDate && showDate ? `Last updated: ${fullDate}` : ''}
          {ageStatus !== 'fresh' && (
            <Text style={{ color: statusColor }}>
              {fullDate && showDate ? ' - ' : ''}
              {statusMessage}
            </Text>
          )}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  ageText: {
    fontSize: 11,
    fontWeight: '500',
  },
  compactText: {
    fontSize: 10,
    fontWeight: '500',
  },
  detailText: {
    fontSize: 10,
    marginTop: 4,
  },
});
