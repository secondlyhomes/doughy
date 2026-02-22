// src/features/rental-properties/components/PropertyStatsRow.tsx
// Horizontal row of property stats: bedrooms, bathrooms, sqft, and rental type badge

import React from 'react';
import { View, Text } from 'react-native';
import { Bed, Bath, Maximize2 } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FONT_SIZES } from '@/constants/design-tokens';
import { Badge } from '@/components/ui';
import { RentalType } from '../types';

interface PropertyStatsRowProps {
  bedrooms: number;
  bathrooms: number;
  sqft: number | null;
  rentalType: RentalType;
}

// Helper to format rental type display
function formatRentalType(type: RentalType): string {
  switch (type) {
    case 'str':
      return 'STR';
    case 'mtr':
      return 'MTR';
    case 'ltr':
      return 'LTR';
    default:
      return String(type).toUpperCase();
  }
}

// Helper to get badge variant based on rental type
function getRentalTypeBadgeVariant(type: RentalType): 'info' | 'warning' | 'success' {
  switch (type) {
    case 'str':
      return 'info'; // Short-term: blue
    case 'mtr':
      return 'warning'; // Mid-term: orange/yellow
    case 'ltr':
      return 'success'; // Long-term: green
    default:
      return 'info';
  }
}

// Format square feet with K suffix for thousands
function formatSqft(sqft: number | null): string {
  if (!sqft) return '-';
  if (sqft >= 1000) {
    return `${(sqft / 1000).toFixed(1)}K`;
  }
  return sqft.toLocaleString();
}

interface StatItemProps {
  icon: React.ElementType;
  value: string;
  label: string;
}

function StatItem({ icon: Icon, value, label }: StatItemProps) {
  const colors = useThemeColors();

  return (
    <View className="items-center">
      <View className="flex-row items-center gap-1">
        <Icon size={16} color={colors.mutedForeground} />
        <Text
          style={{ color: colors.foreground, fontSize: FONT_SIZES.base, fontWeight: '600' }}
        >
          {value}
        </Text>
      </View>
      <Text
        style={{ color: colors.mutedForeground, fontSize: FONT_SIZES['2xs'], marginTop: 2 }}
      >
        {label}
      </Text>
    </View>
  );
}

export function PropertyStatsRow({
  bedrooms,
  bathrooms,
  sqft,
  rentalType,
}: PropertyStatsRowProps) {
  const colors = useThemeColors();

  return (
    <View
      className="flex-row items-center justify-between px-4 py-3 rounded-xl"
      style={{ backgroundColor: colors.card }}
    >
      <StatItem icon={Bed} value={String(bedrooms)} label="Beds" />

      <View
        style={{
          width: 1,
          height: 32,
          backgroundColor: colors.border,
        }}
      />

      <StatItem icon={Bath} value={String(bathrooms)} label="Baths" />

      <View
        style={{
          width: 1,
          height: 32,
          backgroundColor: colors.border,
        }}
      />

      <StatItem icon={Maximize2} value={formatSqft(sqft)} label="Sq Ft" />

      <View
        style={{
          width: 1,
          height: 32,
          backgroundColor: colors.border,
        }}
      />

      <View className="items-center">
        <Badge variant={getRentalTypeBadgeVariant(rentalType)} size="sm">
          {formatRentalType(rentalType)}
        </Badge>
        <Text
          style={{ color: colors.mutedForeground, fontSize: FONT_SIZES['2xs'], marginTop: 4 }}
        >
          Type
        </Text>
      </View>
    </View>
  );
}

export default PropertyStatsRow;
