// src/features/rental-bookings/screens/booking-detail/BookingDetailScreen.tsx
// Detailed view for managing a single rental booking

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import {
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
  ArrowLeft,
} from 'lucide-react-native';

import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import {
  LoadingSpinner,
  Button,
  TAB_BAR_SAFE_PADDING,
} from '@/components/ui';
import { SPACING, FONT_SIZES, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
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

import { useBooking, useBookingMutations } from '../../hooks/useRentalBookings';
import type { BookingStatus } from '../../types';
import { BookingTimeline } from '../../components/BookingTimeline';
import { GuestInfoCard } from '../../components/GuestInfoCard';

import { Section } from './Section';
import { formatDate, formatCurrency, formatRate, calculateDuration } from './utils';

export function BookingDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const bookingId = params.id as string;

  const { booking, isLoading, error, refetch } = useBooking(bookingId);
  const { updateStatus, cancelBooking, isSaving } = useBookingMutations();

  const [showCancelDialog, setShowCancelDialog] = useState(false);

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

  const guestName = booking?.contact
    ? `${booking.contact.first_name || ''} ${booking.contact.last_name || ''}`.trim() || 'Guest'
    : 'Booking';

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/bookings');
    }
  }, [router]);

  const headerOptions = useMemo((): NativeStackNavigationOptions => ({
    headerShown: true,
    headerStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
    headerStatusBarHeight: insets.top,
    headerTitle: () => (
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.base }}>
          {guestName}
        </Text>
      </View>
    ),
    headerLeft: () => (
      <TouchableOpacity onPress={handleBack} style={{ padding: SPACING.sm }}>
        <ArrowLeft size={ICON_SIZES.xl} color={colors.foreground} />
      </TouchableOpacity>
    ),
  }), [colors, insets.top, guestName, handleBack]);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <LoadingSpinner fullScreen />
        </ThemedSafeAreaView>
      </>
    );
  }

  if (error || !booking) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <View className="flex-1 items-center justify-center">
            <Text className="mb-4" style={{ color: colors.mutedForeground }}>
              {error || 'Booking not found'}
            </Text>
            <Button onPress={handleBack}>Go Back</Button>
          </View>
        </ThemedSafeAreaView>
      </>
    );
  }

  const renderActionButtons = () => {
    const { status } = booking;

    return (
      <View className="px-4 pb-4">
        {status === 'inquiry' && (
          <View className="flex-row gap-3 mb-3">
            <Button variant="default" onPress={handleConfirmBooking} disabled={isSaving} className="flex-1">
              <CheckCircle size={ICON_SIZES.md} color={colors.primaryForeground} />
              <Text style={{ color: colors.primaryForeground, marginLeft: 8 }}>Confirm</Text>
            </Button>
            <Button variant="destructive" onPress={handleDeclineBooking} disabled={isSaving} className="flex-1">
              <XCircle size={ICON_SIZES.md} color={colors.destructiveForeground} />
              <Text style={{ color: colors.destructiveForeground, marginLeft: 8 }}>Decline</Text>
            </Button>
          </View>
        )}

        {status === 'pending' && (
          <Button variant="default" onPress={handleConfirmBooking} disabled={isSaving} loading={isSaving} className="mb-3">
            Mark Confirmed
          </Button>
        )}

        {status === 'confirmed' && (
          <Button variant="default" onPress={handleCheckIn} disabled={isSaving} loading={isSaving} className="mb-3">
            <LogIn size={ICON_SIZES.md} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, marginLeft: 8 }}>Check In</Text>
          </Button>
        )}

        {status === 'active' && (
          <Button variant="default" onPress={handleCheckOut} disabled={isSaving} loading={isSaving} className="mb-3">
            <LogOut size={ICON_SIZES.md} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, marginLeft: 8 }}>Check Out</Text>
          </Button>
        )}

        {!['completed', 'cancelled'].includes(status) && (
          <Button variant="outline" onPress={() => setShowCancelDialog(true)} disabled={isSaving}>
            Cancel Booking
          </Button>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}>
          <View className="px-4 pt-4">
            <GuestInfoCard
              contactId={booking.contact_id}
              name={booking.contact ? `${booking.contact.first_name || ''} ${booking.contact.last_name || ''}`.trim() : undefined}
              phone={booking.contact?.phone}
              email={booking.contact?.email}
            />
          </View>

          <View className="px-4 pt-4">
            <TouchableOpacity onPress={handleNavigateToProperty} disabled={!booking.property_id} activeOpacity={PRESS_OPACITY.DEFAULT}>
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

          <View className="px-4">
            <Section title="Dates" icon={Calendar}>
              <View className="flex-row justify-between">
                <View className="flex-1">
                  <Text className="text-xs uppercase" style={{ color: colors.mutedForeground }}>Check-in</Text>
                  <Text className="text-base font-medium mt-1" style={{ color: colors.foreground }}>
                    {formatDate(booking.start_date)}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs uppercase" style={{ color: colors.mutedForeground }}>Check-out</Text>
                  <Text className="text-base font-medium mt-1" style={{ color: colors.foreground }}>
                    {booking.end_date ? formatDate(booking.end_date) : 'Ongoing'}
                  </Text>
                </View>
              </View>
              <View className="mt-3 pt-3 flex-row items-center" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                <Clock size={ICON_SIZES.sm} color={colors.info} />
                <Text className="ml-2 text-sm font-medium" style={{ color: colors.info }}>
                  {calculateDuration(booking.start_date, booking.end_date)}
                </Text>
              </View>
            </Section>
          </View>

          <View className="px-4">
            <Section title="Financial" icon={DollarSign}>
              <View className="flex-row justify-between mb-3">
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>Rate</Text>
                <Text className="text-sm font-medium" style={{ color: colors.foreground }}>
                  {formatRate(booking.rate, booking.rate_type)}
                </Text>
              </View>
              {booking.deposit !== null && booking.deposit > 0 && (
                <View className="flex-row justify-between mb-3">
                  <Text className="text-sm" style={{ color: colors.mutedForeground }}>Deposit</Text>
                  <Text className="text-sm font-medium" style={{ color: colors.foreground }}>
                    {formatCurrency(booking.deposit)}
                  </Text>
                </View>
              )}
              <View className="flex-row justify-between pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                <Text className="text-base font-semibold" style={{ color: colors.foreground }}>Total</Text>
                <Text className="text-base font-bold" style={{ color: colors.success }}>
                  {formatCurrency(booking.total_amount)}
                </Text>
              </View>
            </Section>
          </View>

          <View className="px-4">
            <BookingTimeline booking={booking} showTimestamps={true} />
          </View>

          {booking.notes && (
            <View className="px-4 pt-4">
              <Section title="Notes" icon={FileText}>
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>{booking.notes}</Text>
              </Section>
            </View>
          )}

          <View className="pt-4">{renderActionButtons()}</View>
        </ScrollView>

        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this booking? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onPress={() => setShowCancelDialog(false)}>Keep Booking</AlertDialogCancel>
              <AlertDialogAction onPress={handleCancelBooking} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color={colors.destructiveForeground} /> : 'Cancel Booking'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ThemedSafeAreaView>
    </>
  );
}

export default BookingDetailScreen;
