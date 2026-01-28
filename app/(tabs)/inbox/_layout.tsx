// app/(tabs)/inbox/_layout.tsx
// Inbox stack navigator for Landlord platform
import { Stack } from 'expo-router';

export default function InboxLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
