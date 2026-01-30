// src/features/leads/screens/leads-list/UnknownSellerCard.tsx
// Card for displaying orphan properties without a known seller

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertCircle, Home, Plus } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import type { LeadProperty } from '../../types';

export interface UnknownSellerCardProps {
  properties: LeadProperty[];
  onPropertyPress: (property: LeadProperty) => void;
  onStartDeal?: (propertyId: string) => void;
}

export function UnknownSellerCard({
  properties,
  onPropertyPress,
  onStartDeal,
}: UnknownSellerCardProps) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);

  if (properties.length === 0) return null;

  return (
    <View
      style={{
        backgroundColor: withOpacity(colors.warning, 'light'),
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: withOpacity(colors.warning, 'medium'),
      }}
    >
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: SPACING.md,
        }}
      >
        <AlertCircle size={20} color={colors.warning} style={{ marginRight: SPACING.sm }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
            Unknown Seller
          </Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
            Properties needing skip trace
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Home size={14} color={colors.warning} />
          <Text style={{ fontSize: 14, fontWeight: '500', color: colors.warning }}>
            {properties.length}
          </Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={{ paddingHorizontal: SPACING.sm, paddingBottom: SPACING.md }}>
          {properties.map((property) => (
            <TouchableOpacity
              key={property.id}
              onPress={() => onPropertyPress(property)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: SPACING.sm,
                backgroundColor: colors.card,
                borderRadius: BORDER_RADIUS.md,
                marginTop: SPACING.xs,
              }}
            >
              <Home size={16} color={colors.mutedForeground} style={{ marginRight: SPACING.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }} numberOfLines={1}>
                  {property.address_line_1}
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                  {property.city}, {property.state}
                </Text>
              </View>
              {onStartDeal && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onStartDeal(property.id);
                  }}
                  style={{
                    padding: SPACING.xs,
                    backgroundColor: withOpacity(colors.primary, 'light'),
                    borderRadius: BORDER_RADIUS.sm,
                  }}
                >
                  <Plus size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
