// app/(admin)/claw/_layout.tsx
import { Stack } from 'expo-router';

export default function ClawLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
