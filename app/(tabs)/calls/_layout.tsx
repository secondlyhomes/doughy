// app/(tabs)/calls/_layout.tsx
// CallPilot stack navigator
import { Stack } from 'expo-router';

export default function CallsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="new" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="pre-call/[id]" />
      <Stack.Screen name="active/[id]" />
      <Stack.Screen name="review/[id]" />
    </Stack>
  );
}
