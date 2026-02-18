// app/(modals)/_layout.tsx
// Layout for modal screens (full-screen overlays)
import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'fullScreenModal',
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="call" />
    </Stack>
  );
}
