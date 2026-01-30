// app/(admin)/integrations/_layout.tsx
// Stack navigator for admin integrations tab
import { Stack } from 'expo-router';

export default function AdminIntegrationsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
