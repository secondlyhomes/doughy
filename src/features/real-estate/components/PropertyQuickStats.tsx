// src/features/real-estate/components/PropertyQuickStats.tsx
// Quick stats row for property details (beds, baths, sqft, year built)

import React from 'react';
import { View, Text } from 'react-native';
import { Bed, Bath, Square, Calendar } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Property } from '../types';
import { formatNumber } from '../utils/formatters';

interface PropertyQuickStatsProps {
  property: Property;
  compact?: boolean;
}

export function PropertyQuickStats({ property, compact = false }: PropertyQuickStatsProps) {
  const colors = useThemeColors();

  if (compact) {
    return (
      <View className="flex-row items-center gap-3 rounded-lg px-3 py-2" style={{ backgroundColor: colors.muted }}>
        <View className="flex-row items-center">
          <Bed size={14} color={colors.mutedForeground} />
          <Text className="text-sm ml-1 font-medium" style={{ color: colors.foreground }}>
            {property.bedrooms ?? '-'}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Bath size={14} color={colors.mutedForeground} />
          <Text className="text-sm ml-1 font-medium" style={{ color: colors.foreground }}>
            {property.bathrooms ?? '-'}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Square size={14} color={colors.mutedForeground} />
          <Text className="text-sm ml-1 font-medium" style={{ color: colors.foreground }}>
            {property.square_feet ? formatNumber(property.square_feet) : '-'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row justify-around rounded-xl p-4" style={{ backgroundColor: colors.muted }}>
      <View className="items-center">
        <Bed size={24} color={colors.primary} style={{ marginBottom: 4 }} />
        <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
          {property.bedrooms ?? 'N/A'}
        </Text>
        <Text className="text-xs" style={{ color: colors.mutedForeground }}>Beds</Text>
      </View>
      <View className="items-center">
        <Bath size={24} color={colors.primary} style={{ marginBottom: 4 }} />
        <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
          {property.bathrooms ?? 'N/A'}
        </Text>
        <Text className="text-xs" style={{ color: colors.mutedForeground }}>Baths</Text>
      </View>
      <View className="items-center">
        <Square size={24} color={colors.primary} style={{ marginBottom: 4 }} />
        <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
          {property.square_feet ? formatNumber(property.square_feet) : 'N/A'}
        </Text>
        <Text className="text-xs" style={{ color: colors.mutedForeground }}>Sqft</Text>
      </View>
      <View className="items-center">
        <Calendar size={24} color={colors.primary} style={{ marginBottom: 4 }} />
        <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
          {property.year_built ?? 'N/A'}
        </Text>
        <Text className="text-xs" style={{ color: colors.mutedForeground }}>Built</Text>
      </View>
    </View>
  );
}
