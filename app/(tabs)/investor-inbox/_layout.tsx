// app/(tabs)/investor-inbox/_layout.tsx
// Investor Inbox stack navigator for RE Investor platform
// Supports Lead Communication Inbox with conversation detail screens
import { Stack } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';

export default function FocusLayout() {
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
