// src/features/real-estate/components/ARVCalculator.tsx
// ARV (After Repair Value) calculator based on comparable properties
// Uses useThemeColors() for reliable dark mode support

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  TrendingUp,
  Calculator,
  Info,
  ChevronRight,
  Check,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { PropertyComp, Property } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface ARVCalculatorProps {
  comps: PropertyComp[];
  property: Property;
  onUpdateARV?: (arv: number) => void;
}

interface ARVStats {
  avgPrice: number;
  avgPricePerSqft: number;
  calculatedARV: number;
  highARV: number;
  lowARV: number;
  medianPrice: number;
  totalComps: number;
  validComps: number;
}

export function ARVCalculator({ comps, property, onUpdateARV }: ARVCalculatorProps) {
  const colors = useThemeColors();
  const subjectSqft = property.square_feet || property.sqft || 0;
  const currentARV = property.arv;

  const stats = useMemo((): ARVStats | null => {
    if (comps.length === 0) return null;

    const prices: number[] = [];
    const pricesPerSqft: number[] = [];
    const adjustedPrices: number[] = [];

    comps.forEach(comp => {
      const price = comp.sold_price || comp.salePrice || 0;
      const sqft = comp.square_feet || comp.sqft || 0;

      if (price > 0) {
        prices.push(price);

        if (sqft > 0) {
          const pricePerSqft = price / sqft;
          pricesPerSqft.push(pricePerSqft);

          // Calculate size-adjusted price for subject property
          if (subjectSqft > 0) {
            const adjustedPrice = pricePerSqft * subjectSqft;
            adjustedPrices.push(adjustedPrice);
          }
        }
      }
    });

    if (prices.length === 0) return null;

    // Calculate averages
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const avgPricePerSqft = pricesPerSqft.length > 0
      ? pricesPerSqft.reduce((a, b) => a + b, 0) / pricesPerSqft.length
      : 0;

    // Calculate ARV (prefer adjusted prices if we have sqft data)
    let calculatedARV: number;
    if (adjustedPrices.length > 0) {
      calculatedARV = adjustedPrices.reduce((a, b) => a + b, 0) / adjustedPrices.length;
    } else {
      calculatedARV = avgPrice;
    }

    // Calculate range
    const sortedPrices = [...(adjustedPrices.length > 0 ? adjustedPrices : prices)].sort((a, b) => a - b);
    const lowARV = sortedPrices[0];
    const highARV = sortedPrices[sortedPrices.length - 1];

    // Calculate median
    const mid = Math.floor(sortedPrices.length / 2);
    const medianPrice = sortedPrices.length % 2 !== 0
      ? sortedPrices[mid]
      : (sortedPrices[mid - 1] + sortedPrices[mid]) / 2;

    return {
      avgPrice: Math.round(avgPrice),
      avgPricePerSqft: Math.round(avgPricePerSqft),
      calculatedARV: Math.round(calculatedARV),
      highARV: Math.round(highARV),
      lowARV: Math.round(lowARV),
      medianPrice: Math.round(medianPrice),
      totalComps: comps.length,
      validComps: prices.length,
    };
  }, [comps, subjectSqft]);

  if (!stats) {
    return (
      <View
        className="rounded-xl p-4"
        style={{ backgroundColor: withOpacity(colors.muted, 'opaque'), borderWidth: 1, borderColor: colors.border }}
      >
        <View className="flex-row items-center mb-2">
          <Calculator size={18} color={colors.mutedForeground} />
          <Text className="text-base font-semibold ml-2" style={{ color: colors.foreground }}>ARV Calculator</Text>
        </View>
        <Text className="text-sm" style={{ color: colors.mutedForeground }}>
          Add comparable properties to calculate the After Repair Value.
        </Text>
      </View>
    );
  }

  const arvDifference = currentARV ? stats.calculatedARV - currentARV : null;
  const arvChanged = arvDifference !== null && arvDifference !== 0;

  return (
    <View
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
    >
      {/* Header */}
      <View
        className="px-4 py-3"
        style={{ backgroundColor: withOpacity(colors.primary, 'subtle'), borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Calculator size={18} color={colors.primary} />
            <Text className="text-base font-semibold ml-2" style={{ color: colors.foreground }}>ARV Calculator</Text>
          </View>
          <View
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
          >
            <Text className="text-xs font-medium" style={{ color: colors.primary }}>
              {stats.validComps} comp{stats.validComps !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Calculated ARV */}
      <View className="p-4" style={{ backgroundColor: withOpacity(colors.primary, 'subtle') }}>
        <Text className="text-xs mb-1" style={{ color: colors.mutedForeground }}>Calculated ARV</Text>
        <Text className="text-3xl font-bold" style={{ color: colors.primary }}>
          {formatCurrency(stats.calculatedARV)}
        </Text>
        {subjectSqft > 0 && stats.avgPricePerSqft > 0 && (
          <Text className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
            Based on {formatCurrency(stats.avgPricePerSqft)}/sf × {formatNumber(subjectSqft)} sf
          </Text>
        )}
      </View>

      {/* Stats Grid */}
      <View className="p-4">
        <View className="flex-row flex-wrap gap-3">
          <View
            className="flex-1 min-w-[100] rounded-lg p-3"
            style={{ backgroundColor: withOpacity(colors.muted, 'opaque') }}
          >
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>Low</Text>
            <Text className="text-sm font-semibold" style={{ color: colors.foreground }}>
              {formatCurrency(stats.lowARV)}
            </Text>
          </View>
          <View
            className="flex-1 min-w-[100] rounded-lg p-3"
            style={{ backgroundColor: withOpacity(colors.muted, 'opaque') }}
          >
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>Median</Text>
            <Text className="text-sm font-semibold" style={{ color: colors.foreground }}>
              {formatCurrency(stats.medianPrice)}
            </Text>
          </View>
          <View
            className="flex-1 min-w-[100] rounded-lg p-3"
            style={{ backgroundColor: withOpacity(colors.muted, 'opaque') }}
          >
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>High</Text>
            <Text className="text-sm font-semibold" style={{ color: colors.foreground }}>
              {formatCurrency(stats.highARV)}
            </Text>
          </View>
        </View>

        {/* Price per sqft */}
        {stats.avgPricePerSqft > 0 && (
          <View
            className="mt-3 rounded-lg p-3"
            style={{ backgroundColor: withOpacity(colors.muted, 'opaque') }}
          >
            <View className="flex-row justify-between items-center">
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>Avg Price/SqFt</Text>
              <Text className="text-sm font-semibold" style={{ color: colors.foreground }}>
                {formatCurrency(stats.avgPricePerSqft)}/sf
              </Text>
            </View>
          </View>
        )}

        {/* Current vs Calculated */}
        {currentARV && arvChanged && (
          <View className="mt-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>Current ARV</Text>
              <Text className="text-sm font-medium" style={{ color: colors.foreground }}>
                {formatCurrency(currentARV)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>Difference</Text>
              <Text
                className="text-sm font-semibold"
                style={{ color: arvDifference && arvDifference > 0 ? colors.success : colors.destructive }}
              >
                {arvDifference && arvDifference > 0 ? '+' : ''}{formatCurrency(arvDifference || 0)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Update ARV Button */}
      {onUpdateARV && arvChanged && (
        <View className="px-4 pb-4">
          <TouchableOpacity
            onPress={() => onUpdateARV(stats.calculatedARV)}
            className="py-3 rounded-xl flex-row items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <TrendingUp size={18} color={colors.primaryForeground} />
            <Text className="font-semibold ml-2" style={{ color: colors.primaryForeground }}>
              Update ARV to {formatCurrency(stats.calculatedARV)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info Note */}
      <View className="px-4 pb-4">
        <View
          className="flex-row rounded-lg p-3"
          style={{ backgroundColor: withOpacity(colors.muted, 'opaque') }}
        >
          <Info size={14} color={colors.mutedForeground} className="mt-0.5" />
          <Text className="text-xs ml-2 flex-1" style={{ color: colors.mutedForeground }}>
            ARV is calculated using size-adjusted average price from comparable properties.
            Add more comps for a more accurate estimate.
          </Text>
        </View>
      </View>
    </View>
  );
}
