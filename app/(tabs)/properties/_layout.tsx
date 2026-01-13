// app/(tabs)/properties/_layout.tsx
// Properties stack navigator
import { Stack } from 'expo-router';

export default function PropertiesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    />
  );
}
