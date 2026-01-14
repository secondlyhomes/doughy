// app/(tabs)/deals/_layout.tsx
// Stack navigator for Deals tab
import { Stack } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';

export default function DealsLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Deals',
        }}
      />
      <Stack.Screen
        name="[dealId]"
        options={{
          title: 'Deal Details',
        }}
      />
    </Stack>
  );
}
