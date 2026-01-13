// src/features/real-estate/components/PropertyQuickStats.tsx
// Quick stats row for property details (beds, baths, sqft, year built)

import React from 'react';
import { View, Text } from 'react-native';
import { Bed, Bath, Square, Calendar } from 'lucide-react-native';
import { Property } from '../types';
import { formatNumber } from '../utils/formatters';

interface PropertyQuickStatsProps {
  property: Property;
  compact?: boolean;
}

export function PropertyQuickStats({ property, compact = false }: PropertyQuickStatsProps) {
  if (compact) {
    return (
      <View className="flex-row items-center gap-3 bg-muted rounded-lg px-3 py-2">
        <View className="flex-row items-center">
          <Bed size={14} className="text-muted-foreground" />
          <Text className="text-foreground text-sm ml-1 font-medium">
            {property.bedrooms ?? '-'}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Bath size={14} className="text-muted-foreground" />
          <Text className="text-foreground text-sm ml-1 font-medium">
            {property.bathrooms ?? '-'}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Square size={14} className="text-muted-foreground" />
          <Text className="text-foreground text-sm ml-1 font-medium">
            {property.square_feet ? formatNumber(property.square_feet) : '-'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row justify-around bg-muted rounded-xl p-4">
      <View className="items-center">
        <Bed size={24} className="text-primary mb-1" />
        <Text className="text-lg font-semibold text-foreground">
          {property.bedrooms ?? 'N/A'}
        </Text>
        <Text className="text-xs text-muted-foreground">Beds</Text>
      </View>
      <View className="items-center">
        <Bath size={24} className="text-primary mb-1" />
        <Text className="text-lg font-semibold text-foreground">
          {property.bathrooms ?? 'N/A'}
        </Text>
        <Text className="text-xs text-muted-foreground">Baths</Text>
      </View>
      <View className="items-center">
        <Square size={24} className="text-primary mb-1" />
        <Text className="text-lg font-semibold text-foreground">
          {property.square_feet ? formatNumber(property.square_feet) : 'N/A'}
        </Text>
        <Text className="text-xs text-muted-foreground">Sqft</Text>
      </View>
      <View className="items-center">
        <Calendar size={24} className="text-primary mb-1" />
        <Text className="text-lg font-semibold text-foreground">
          {property.year_built ?? 'N/A'}
        </Text>
        <Text className="text-xs text-muted-foreground">Built</Text>
      </View>
    </View>
  );
}
