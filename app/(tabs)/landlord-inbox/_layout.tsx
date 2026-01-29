// app/(tabs)/landlord-inbox/_layout.tsx
// Landlord Inbox stack navigator for Landlord platform
// Detail screens use fullScreenModal presentation to hide the tab bar
import { Stack } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';

export default function InboxLayout() {
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
          // Use fullScreenModal to hide the tab bar for focused conversation view
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
