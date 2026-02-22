// src/components/deals/EvidenceSourceCard.tsx
// Individual evidence source card for EvidenceTrailModal

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, Clock, ExternalLink } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { Badge } from '@/components/ui';
import { getConfidenceConfig, formatValue, formatTimestamp } from './evidence-trail-helpers';
import type { EvidenceSource } from './evidence-trail-types';

interface EvidenceSourceCardProps {
  source: EvidenceSource;
  onSelect?: (sourceId: string) => void;
}

export function EvidenceSourceCard({ source, onSelect }: EvidenceSourceCardProps) {
  const colors = useThemeColors();
  const sourceConfidence = getConfidenceConfig(source.confidence);

  return (
    <TouchableOpacity
      onPress={() => onSelect && onSelect(source.id)}
      disabled={!onSelect}
      activeOpacity={onSelect ? 0.7 : 1}
      style={{
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: source.isActive
          ? withOpacity(colors.primary, 'light')
          : colors.card,
        borderWidth: source.isActive ? 2 : 1,
        borderColor: source.isActive ? colors.primary : colors.border,
        gap: SPACING.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          {source.isActive && (
            <Check size={ICON_SIZES.sm} color={colors.primary} />
          )}
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
            {source.source}
          </Text>
          {source.url && (
            <ExternalLink size={12} color={colors.mutedForeground} />
          )}
        </View>
        <Badge variant={sourceConfidence.variant} size="sm">
          {sourceConfidence.label.split(' ')[0]}
        </Badge>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>
          {formatValue(source.value)}
        </Text>
        {source.timestamp && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
            <Clock size={12} color={colors.mutedForeground} />
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
              {formatTimestamp(source.timestamp)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
