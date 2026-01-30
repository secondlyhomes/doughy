// src/features/real-estate/components/PropertyQuickStats.tsx
// Quick stats row for property details (beds, baths, sqft, year built)

import React from 'react';
import { View, Text } from 'react-native';
import { Bed, Bath, Square, Calendar } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Property } from '../types';
import { formatNumber } from '../utils/formatters';

interface PropertyQuickStatsProps {
  property: Property;
  /** 'inline' (default): "3 bd · 2 ba · 1,500 sqft · yr 1985" */
  /** 'icons': Small icons with values in a row */
  /** 'full': Large icons with labels in columns */
  /** 'overlay': White text for use on dark image gradients */
  variant?: 'inline' | 'icons' | 'full' | 'overlay';
}

export function PropertyQuickStats({ property, variant = 'inline' }: PropertyQuickStatsProps) {
  const colors = useThemeColors();

  // Build stats array for inline format
  const stats: string[] = [];
  if (property.bedrooms != null) stats.push(`${property.bedrooms} bd`);
  if (property.bathrooms != null) stats.push(`${property.bathrooms} ba`);
  if (property.square_feet != null) stats.push(`${formatNumber(property.square_feet)} sqft`);
  if (property.year_built != null) stats.push(`yr ${property.year_built}`);

  // Overlay variant - white text for dark image gradients
  if (variant === 'overlay') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Bed size={14} color="white" />
          <Text style={{ fontSize: 14, marginLeft: 4, color: 'white', fontWeight: '500' }}>
            {property.bedrooms ?? '-'}
          </Text>
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.7)' }}>·</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Bath size={14} color="white" />
          <Text style={{ fontSize: 14, marginLeft: 4, color: 'white', fontWeight: '500' }}>
            {property.bathrooms ?? '-'}
          </Text>
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.7)' }}>·</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Square size={14} color="white" />
          <Text style={{ fontSize: 14, marginLeft: 4, color: 'white', fontWeight: '500' }}>
            {property.square_feet ? formatNumber(property.square_feet) : '-'} sqft
          </Text>
        </View>
      </View>
    );
  }

  if (variant === 'inline') {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          paddingVertical: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Bed size={14} color={colors.mutedForeground} />
          <Text style={{ fontSize: 14, marginLeft: 4, color: colors.mutedForeground }}>
            {property.bedrooms ?? '-'}
          </Text>
        </View>
        <Text style={{ color: colors.mutedForeground }}>·</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Bath size={14} color={colors.mutedForeground} />
          <Text style={{ fontSize: 14, marginLeft: 4, color: colors.mutedForeground }}>
            {property.bathrooms ?? '-'}
          </Text>
        </View>
        <Text style={{ color: colors.mutedForeground }}>·</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Square size={14} color={colors.mutedForeground} />
          <Text style={{ fontSize: 14, marginLeft: 4, color: colors.mutedForeground }}>
            {property.square_feet ? formatNumber(property.square_feet) : '-'} sqft
          </Text>
        </View>
        <Text style={{ color: colors.mutedForeground }}>·</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Calendar size={14} color={colors.mutedForeground} />
          <Text style={{ fontSize: 14, marginLeft: 4, color: colors.mutedForeground }}>
            {property.year_built ?? '-'}
          </Text>
        </View>
      </View>
    );
  }

  if (variant === 'icons') {
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

  // variant === 'full'
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
