// app/(tabs)/rental-properties/[id]/_layout.tsx
// Stack navigator for property detail and sub-screens

import { Stack } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';

export default function PropertyDetailLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: true }} />
      <Stack.Screen name="inventory/index" />
      <Stack.Screen name="inventory/[itemId]" />
      <Stack.Screen name="maintenance/index" />
      <Stack.Screen name="maintenance/[workOrderId]" />
      <Stack.Screen name="smart-home/index" />
      <Stack.Screen name="smart-home/[deviceId]" />
      <Stack.Screen name="vendors/index" />
      <Stack.Screen name="vendors/[vendorId]" />
      <Stack.Screen name="turnovers/index" />
      <Stack.Screen name="turnovers/[turnoverId]" />
    </Stack>
  );
}
