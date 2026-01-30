// src/features/rental-properties/components/RentalPropertyCard.tsx
// Card component for displaying rental property details
// Follows the pattern from src/features/leads/components/LeadCard.tsx

import React from 'react';
import { View, Text } from 'react-native';
import {
  Home,
  Bed,
  Bath,
  DollarSign,
  MapPin,
  ChevronRight,
  Users,
  LayoutGrid,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { DataCard, DataCardField } from '@/components/ui';
import { RentalProperty, RentalType, PropertyStatus } from '../types';

interface RentalPropertyCardProps {
  property: RentalProperty;
  onPress: () => void;
  /** Number of linked rooms (for room-by-room properties) */
  roomsCount?: number;
  /** Number of currently occupied rooms */
  occupiedRooms?: number;
  /** Card variant: 'default' for solid, 'glass' for glass effect */
  variant?: 'default' | 'glass';
  /** Blur intensity for glass variant (0-100). Default: 55 */
  glassIntensity?: number;
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

// Helper to get status badge variant
function getStatusBadgeVariant(
  status: PropertyStatus
): 'success' | 'secondary' | 'warning' | 'default' {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'secondary';
    case 'maintenance':
      return 'warning';
    default:
      return 'default';
  }
}

// Helper to format rate display
function formatRate(baseRate: number, rateType: string): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(baseRate);

  // Database only has: nightly, weekly, monthly (no 'yearly')
  const suffix = {
    nightly: '/night',
    weekly: '/week',
    monthly: '/mo',
  }[rateType] || '/mo';

  return `${formatted}${suffix}`;
}

// Helper to format status display
function formatStatus(status: PropertyStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function RentalPropertyCard({
  property,
  onPress,
  roomsCount,
  occupiedRooms,
  variant = 'default',
  glassIntensity = 55,
}: RentalPropertyCardProps) {
  const colors = useThemeColors();

  // Build fields array from property data
  const fields: DataCardField[] = [
    // Location
    {
      icon: MapPin,
      value: `${property.city}, ${property.state}`,
    },
    // Bedrooms
    {
      icon: Bed,
      value: `${property.bedrooms} bed`,
    },
    // Bathrooms
    {
      icon: Bath,
      value: `${property.bathrooms} bath`,
    },
  ];

  // Add room count if room-by-room is enabled
  if (property.is_room_by_room_enabled && roomsCount !== undefined) {
    fields.push({
      icon: LayoutGrid,
      value: `${roomsCount} rooms`,
    });
  }

  // Build badges array
  const badges = [
    // Status badge (if not active)
    ...(property.status !== 'active'
      ? [
          {
            label: formatStatus(property.status),
            variant: getStatusBadgeVariant(property.status) as 'success' | 'secondary' | 'warning' | 'default',
            size: 'sm' as const,
          },
        ]
      : []),
  ];

  // Occupancy info for footer (if room-by-room)
  const showOccupancy =
    property.is_room_by_room_enabled &&
    roomsCount !== undefined &&
    occupiedRooms !== undefined &&
    roomsCount > 0;

  const occupancyPercentage = showOccupancy
    ? Math.round((occupiedRooms! / roomsCount!) * 100)
    : 0;

  return (
    <DataCard
      onPress={onPress}
      variant={variant}
      glassIntensity={glassIntensity}
      title={property.name}
      subtitle={property.address}
      headerIcon={Home}
      headerBadge={{
        label: formatRentalType(property.rental_type),
        variant: getRentalTypeBadgeVariant(property.rental_type),
        size: 'sm',
      }}
      headerRight={<ChevronRight size={20} color={colors.mutedForeground} />}
      highlightLabel="Base Rate"
      highlightValue={formatRate(property.base_rate, property.rate_type)}
      highlightColor={colors.success}
      fields={fields}
      badges={badges}
      footerContent={
        showOccupancy ? (
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Users size={14} color={colors.mutedForeground} />
              <Text
                className="text-sm ml-1"
                style={{ color: colors.mutedForeground }}
              >
                Occupancy
              </Text>
            </View>
            <Text
              className="text-sm font-medium"
              style={{
                color:
                  occupancyPercentage >= 80
                    ? colors.success
                    : occupancyPercentage >= 50
                    ? colors.warning
                    : colors.destructive,
              }}
            >
              {occupiedRooms}/{roomsCount} ({occupancyPercentage}%)
            </Text>
          </View>
        ) : undefined
      }
    />
  );
}

export default RentalPropertyCard;
