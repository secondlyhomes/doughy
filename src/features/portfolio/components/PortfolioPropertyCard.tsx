// src/features/portfolio/components/PortfolioPropertyCard.tsx
// Card displaying a single portfolio property

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MapPin, TrendingUp, TrendingDown, ChevronRight, Home } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import type { PortfolioProperty } from '../types';

interface PortfolioPropertyCardProps {
  property: PortfolioProperty;
  onPress: (propertyId: string) => void;
}

function PortfolioPropertyCardComponent({ property, onPress }: PortfolioPropertyCardProps) {
  const colors = useThemeColors();

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return `$${value.toLocaleString()}`;
  };

  const equity = property.equity || 0;
  const equityPercent = property.purchase_price
    ? ((equity / property.purchase_price) * 100).toFixed(1)
    : 0;
  const isPositiveEquity = equity >= 0;

  const cashFlow = property.monthly_cash_flow || 0;
  const isPositiveCashFlow = cashFlow >= 0;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(property.id)}
      className="rounded-xl overflow-hidden mb-3"
      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
      accessibilityLabel={`View ${property.address}`}
      accessibilityRole="button"
    >
      {/* Property Image or Placeholder */}
      <View className="h-32 relative">
        {property.images && property.images.length > 0 ? (
          <Image
            source={{ uri: property.images.find((i) => i.is_primary)?.url || property.images[0].url }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View
            className="w-full h-full items-center justify-center"
            style={{ backgroundColor: colors.muted }}
          >
            <Home size={40} color={colors.mutedForeground} />
          </View>
        )}

        {/* Equity Badge */}
        <View
          className="absolute top-3 right-3 px-2 py-1 rounded-lg flex-row items-center"
          style={{
            backgroundColor: isPositiveEquity
              ? withOpacity(colors.success, 'medium')
              : withOpacity(colors.destructive, 'medium'),
          }}
        >
          {isPositiveEquity ? (
            <TrendingUp size={12} color={colors.success} />
          ) : (
            <TrendingDown size={12} color={colors.destructive} />
          )}
          <Text
            className="text-xs font-medium ml-1"
            style={{ color: isPositiveEquity ? colors.success : colors.destructive }}
          >
            {equityPercent}%
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="p-4">
        {/* Address */}
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-2">
            <Text className="font-semibold text-base" style={{ color: colors.foreground }} numberOfLines={1}>
              {property.address}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <MapPin size={12} color={colors.mutedForeground} />
              <Text className="text-sm ml-1" style={{ color: colors.mutedForeground }}>
                {property.city}, {property.state}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.mutedForeground} />
        </View>

        {/* Metrics Row */}
        <View className="flex-row gap-4 mt-2">
          {/* Current Value */}
          <View className="flex-1">
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>Value</Text>
            <Text className="font-semibold" style={{ color: colors.foreground }}>
              {formatCurrency(property.current_value)}
            </Text>
          </View>

          {/* Equity */}
          <View className="flex-1">
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>Equity</Text>
            <Text
              className="font-semibold"
              style={{ color: isPositiveEquity ? colors.success : colors.destructive }}
            >
              {formatCurrency(Math.abs(equity))}
            </Text>
          </View>

          {/* Cash Flow */}
          <View className="flex-1">
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>Cash Flow</Text>
            <Text
              className="font-semibold"
              style={{ color: isPositiveCashFlow ? colors.success : colors.destructive }}
            >
              {formatCurrency(Math.abs(cashFlow))}/mo
            </Text>
          </View>
        </View>

        {/* Acquisition Date */}
        {property.acquisition_date && (
          <Text className="text-xs mt-3" style={{ color: colors.mutedForeground }}>
            Acquired {formatDate(property.acquisition_date)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Memoize the component with custom comparison for better list performance
export const PortfolioPropertyCard = memo(PortfolioPropertyCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.property.id === nextProps.property.id &&
    prevProps.property.current_value === nextProps.property.current_value &&
    prevProps.property.equity === nextProps.property.equity &&
    prevProps.property.monthly_cash_flow === nextProps.property.monthly_cash_flow &&
    prevProps.property.address === nextProps.property.address
  );
});
