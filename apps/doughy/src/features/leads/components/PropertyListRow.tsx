// src/features/leads/components/PropertyListRow.tsx
// Compact single-line property row for ExpandableLeadCard list view

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight, Home, Plus } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { formatCurrency } from '@/lib/formatters';
import { SPACING, BORDER_RADIUS, FONT_SIZES, PRESS_OPACITY, ICON_SIZES } from '@/constants/design-tokens';

import { LeadProperty } from '../types';

/** List view row for a property - compact single line */
export const PropertyListRow = React.memo(function PropertyListRow({
  property,
  onPress,
  onStartDeal,
}: {
  property: LeadProperty;
  onPress: () => void;
  onStartDeal?: () => void;
}) {
  const colors = useThemeColors();

  const detailParts: string[] = [];
  if (property.bedrooms) detailParts.push(`${property.bedrooms}bd`);
  if (property.bathrooms) detailParts.push(`${property.bathrooms}ba`);
  if (property.arv) detailParts.push(formatCurrency(property.arv));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={PRESS_OPACITY.DEFAULT}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        backgroundColor: colors.muted,
        borderRadius: BORDER_RADIUS.md,
        marginTop: SPACING.xs,
      }}
    >
      <Home size={ICON_SIZES.md} color={colors.mutedForeground} style={{ marginRight: SPACING.sm }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '500', color: colors.foreground }} numberOfLines={1}>
          {property.address_line_1}, {property.city} {property.state}
        </Text>
        {detailParts.length > 0 && (
          <Text style={{ fontSize: FONT_SIZES.xs, color: colors.mutedForeground, marginTop: SPACING.xxs }}>
            {detailParts.join(' · ')}
          </Text>
        )}
      </View>
      {onStartDeal && (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onStartDeal();
          }}
          style={{
            padding: SPACING.xs,
            backgroundColor: withOpacity(colors.primary, 'light'),
            borderRadius: BORDER_RADIUS.sm,
            marginRight: SPACING.xs,
          }}
          accessibilityLabel="Start deal"
        >
          <Plus size={ICON_SIZES.md} color={colors.primary} />
        </TouchableOpacity>
      )}
      <ChevronRight size={ICON_SIZES.md} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
});
