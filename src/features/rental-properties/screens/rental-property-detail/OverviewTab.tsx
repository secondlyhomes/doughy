// src/features/rental-properties/screens/rental-property-detail/OverviewTab.tsx
// Overview tab content for rental property detail screen

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, ExternalLink } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, FONT_SIZES, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { PropertyHubGrid } from '../../components/PropertyHubGrid';
import { AmenityChip } from './AmenityChip';
import type { RentalProperty } from '../../types';

export interface OverviewTabProps {
  property: RentalProperty;
  propertyId: string;
  maintenanceCount: number;
  vendorCount: number;
  nextTurnover: string | undefined;
  bookingsCount: number;
  isLoadingHubCounts: boolean;
  onOpenMap: () => void;
}

export function OverviewTab({
  property,
  propertyId,
  maintenanceCount,
  vendorCount,
  nextTurnover,
  bookingsCount,
  isLoadingHubCounts,
  onOpenMap,
}: OverviewTabProps) {
  const colors = useThemeColors();

  return (
    <>
      {/* Property Management Hub Grid (2x2) */}
      <PropertyHubGrid
        propertyId={propertyId}
        maintenanceCount={maintenanceCount}
        vendorCount={vendorCount}
        nextTurnover={nextTurnover}
        bookingsCount={bookingsCount}
        isLoading={isLoadingHubCounts}
        variant="glass"
      />

      {/* Address Card (always visible) */}
      <TouchableOpacity
        onPress={onOpenMap}
        className="p-4 rounded-xl flex-row items-center justify-between mb-4"
        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        activeOpacity={PRESS_OPACITY.DEFAULT}
      >
        <View className="flex-row items-center flex-1">
          <MapPin size={ICON_SIZES.lg} color={colors.primary} />
          <View className="ml-3 flex-1">
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.base,
                fontWeight: '500',
              }}
              numberOfLines={1}
            >
              {property.address}
            </Text>
            <Text
              style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm }}
              numberOfLines={1}
            >
              {property.city}, {property.state} {property.zip || ''}
            </Text>
          </View>
        </View>
        <ExternalLink size={ICON_SIZES.ml} color={colors.mutedForeground} />
      </TouchableOpacity>

      {/* Amenities (always visible) */}
      {property.amenities && property.amenities.length > 0 && (
        <View className="mb-4">
          <Text
            style={{
              color: colors.foreground,
              fontSize: FONT_SIZES.lg,
              fontWeight: '600',
              marginBottom: SPACING.sm,
            }}
          >
            Amenities
          </Text>
          <View className="flex-row flex-wrap">
            {property.amenities.map((amenity, index) => (
              <AmenityChip key={index} amenity={amenity} />
            ))}
          </View>
        </View>
      )}
    </>
  );
}
