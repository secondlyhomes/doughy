// app/(tabs)/dev/_layout.tsx
// Dev tools stack navigator
import { Stack } from 'expo-router';

export default function DevLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
