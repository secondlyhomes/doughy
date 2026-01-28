// src/features/rental-bookings/screens/BookingDetailScreen.tsx
// Detailed view for managing a single rental booking

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Home,
  Calendar,
  DollarSign,
  Clock,
  MapPin,
  BedDouble,
  FileText,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import {
  LoadingSpinner,
  Button,
  GlassButton,
  Badge,
  TAB_BAR_SAFE_PADDING,
  ICON_SIZES,
} from '@/components/ui';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/AlertDialog';
import { haptic } from '@/lib/haptics';

import { useBooking, useBookingMutations } from '../hooks/useRentalBookings';
import { BookingStatus, RateType } from '../types';
import { BookingTimeline } from '../components/BookingTimeline';
import { GuestInfoCard } from '../components/GuestInfoCard';

// ============================================
// Utility Functions
// ============================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatRate(rate: number, rateType: RateType): string {
  const amount = formatCurrency(rate);
  const suffix: Record<RateType, string> = {
    nightly: '/night',
    weekly: '/week',
    monthly: '/mo',
  };
  return `${amount}${suffix[rateType]}`;
}

function calculateDuration(startDate: string, endDate: string | null): string {
  if (!endDate) return 'Ongoing';

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return '1 night';
  if (diffDays < 7) return `${diffDays} nights`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    return days > 0 ? `${weeks}w ${days}d` : `${weeks} week${weeks > 1 ? 's' : ''}`;
  }
  const months = Math.floor(diffDays / 30);
  const remainingDays = diffDays % 30;
  return remainingDays > 0
    ? `${months}mo ${remainingDays}d`
    : `${months} month${months > 1 ? 's' : ''}`;
}

