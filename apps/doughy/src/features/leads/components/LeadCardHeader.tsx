// src/features/leads/components/LeadCardHeader.tsx
// Header section for ExpandableLeadCard — name, status, contact info, expand button

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  ChevronDown,
  ChevronRight,
  Star,
  Phone,
  Mail,
  Building2,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Badge } from '@/components/ui';
import { withOpacity } from '@/lib/design-utils';
import { formatStatus, getStatusBadgeVariant } from '@/lib/formatters';
import { SPACING, BORDER_RADIUS, FONT_SIZES, PRESS_OPACITY, ICON_SIZES } from '@/constants/design-tokens';

import type { LeadWithProperties } from '../types';

interface LeadCardHeaderProps {
  lead: LeadWithProperties;
  expanded: boolean;
  hasProperties: boolean;
  onLeadPress?: () => void;
  onToggleExpanded: () => void;
}

export const LeadCardHeader = React.memo(function LeadCardHeader({
  lead,
  expanded,
  hasProperties,
  onLeadPress,
  onToggleExpanded,
}: LeadCardHeaderProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onLeadPress}
      activeOpacity={PRESS_OPACITY.DEFAULT}
      style={{ padding: SPACING.md }}
      accessibilityRole="button"
      accessibilityLabel={`View ${lead.name || 'lead'} details`}
    >
      {/* Row 1: Name, Star, Status */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
        <Text style={{ fontSize: FONT_SIZES.base, fontWeight: '600', color: colors.foreground, flex: 1 }} numberOfLines={1}>
          {lead.name || 'Unnamed Lead'}
        </Text>
        {lead.starred && <Star size={ICON_SIZES.sm} color={colors.warning} fill={colors.warning} />}
        <Badge variant={getStatusBadgeVariant(lead.status)} size="sm">
          {formatStatus(lead.status)}
        </Badge>
      </View>

      {/* Row 2: Email, Phone, Button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xs }}>
        {lead.email && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
            <Mail size={ICON_SIZES.xs} color={colors.mutedForeground} />
            <Text style={{ fontSize: FONT_SIZES.xs, color: colors.mutedForeground }} numberOfLines={1}>
              {lead.email}
            </Text>
          </View>
        )}
        {lead.phone && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
            <Phone size={ICON_SIZES.xs} color={colors.mutedForeground} />
            <Text style={{ fontSize: FONT_SIZES.xs, color: colors.mutedForeground }}>
              {lead.phone}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        {hasProperties && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onToggleExpanded();
            }}
            activeOpacity={PRESS_OPACITY.DEFAULT}
            accessibilityRole="button"
            accessibilityLabel={`${expanded ? 'Hide' : 'Show'} ${lead.propertyCount} ${lead.propertyCount === 1 ? 'property' : 'properties'}`}
            accessibilityState={{ expanded }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.xs,
                backgroundColor: withOpacity(colors.primary, 'light'),
                paddingVertical: SPACING.xs,
                paddingHorizontal: SPACING.sm,
                borderRadius: BORDER_RADIUS.full,
              }}
            >
              <Building2 size={ICON_SIZES.sm} color={colors.primary} />
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '600', color: colors.primary }}>
                {lead.propertyCount}
              </Text>
              {expanded ? (
                <ChevronDown size={ICON_SIZES.md} color={colors.primary} />
              ) : (
                <ChevronRight size={ICON_SIZES.md} color={colors.primary} />
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
});
