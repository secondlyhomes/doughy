// src/features/skip-tracing/components/PropertyOwnershipCard.tsx
// Card component for displaying property ownership data in skip trace results

import React from 'react';
import { View, Text } from 'react-native';
import {
  Home,
  DollarSign,
  Building2,
} from 'lucide-react-native';
import { Badge } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ICON_SIZES } from '@/constants/design-tokens';
import { formatCurrency } from '@/utils/format';
import type { PropertyOwnership } from '../types';

export function PropertyOwnershipCard({ property }: { property: PropertyOwnership }) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Home size={ICON_SIZES.ml} color={colors.primary} style={{ marginRight: 12, marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: colors.foreground }}>
            {property.address}
          </Text>
          <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
            {property.city}, {property.state} {property.zip}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8, flexWrap: 'wrap' }}>
            <Badge variant={property.ownershipType === 'investment' ? 'secondary' : 'default'}>
              <Text style={{ fontSize: 10, textTransform: 'capitalize' }}>{property.ownershipType}</Text>
            </Badge>
            {property.purchaseDate && (
              <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                Purchased: {new Date(property.purchaseDate).toLocaleDateString()}
              </Text>
            )}
          </View>
          {(property.purchasePrice || property.estimatedValue) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 16 }}>
              {property.purchasePrice && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <DollarSign size={ICON_SIZES.xs} color={colors.mutedForeground} style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                    Paid: {formatCurrency(property.purchasePrice)}
                  </Text>
                </View>
              )}
              {property.estimatedValue && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Building2 size={ICON_SIZES.xs} color={colors.mutedForeground} style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                    Est: {formatCurrency(property.estimatedValue)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
