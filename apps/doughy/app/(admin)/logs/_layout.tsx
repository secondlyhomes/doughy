// app/(admin)/logs/_layout.tsx
// Stack navigator for admin logs tab
import { Stack } from 'expo-router';

export default function AdminLogsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
