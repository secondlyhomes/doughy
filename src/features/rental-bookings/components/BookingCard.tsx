// src/features/rental-bookings/components/BookingCard.tsx
// Card component for displaying booking details with status badge

import React from 'react';
import { View, Text } from 'react-native';
import {
  Calendar,
  User,
  Home,
  DollarSign,
  ChevronRight,
  Clock,
  BedDouble,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { DataCard, DataCardField } from '@/components/ui';
import { BookingWithRelations, BookingStatus, BookingType, RateType } from '../types';

interface BookingCardProps {
  booking: BookingWithRelations;
  onPress: () => void;
  /** Card variant: 'default' for solid, 'glass' for glass effect */
  variant?: 'default' | 'glass';
  /** Blur intensity for glass variant (0-100). Default: 55 */
  glassIntensity?: number;
}

// Format date to readable string
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format date range
function formatDateRange(startDate: string, endDate: string | null): string {
  const start = formatDate(startDate);
  if (!endDate) {
    return `${start} - Ongoing`;
  }
  const end = formatDate(endDate);
  return `${start} - ${end}`;
}

// Format currency
function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format rate with type
function formatRate(rate: number, rateType: RateType): string {
  const amount = formatCurrency(rate);
  const suffix: Record<RateType, string> = {
    nightly: '/night',
    weekly: '/week',
    monthly: '/mo',
  };
  return `${amount}${suffix[rateType]}`;
}

// Get status badge variant
function getStatusVariant(status: BookingStatus) {
  switch (status) {
    case 'inquiry':
      return 'info' as const;
    case 'pending':
      return 'warning' as const;
    case 'confirmed':
      return 'success' as const;
    case 'active':
      return 'default' as const;
    case 'completed':
      return 'inactive' as const;
    case 'cancelled':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
}

// Format status for display
function formatStatus(status: BookingStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// Format booking type for display
function formatBookingType(type: BookingType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function BookingCard({
  booking,
  onPress,
  variant = 'default',
  glassIntensity = 55,
}: BookingCardProps) {
  const colors = useThemeColors();

  // Build title - guest name or "No Guest"
  const guestName = booking.contact
    ? `${booking.contact.first_name || ''} ${booking.contact.last_name || ''}`.trim() || 'No Guest Assigned'
    : 'No Guest Assigned';

  // Build subtitle - property name
  const propertyName = booking.property?.name || booking.property?.address || 'No Property';

  // Build fields array
  const fields: DataCardField[] = [
    // Dates
    {
      icon: Calendar,
      value: formatDateRange(booking.start_date, booking.end_date),
    },
    // Property/Room
    ...(booking.room?.name
      ? [
          {
            icon: BedDouble,
            value: booking.room.name,
          },
        ]
      : []),
    // Rate
    {
      icon: DollarSign,
      value: formatRate(booking.rate, booking.rate_type),
      valueColor: colors.success,
    },
  ];

  // Build badges array
  const badges = [
    {
      label: formatBookingType(booking.booking_type),
      variant: booking.booking_type === 'lease' ? ('secondary' as const) : ('outline' as const),
      size: 'sm' as const,
    },
  ];

  // Calculate days until check-in or days remaining
  const getDaysInfo = (): string | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(booking.start_date);
    startDate.setHours(0, 0, 0, 0);

    if (booking.status === 'active' && booking.end_date) {
      const endDate = new Date(booking.end_date);
      endDate.setHours(0, 0, 0, 0);
      const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysRemaining >= 0) {
        return `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;
      }
    }

    if (['confirmed', 'pending'].includes(booking.status)) {
      const daysUntil = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil === 0) return 'Check-in today';
      if (daysUntil === 1) return 'Check-in tomorrow';
      if (daysUntil > 0 && daysUntil <= 7) return `Check-in in ${daysUntil} days`;
    }

    return null;
  };

  const daysInfo = getDaysInfo();

  return (
    <DataCard
      onPress={onPress}
      variant={variant}
      glassIntensity={glassIntensity}
      title={guestName}
      subtitle={propertyName}
      headerIcon={User}
      headerBadge={{
        label: formatStatus(booking.status),
        variant: getStatusVariant(booking.status),
        size: 'sm',
      }}
      headerRight={<ChevronRight size={20} color={colors.mutedForeground} />}
      fields={fields}
      badges={badges}
      footerContent={
        <View className="flex-row items-center justify-between mb-2">
          {/* Total amount */}
          {booking.total_amount !== null && (
            <View className="flex-row items-center">
              <Text className="text-sm font-medium" style={{ color: colors.success }}>
                {formatCurrency(booking.total_amount)}
              </Text>
              <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>
                total
              </Text>
            </View>
          )}

          {/* Days info */}
          {daysInfo && (
            <View className="flex-row items-center">
              <Clock size={12} color={colors.info} style={{ marginRight: 4 }} />
              <Text className="text-xs" style={{ color: colors.info }}>
                {daysInfo}
              </Text>
            </View>
          )}
        </View>
      }
    />
  );
}

export default BookingCard;
