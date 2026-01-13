// app/(tabs)/leads/_layout.tsx
// Leads stack navigator
import { Stack } from 'expo-router';

export default function LeadsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
