// src/features/rental-properties/screens/rental-properties-list/PropertyListItem.tsx
// List item component for rendering a rental property card

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { PropertyImageCard } from '@/components/ui';
import { formatCurrency } from '@/utils/format';
import { RENTAL_TYPE_BADGES } from './constants';
import type { RentalPropertyWithRooms } from './types';

interface PropertyListItemProps {
  property: RentalPropertyWithRooms;
  onPress: () => void;
}

export function PropertyListItem({ property, onPress }: PropertyListItemProps) {
  const colors = useThemeColors();

  // Badge based on rental type
  const rentalTypeBadge =
    RENTAL_TYPE_BADGES[property.rental_type] || RENTAL_TYPE_BADGES.ltr;

  // Format rate with period label
  const rateLabel =
    property.rate_type === 'nightly'
      ? '/night'
      : property.rate_type === 'weekly'
        ? '/week'
        : '/mo';

  // Build occupancy footer for room-by-room properties
  const occupancyFooter =
    property.is_room_by_room_enabled && property.rooms_count > 0 ? (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.muted,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              borderRadius: 3,
              width: `${(property.occupied_rooms / property.rooms_count) * 100}%`,
              backgroundColor:
                property.occupied_rooms === property.rooms_count
                  ? colors.success
                  : colors.primary,
            }}
          />
        </View>
        <Text
          style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '500' }}
        >
          {property.occupied_rooms}/{property.rooms_count}
        </Text>
      </View>
    ) : undefined;

  return (
    <PropertyImageCard
      imageUrl={property.primary_image_url}
      badgeOverlay={rentalTypeBadge}
      title={property.name}
      subtitle={`${property.city}, ${property.state}`}
      metrics={[
        {
          label: 'Rate',
          value: `${formatCurrency(property.base_rate)}${rateLabel}`,
          color: colors.success,
        },
        { label: 'Beds', value: String(property.bedrooms) },
        { label: 'Baths', value: String(property.bathrooms) },
      ]}
      footerContent={occupancyFooter}
      onPress={onPress}
      variant="glass"
    />
  );
}
