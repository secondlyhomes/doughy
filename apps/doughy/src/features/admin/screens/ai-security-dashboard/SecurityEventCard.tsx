// src/features/admin/screens/ai-security-dashboard/SecurityEventCard.tsx
// Expandable card showing a single security event with threat details

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/contexts/ThemeContext';
import { Badge } from '@/components/ui';
import { BORDER_RADIUS, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';

import { formatRelativeTime } from './utils';
import type { SecurityEvent } from './types';

interface SecurityEventCardProps {
  event: SecurityEvent;
}

export function SecurityEventCard({ event }: SecurityEventCardProps) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);

  const getThreatLevelColor = (level: string): string => {
    if (level === 'critical') return colors.destructive;
    if (level === 'high') return colors.warning;
    if (level === 'medium') return '#f59e0b';
    return colors.mutedForeground;
  };

  const threatColor = getThreatLevelColor(event.threatLevel);

  // Extract input from details if available
  const userInput = event.details?.input || event.details?.user_input || event.details?.message;
  const matchedPattern = event.details?.matched_pattern || event.details?.pattern;
  const additionalDetails = event.details?.details || event.details?.reason;

  return (
    <TouchableOpacity
      activeOpacity={PRESS_OPACITY.DEFAULT}
      onPress={() => setExpanded(!expanded)}
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: threatColor,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Badge
              variant="outline"
              style={{
                backgroundColor: threatColor + '20',
                borderColor: threatColor,
                marginRight: 8,
              }}
            >
              <Text style={{ fontSize: 10, color: threatColor, fontWeight: '600' }}>
                {event.threatLevel.toUpperCase()}
              </Text>
            </Badge>
            <Text style={{ fontSize: 12, color: colors.foreground, fontWeight: '500' }}>
              {event.action.replace(/_/g, ' ')}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
            {formatRelativeTime(event.createdAt)}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={ICON_SIZES.ml}
          color={colors.mutedForeground}
        />
      </View>

      {expanded && (
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
          {userInput && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.mutedForeground, marginBottom: 4 }}>
                User Input:
              </Text>
              <View
                style={{
                  backgroundColor: colors.muted,
                  borderRadius: BORDER_RADIUS.sm,
                  padding: 8,
                }}
              >
                <Text style={{ fontSize: 12, color: colors.foreground }} numberOfLines={5}>
                  {String(userInput)}
                </Text>
              </View>
            </View>
          )}

          {matchedPattern && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.mutedForeground, marginBottom: 4 }}>
                Matched Pattern:
              </Text>
              <Text style={{ fontSize: 12, color: colors.warning, fontFamily: 'monospace' }}>
                {String(matchedPattern)}
              </Text>
            </View>
          )}

          {additionalDetails && (
            <View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.mutedForeground, marginBottom: 4 }}>
                Details:
              </Text>
              <Text style={{ fontSize: 12, color: colors.foreground }}>
                {String(additionalDetails)}
              </Text>
            </View>
          )}

          {!userInput && !matchedPattern && !additionalDetails && (
            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontStyle: 'italic' }}>
              No additional details available
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
