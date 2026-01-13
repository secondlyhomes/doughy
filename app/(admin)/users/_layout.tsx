// app/(admin)/users/_layout.tsx
// Stack navigator for admin users tab
import { Stack } from 'expo-router';

export default function AdminUsersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
