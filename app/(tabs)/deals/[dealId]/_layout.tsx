// app/(tabs)/deals/[dealId]/_layout.tsx
// Stack navigator for deal detail screens
import { Stack } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';

export default function DealDetailLayout() {
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
          title: 'Deal Cockpit',
        }}
      />
      <Stack.Screen
        name="underwrite"
        options={{
          title: 'Quick Underwrite',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="field-mode"
        options={{
          title: 'Field Mode',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="offer"
        options={{
          title: 'Offer Builder',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="seller-report"
        options={{
          title: 'Seller Report',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="docs"
        options={{
          title: 'Documents',
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
