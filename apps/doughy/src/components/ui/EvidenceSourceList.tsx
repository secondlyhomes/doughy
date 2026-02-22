import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING } from '@/constants/design-tokens';
import { Badge } from './Badge';
import { getConfidenceBadge } from './calculation-evidence-helpers';
import type { EvidenceSource } from './calculation-evidence-types';

interface EvidenceSourceListProps {
  sources: EvidenceSource[];
}

export function EvidenceSourceList({ sources }: EvidenceSourceListProps) {
  const colors = useThemeColors();

  return (
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
      {sources.map((source, sourceIndex) => {
        const confidenceBadge = getConfidenceBadge(source.confidence);
        return (
          <View
            key={sourceIndex}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: SPACING.xs,
              borderBottomWidth: sourceIndex < sources.length - 1 ? 1 : 0,
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
  );
}
