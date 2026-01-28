// app/(tabs)/bookings/_layout.tsx
// Bookings stack navigator for Landlord platform
import { Stack } from 'expo-router';

export default function BookingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
