// app/(tabs)/conversations/_layout.tsx
// Conversations stack navigator
import { Stack } from 'expo-router';

export default function ConversationsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
