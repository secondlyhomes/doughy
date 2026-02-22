// app/(tabs)/campaigns/_layout.tsx
// Stack navigator for Campaigns (accessed from Deals or Settings)
import { Stack } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeContext';

export default function CampaignsLayout() {
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
          title: 'Campaigns',
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'New Campaign',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Campaign',
        }}
      />
    </Stack>
  );
}
