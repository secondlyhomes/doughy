// src/features/rental-bookings/components/BookingTimeline.tsx
// Visual timeline of booking status progression

import React from 'react';
import { View, Text } from 'react-native';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  Home,
  LogOut,
  XCircle,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ICON_SIZES } from '@/constants/design-tokens';
import { BookingStatus, BookingWithRelations } from '../types';

// Status step configuration
interface StatusStep {
  status: BookingStatus;
  label: string;
  icon: typeof MessageSquare;
  colorKey: 'info' | 'warning' | 'mutedForeground' | 'success' | 'primary' | 'destructive';
}

const STATUS_STEPS: StatusStep[] = [
  { status: 'inquiry', label: 'Inquiry', icon: MessageSquare, colorKey: 'info' },
  { status: 'pending', label: 'Pending', icon: Clock, colorKey: 'warning' },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle, colorKey: 'success' },
  { status: 'active', label: 'Active', icon: Home, colorKey: 'primary' },
  { status: 'completed', label: 'Completed', icon: LogOut, colorKey: 'mutedForeground' },
];

// Status order for progression
const STATUS_ORDER: Record<BookingStatus, number> = {
  inquiry: 0,
  pending: 1,
  confirmed: 2,
  active: 3,
  completed: 4,
  cancelled: -1, // Special case
};

export interface BookingTimelineProps {
  /** The booking to display timeline for */
  booking: BookingWithRelations;
  /** Show detailed timestamps */
  showTimestamps?: boolean;
}

// Format date for display
function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function BookingTimeline({
  booking,
  showTimestamps = true,
}: BookingTimelineProps) {
  const colors = useThemeColors();

  // Handle cancelled status specially
  if (booking.status === 'cancelled') {
    return (
      <View className="p-4 rounded-xl" style={{ backgroundColor: colors.card }}>
        <Text className="text-lg font-semibold mb-4" style={{ color: colors.foreground }}>
          Booking Status
        </Text>
        <View
          className="flex-row items-center p-4 rounded-xl"
          style={{ backgroundColor: withOpacity(colors.destructive, 'muted') }}
        >
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: withOpacity(colors.destructive, 'medium') }}
          >
            <XCircle size={ICON_SIZES.xl} color={colors.destructive} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold" style={{ color: colors.destructive }}>
              Cancelled
            </Text>
            {booking.cancelled_at && (
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                {formatDateTime(booking.cancelled_at)}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  const currentOrder = STATUS_ORDER[booking.status];

  return (
    <View className="p-4 rounded-xl" style={{ backgroundColor: colors.card }}>
      <Text className="text-lg font-semibold mb-4" style={{ color: colors.foreground }}>
        Booking Status
      </Text>

      {STATUS_STEPS.map((step, index) => {
        const stepOrder = STATUS_ORDER[step.status];
        const isComplete = stepOrder < currentOrder;
        const isCurrent = step.status === booking.status;
        const isUpcoming = stepOrder > currentOrder;

        const Icon = step.icon;
        const color = isComplete
          ? colors.success
          : isCurrent
          ? colors[step.colorKey]
          : colors.border;

        const bgColor = isComplete
          ? withOpacity(colors.success, 'medium')
          : isCurrent
          ? withOpacity(colors[step.colorKey], 'medium')
          : colors.muted;

        // Get timestamp for this step
        let timestamp: string | null = null;
        if (step.status === 'inquiry' && booking.created_at) {
          timestamp = booking.created_at;
        } else if (step.status === 'confirmed' && booking.confirmed_at) {
          timestamp = booking.confirmed_at;
        } else if (step.status === 'active' && isCurrent && booking.start_date) {
          timestamp = booking.start_date;
        } else if (step.status === 'completed' && isCurrent && booking.end_date) {
          timestamp = booking.end_date;
        }

        const isLast = index === STATUS_STEPS.length - 1;

        return (
          <View key={step.status} className="flex-row items-start">
            {/* Timeline node and connector */}
            <View className="items-center">
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{
                  backgroundColor: bgColor,
                  borderWidth: isCurrent ? 2 : 0,
                  borderColor: isCurrent ? color : 'transparent',
                }}
              >
                <Icon size={ICON_SIZES.lg} color={color} />
              </View>
              {!isLast && (
                <View
                  className="w-0.5 h-8 my-1"
                  style={{
                    backgroundColor: isComplete ? colors.success : colors.border,
                  }}
                />
              )}
            </View>

            {/* Step content */}
            <View className="ml-3 flex-1 pt-2 pb-4">
              <Text
                className={`text-sm ${isCurrent ? 'font-semibold' : 'font-medium'}`}
                style={{
                  color: isUpcoming ? colors.mutedForeground : color,
                }}
              >
                {step.label}
              </Text>
              {showTimestamps && timestamp && (isComplete || isCurrent) && (
                <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                  {step.status === 'active' || step.status === 'completed'
                    ? formatDate(timestamp)
                    : formatDateTime(timestamp)}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default BookingTimeline;
