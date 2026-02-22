// app/skip-tracing/_layout.tsx
// Layout for skip tracing routes

import { Stack } from 'expo-router';

export default function SkipTracingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[resultId]" />
    </Stack>
  );
}
