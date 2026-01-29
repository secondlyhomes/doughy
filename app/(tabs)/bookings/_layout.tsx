// app/(tabs)/bookings/_layout.tsx
// Bookings stack navigator for Landlord platform
// Detail screens use fullScreenModal presentation to hide the tab bar
import { Stack } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';

export default function BookingsLayout() {
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
      <Stack.Screen name="index" />
      <Stack.Screen
        name="[id]"
        options={{
          // Use fullScreenModal to hide the tab bar for focused booking view
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
