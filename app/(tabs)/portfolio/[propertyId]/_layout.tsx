// app/(tabs)/portfolio/[propertyId]/_layout.tsx
// Stack navigator for portfolio property detail screens
import { Stack } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeContext';

export default function PortfolioPropertyLayout() {
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
          title: 'Portfolio Property',
        }}
      />
    </Stack>
  );
}
