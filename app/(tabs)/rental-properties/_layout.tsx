// app/(tabs)/rental-properties/_layout.tsx
// Rental properties stack navigator for Landlord platform
// Detail screens use fullScreenModal presentation to hide the tab bar
import { Stack } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';

export default function RentalPropertiesLayout() {
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
          // Use fullScreenModal to hide the tab bar for focused property view
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="add" />
      <Stack.Screen name="edit/[id]" />
    </Stack>
  );
}