function getStatusBadgeVariant(status: BookingStatus): 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'inactive' {
  switch (status) {
    case 'inquiry':
      return 'info';
    case 'pending':
      return 'warning';
    case 'confirmed':
      return 'success';
    case 'active':
      return 'default';
    case 'completed':
      return 'inactive';
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function formatStatus(status: BookingStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// ============================================
// Section Components
// ============================================

interface SectionProps {
  title: string;
  icon: typeof Home;
  children: React.ReactNode;
}

function Section({ title, icon: Icon, children }: SectionProps) {
  const colors = useThemeColors();

  return (
    <View className="mb-4 p-4 rounded-xl" style={{ backgroundColor: colors.card }}>
      <View className="flex-row items-center mb-3">
        <Icon size={ICON_SIZES.lg} color={colors.mutedForeground} />
        <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

// ============================================
// Main Component
// ============================================

export function BookingDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const bookingId = params.id as string;

  const { booking, isLoading, error, refetch } = useBooking(bookingId);
  const { updateStatus, cancelBooking, isSaving } = useBookingMutations();

  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // ============================================
  // Action Handlers
  // ============================================

  const handleStatusUpdate = useCallback(
    async (newStatus: BookingStatus, confirmMessage?: string) => {
      if (!booking) return;

      const performUpdate = async () => {
        haptic.medium();
        const success = await updateStatus(booking.id, newStatus);
        if (success) {
          haptic.success();
          await refetch();
        } else {
          Alert.alert('Error', 'Failed to update booking status.');
        }
      };

      if (confirmMessage) {
        Alert.alert(
          'Confirm Action',
          confirmMessage,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Confirm', onPress: performUpdate },
          ]
        );
      } else {
        await performUpdate();
      }
    },
    [booking, updateStatus, refetch]
  );

  const handleConfirmBooking = useCallback(() => {
    handleStatusUpdate('confirmed', 'Mark this booking as confirmed?');
  }, [handleStatusUpdate]);

  const handleDeclineBooking = useCallback(() => {
    handleStatusUpdate('cancelled', 'Decline this booking inquiry?');
  }, [handleStatusUpdate]);

  const handleCheckIn = useCallback(() => {
    handleStatusUpdate('active', 'Check in the guest?');
  }, [handleStatusUpdate]);

  const handleCheckOut = useCallback(() => {
    handleStatusUpdate('completed', 'Check out the guest and complete this booking?');
  }, [handleStatusUpdate]);

  const handleCancelBooking = useCallback(async () => {
    if (!booking) return;

    haptic.medium();
    const success = await cancelBooking(booking.id);
    setShowCancelDialog(false);

    if (success) {
      haptic.success();
      await refetch();
    } else {
      Alert.alert('Error', 'Failed to cancel booking.');
    }
  }, [booking, cancelBooking, refetch]);

  const handleNavigateToProperty = useCallback(() => {
    if (!booking?.property_id) return;
    haptic.light();
    router.push(`/(tabs)/properties/${booking.property_id}`);
  }, [booking, router]);

  // ============================================
  // Loading & Error States
  // ============================================

  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen />
      </ThemedSafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <ThemedSafeAreaView className="flex-1 items-center justify-center" edges={['top']}>
        <Text className="mb-4" style={{ color: colors.mutedForeground }}>
          {error || 'Booking not found'}
        </Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </ThemedSafeAreaView>
    );
  }

  // ============================================
  // Render Action Buttons Based on Status
  // ============================================

  const renderActionButtons = () => {
    const { status } = booking;

    return (
      <View className="px-4 pb-4">
        {/* Status-specific actions */}
        {status === 'inquiry' && (
          <View className="flex-row gap-3 mb-3">
            <Button
              variant="default"
              onPress={handleConfirmBooking}
              disabled={isSaving}
              className="flex-1"
            >
              <CheckCircle size={ICON_SIZES.md} color={colors.primaryForeground} />
              <Text style={{ color: colors.primaryForeground, marginLeft: 8 }}>Confirm</Text>
            </Button>
            <Button
              variant="destructive"
              onPress={handleDeclineBooking}
              disabled={isSaving}
              className="flex-1"
            >
              <XCircle size={ICON_SIZES.md} color={colors.destructiveForeground} />
              <Text style={{ color: colors.destructiveForeground, marginLeft: 8 }}>Decline</Text>
            </Button>
          </View>
        )}

        {status === 'pending' && (
          <Button
            variant="default"
            onPress={handleConfirmBooking}
            disabled={isSaving}
            loading={isSaving}
            className="mb-3"
          >
            Mark Confirmed
          </Button>
        )}

        {status === 'confirmed' && (
          <Button
            variant="default"
            onPress={handleCheckIn}
            disabled={isSaving}
            loading={isSaving}
            className="mb-3"
          >
            <LogIn size={ICON_SIZES.md} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, marginLeft: 8 }}>Check In</Text>
          </Button>
        )}

        {status === 'active' && (
          <Button
            variant="default"
            onPress={handleCheckOut}
            disabled={isSaving}
            loading={isSaving}
            className="mb-3"
          >
            <LogOut size={ICON_SIZES.md} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, marginLeft: 8 }}>Check Out</Text>
          </Button>
        )}

        {/* Cancel button - available for non-terminal statuses */}
        {!['completed', 'cancelled'].includes(status) && (
          <Button
            variant="outline"
            onPress={() => setShowCancelDialog(true)}
            disabled={isSaving}
          >
            Cancel Booking
          </Button>
        )}
      </View>
    );
  };

  // ============================================
  // Main Render
  // ============================================

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View
        className="px-4 py-3 flex-row items-center justify-between"
        style={{
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <GlassButton
          icon={<ArrowLeft size={24} color={colors.foreground} />}
          onPress={() => router.back()}
          size={40}
          effect="clear"
          accessibilityLabel="Go back"
        />

        <View className="flex-1 mx-4">
          <Text
            className="text-lg font-semibold text-center"
            style={{ color: colors.foreground }}
            numberOfLines={1}
          >
            {booking.contact ? `${booking.contact.first_name || ''} ${booking.contact.last_name || ''}`.trim() || 'Guest' : 'Guest'}
          </Text>
        </View>

        <Badge variant={getStatusBadgeVariant(booking.status)} size="sm">
          {formatStatus(booking.status)}
        </Badge>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}
      >
        {/* Guest Info */}
        <View className="px-4 pt-4">
          <GuestInfoCard
            contactId={booking.contact_id}
            name={booking.contact ? `${booking.contact.first_name || ''} ${booking.contact.last_name || ''}`.trim() : undefined}
            phone={booking.contact?.phone}
            email={booking.contact?.email}
          />
        </View>

        {/* Property Section */}
        <View className="px-4 pt-4">
          <TouchableOpacity
            onPress={handleNavigateToProperty}
            disabled={!booking.property_id}
            activeOpacity={0.7}
          >
            <Section title="Property" icon={Home}>
              <View>
                <Text className="text-base font-medium" style={{ color: colors.foreground }}>
                  {booking.property?.name || 'Unknown Property'}
                </Text>
                {booking.property?.address && (
                  <View className="flex-row items-center mt-1">
                    <MapPin size={ICON_SIZES.sm} color={colors.mutedForeground} />
                    <Text className="ml-1 text-sm" style={{ color: colors.mutedForeground }}>
                      {booking.property.address}
                    </Text>
                  </View>
                )}
                {booking.room?.name && (
                  <View className="flex-row items-center mt-2">
                    <BedDouble size={ICON_SIZES.sm} color={colors.info} />
                    <Text className="ml-1 text-sm font-medium" style={{ color: colors.info }}>
                      {booking.room.name}
                    </Text>
                  </View>
                )}
              </View>
            </Section>
          </TouchableOpacity>
        </View>

        {/* Dates Section */}
        <View className="px-4">
          <Section title="Dates" icon={Calendar}>
            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="text-xs uppercase" style={{ color: colors.mutedForeground }}>
                  Check-in
                </Text>
                <Text className="text-base font-medium mt-1" style={{ color: colors.foreground }}>
                  {formatDate(booking.start_date)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs uppercase" style={{ color: colors.mutedForeground }}>
                  Check-out
                </Text>
                <Text className="text-base font-medium mt-1" style={{ color: colors.foreground }}>
                  {booking.end_date ? formatDate(booking.end_date) : 'Ongoing'}
                </Text>
              </View>
            </View>
            <View
              className="mt-3 pt-3 flex-row items-center"
              style={{ borderTopWidth: 1, borderTopColor: colors.border }}
            >
              <Clock size={ICON_SIZES.sm} color={colors.info} />
              <Text className="ml-2 text-sm font-medium" style={{ color: colors.info }}>
                {calculateDuration(booking.start_date, booking.end_date)}
              </Text>
            </View>
          </Section>
        </View>

        {/* Financial Section */}
        <View className="px-4">
          <Section title="Financial" icon={DollarSign}>
            <View className="flex-row justify-between mb-3">
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                Rate
              </Text>
              <Text className="text-sm font-medium" style={{ color: colors.foreground }}>
                {formatRate(booking.rate, booking.rate_type)}
              </Text>
            </View>
            {booking.deposit !== null && booking.deposit > 0 && (
              <View className="flex-row justify-between mb-3">
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                  Deposit
                </Text>
                <Text className="text-sm font-medium" style={{ color: colors.foreground }}>
                  {formatCurrency(booking.deposit)}
                </Text>
              </View>
            )}
            <View
              className="flex-row justify-between pt-3"
              style={{ borderTopWidth: 1, borderTopColor: colors.border }}
            >
              <Text className="text-base font-semibold" style={{ color: colors.foreground }}>
                Total
              </Text>
              <Text className="text-base font-bold" style={{ color: colors.success }}>
                {formatCurrency(booking.total_amount)}
              </Text>
            </View>
          </Section>
        </View>

        {/* Status Timeline */}
        <View className="px-4">
          <BookingTimeline booking={booking} showTimestamps={true} />
        </View>

        {/* Notes Section */}
        {booking.notes && (
          <View className="px-4 pt-4">
            <Section title="Notes" icon={FileText}>
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                {booking.notes}
              </Text>
            </Section>
          </View>
        )}

        {/* Action Buttons */}
        <View className="pt-4">
          {renderActionButtons()}
        </View>
      </ScrollView>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onPress={() => setShowCancelDialog(false)}>
              Keep Booking
            </AlertDialogCancel>
            <AlertDialogAction onPress={handleCancelBooking} disabled={isSaving}>
              {isSaving ? <ActivityIndicator color={colors.destructiveForeground} /> : 'Cancel Booking'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ThemedSafeAreaView>
  );
}

export default BookingDetailScreen;
