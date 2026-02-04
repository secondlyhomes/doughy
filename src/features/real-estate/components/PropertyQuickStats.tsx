// src/features/real-estate/components/PropertyQuickStats.tsx
// Quick stats row for property details (beds, baths, sqft, year built)

import React from 'react';
import { View, Text } from 'react-native';
import { Bed, Bath, Square, Calendar } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Property } from '../types';
import { formatNumber } from '../utils/formatters';

/** Stats data for rental properties (no year_built) */
interface RentalStats {
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
}

interface PropertyQuickStatsProps {
  property?: Property;
  /** For rental properties - simplified stats without year_built */
  rentalStats?: RentalStats;
  /** 'inline' (default): "3 bd · 2 ba · 1,500 sqft · yr 1985" */
  /** 'icons': Small icons with values in a row */
  /** 'full': Large icons with labels in columns */
  /** 'overlay': White text for use on dark image gradients */
  /** 'rental': For rental properties without year_built */
  variant?: 'inline' | 'icons' | 'full' | 'overlay' | 'rental';
}

export function PropertyQuickStats({ property, rentalStats, variant = 'inline' }: PropertyQuickStatsProps) {
  const colors = useThemeColors();

  // Get stats from either property or rentalStats
  const bedrooms = rentalStats?.bedrooms ?? property?.bedrooms;
  const bathrooms = rentalStats?.bathrooms ?? property?.bathrooms;
  const square_feet = rentalStats?.square_feet ?? property?.square_feet;
  const year_built = property?.year_built;

  // Build stats array for inline format
  const stats: string[] = [];
  if (bedrooms != null) stats.push(`${bedrooms} bd`);
  if (bathrooms != null) stats.push(`${bathrooms} ba`);
  if (square_feet != null) stats.push(`${formatNumber(square_feet)} sqft`);
  if (year_built != null && variant !== 'rental') stats.push(`yr ${year_built}`);

  // Overlay variant - white text for dark image gradients
  if (variant === 'overlay') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Bed size={14} color="white" />
          <Text style={{ fontSize: 14, marginLeft: 4, color: 'white', fontWeight: '500' }}>
            {bedrooms ?? '-'}
          </Text>
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.7)' }}>·</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Bath size={14} color="white" />
          <Text style={{ fontSize: 14, marginLeft: 4, color: 'white', fontWeight: '500' }}>
            {bathrooms ?? '-'}
          </Text>
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.7)' }}>·</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Square size={14} color="white" />
          <Text style={{ fontSize: 14, marginLeft: 4, color: 'white', fontWeight: '500' }}>
            {square_feet ? formatNumber(square_feet) : '-'} sqft
          </Text>
        </View>
      </View>
    );
  }

  // Rental variant - similar to inline but without year_built
  if (variant === 'rental') {
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
            {bedrooms ?? '-'}
          </Text>
        </View>
        <Text style={{ color: colors.mutedForeground }}>·</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Bath size={14} color={colors.mutedForeground} />
          <Text style={{ fontSize: 14, marginLeft: 4, color: colors.mutedForeground }}>
            {bathrooms ?? '-'}
          </Text>
        </View>
        <Text style={{ color: colors.mutedForeground }}>·</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Square size={14} color={colors.mutedForeground} />
          <Text style={{ fontSize: 14, marginLeft: 4, color: colors.mutedForeground }}>
            {square_feet ? formatNumber(square_feet) : '-'} sqft
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
            {bedrooms ?? '-'}
          </Text>
        </View>
        <Text style={{ color: colors.mutedForeground }}>·</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Bath size={14} color={colors.mutedForeground} />
          <Text style={{ fontSize: 14, marginLeft: 4, color: colors.mutedForeground }}>
            {bathrooms ?? '-'}
          </Text>
        </View>
        <Text style={{ color: colors.mutedForeground }}>·</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Square size={14} color={colors.mutedForeground} />
          <Text style={{ fontSize: 14, marginLeft: 4, color: colors.mutedForeground }}>
            {square_feet ? formatNumber(square_feet) : '-'} sqft
          </Text>
        </View>
        <Text style={{ color: colors.mutedForeground }}>·</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Calendar size={14} color={colors.mutedForeground} />
          <Text style={{ fontSize: 14, marginLeft: 4, color: colors.mutedForeground }}>
            {year_built ?? '-'}
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
            {bedrooms ?? '-'}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Bath size={14} color={colors.mutedForeground} />
          <Text className="text-sm ml-1 font-medium" style={{ color: colors.foreground }}>
            {bathrooms ?? '-'}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Square size={14} color={colors.mutedForeground} />
          <Text className="text-sm ml-1 font-medium" style={{ color: colors.foreground }}>
            {square_feet ? formatNumber(square_feet) : '-'}
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
          {bedrooms ?? 'N/A'}
        </Text>
        <Text className="text-xs" style={{ color: colors.mutedForeground }}>Beds</Text>
      </View>
      <View className="items-center">
        <Bath size={24} color={colors.primary} style={{ marginBottom: 4 }} />
        <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
          {bathrooms ?? 'N/A'}
        </Text>
        <Text className="text-xs" style={{ color: colors.mutedForeground }}>Baths</Text>
      </View>
      <View className="items-center">
        <Square size={24} color={colors.primary} style={{ marginBottom: 4 }} />
        <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
          {square_feet ? formatNumber(square_feet) : 'N/A'}
        </Text>
        <Text className="text-xs" style={{ color: colors.mutedForeground }}>Sqft</Text>
      </View>
      <View className="items-center">
        <Calendar size={24} color={colors.primary} style={{ marginBottom: 4 }} />
        <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
          {year_built ?? 'N/A'}
        </Text>
        <Text className="text-xs" style={{ color: colors.mutedForeground }}>Built</Text>
      </View>
    </View>
  );
}
