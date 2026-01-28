// app/(tabs)/contacts/_layout.tsx
// Contacts stack navigator for Landlord platform
import { Stack } from 'expo-router';

export default function ContactsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
