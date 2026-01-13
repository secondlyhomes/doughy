// src/features/real-estate/components/ARVCalculator.tsx
// ARV (After Repair Value) calculator based on comparable properties

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  TrendingUp,
  Calculator,
  Info,
  ChevronRight,
  Check,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
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
      <View className="bg-muted/50 rounded-xl p-4 border border-border">
        <View className="flex-row items-center mb-2">
          <Calculator size={18} className="text-muted-foreground" />
          <Text className="text-base font-semibold text-foreground ml-2">ARV Calculator</Text>
        </View>
        <Text className="text-sm text-muted-foreground">
          Add comparable properties to calculate the After Repair Value.
        </Text>
      </View>
    );
  }

  const arvDifference = currentARV ? stats.calculatedARV - currentARV : null;
  const arvChanged = arvDifference !== null && arvDifference !== 0;

  return (
    <View className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <View className="px-4 py-3 bg-primary/5 border-b border-border">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Calculator size={18} className="text-primary" />
            <Text className="text-base font-semibold text-foreground ml-2">ARV Calculator</Text>
          </View>
          <View className="bg-primary/10 px-2 py-1 rounded-full">
            <Text className="text-xs font-medium text-primary">
              {stats.validComps} comp{stats.validComps !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Calculated ARV */}
      <View className="p-4 bg-primary/5">
        <Text className="text-xs text-muted-foreground mb-1">Calculated ARV</Text>
        <Text className="text-3xl font-bold text-primary">
          {formatCurrency(stats.calculatedARV)}
        </Text>
        {subjectSqft > 0 && stats.avgPricePerSqft > 0 && (
          <Text className="text-sm text-muted-foreground mt-1">
            Based on {formatCurrency(stats.avgPricePerSqft)}/sf × {formatNumber(subjectSqft)} sf
          </Text>
        )}
      </View>

      {/* Stats Grid */}
      <View className="p-4">
        <View className="flex-row flex-wrap gap-3">
          <View className="flex-1 min-w-[100] bg-muted/50 rounded-lg p-3">
            <Text className="text-xs text-muted-foreground">Low</Text>
            <Text className="text-sm font-semibold text-foreground">
              {formatCurrency(stats.lowARV)}
            </Text>
          </View>
          <View className="flex-1 min-w-[100] bg-muted/50 rounded-lg p-3">
            <Text className="text-xs text-muted-foreground">Median</Text>
            <Text className="text-sm font-semibold text-foreground">
              {formatCurrency(stats.medianPrice)}
            </Text>
          </View>
          <View className="flex-1 min-w-[100] bg-muted/50 rounded-lg p-3">
            <Text className="text-xs text-muted-foreground">High</Text>
            <Text className="text-sm font-semibold text-foreground">
              {formatCurrency(stats.highARV)}
            </Text>
          </View>
        </View>

        {/* Price per sqft */}
        {stats.avgPricePerSqft > 0 && (
          <View className="mt-3 bg-muted/50 rounded-lg p-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted-foreground">Avg Price/SqFt</Text>
              <Text className="text-sm font-semibold text-foreground">
                {formatCurrency(stats.avgPricePerSqft)}/sf
              </Text>
            </View>
          </View>
        )}

        {/* Current vs Calculated */}
        {currentARV && arvChanged && (
          <View className="mt-4 pt-4 border-t border-border">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm text-muted-foreground">Current ARV</Text>
              <Text className="text-sm font-medium text-foreground">
                {formatCurrency(currentARV)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted-foreground">Difference</Text>
              <Text className={`text-sm font-semibold ${arvDifference && arvDifference > 0 ? 'text-success' : 'text-destructive'}`}>
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
            className="bg-primary py-3 rounded-xl flex-row items-center justify-center"
          >
            <TrendingUp size={18} color={colors.primaryForeground} />
            <Text className="text-primary-foreground font-semibold ml-2">
              Update ARV to {formatCurrency(stats.calculatedARV)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info Note */}
      <View className="px-4 pb-4">
        <View className="flex-row bg-muted/50 rounded-lg p-3">
          <Info size={14} className="text-muted-foreground mt-0.5" />
          <Text className="text-xs text-muted-foreground ml-2 flex-1">
            ARV is calculated using size-adjusted average price from comparable properties.
            Add more comps for a more accurate estimate.
          </Text>
        </View>
      </View>
    </View>
  );
}
