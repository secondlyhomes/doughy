// app/(tabs)/rental-properties/[id]/_layout.tsx
// Stack navigator for property detail and sub-screens

import { Stack } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeContext';

export default function PropertyDetailLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: true, // Enable native headers for all child screens
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: true }} />
      <Stack.Screen name="inventory/index" options={{ headerShown: true }} />
      <Stack.Screen name="inventory/[itemId]" options={{ headerShown: true }} />
      <Stack.Screen name="maintenance/index" options={{ headerShown: true }} />
      <Stack.Screen name="maintenance/[workOrderId]" options={{ headerShown: true }} />
      <Stack.Screen name="smart-home/index" options={{ headerShown: true }} />
      <Stack.Screen name="smart-home/[deviceId]" options={{ headerShown: true }} />
      <Stack.Screen name="vendors/index" options={{ headerShown: true }} />
      <Stack.Screen name="vendors/[vendorId]" options={{ headerShown: true }} />
      <Stack.Screen name="turnovers/index" options={{ headerShown: true }} />
      <Stack.Screen name="turnovers/[turnoverId]" options={{ headerShown: true }} />
    </Stack>
  );
}
