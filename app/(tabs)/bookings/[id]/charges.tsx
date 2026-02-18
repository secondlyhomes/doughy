// app/(tabs)/bookings/[id]/charges.tsx
// Route for viewing all booking charges

import React from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ThemedSafeAreaView } from '@/components';
import { BookingChargesSection } from '@/features/booking-charges';

export default function ChargesRoute() {
  const { id: bookingId } = useLocalSearchParams<{ id: string }>();

  // TODO: Get propertyId and depositHeld from booking data
  return (
    <ThemedSafeAreaView className="flex-1" edges={['bottom']}>
      <ScrollView className="flex-1">
        <BookingChargesSection
          bookingId={bookingId || ''}
          depositHeld={500}
          propertyId=""
        />
      </ScrollView>
    </ThemedSafeAreaView>
  );
}
