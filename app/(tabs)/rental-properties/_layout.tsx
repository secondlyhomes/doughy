// app/(tabs)/rental-properties/_layout.tsx
// Rental properties stack navigator for Landlord platform
import { Stack } from 'expo-router';

export default function RentalPropertiesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
