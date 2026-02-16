// app/(tabs)/ai-assistant/_layout.tsx
// The Claw control panel stack navigator
import { Stack } from 'expo-router';

export default function AIAssistantLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="approvals" />
      <Stack.Screen name="agents" />
    </Stack>
  );
}
