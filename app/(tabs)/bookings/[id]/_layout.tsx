// app/(tabs)/bookings/[id]/_layout.tsx
// Stack layout for booking detail and sub-screens

import { Stack } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';

export default function BookingDetailLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="settlement"
        options={{
          title: 'Settle Deposit',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="charges"
        options={{
          title: 'Booking Charges',
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
