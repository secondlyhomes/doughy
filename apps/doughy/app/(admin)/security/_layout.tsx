// app/(admin)/security/_layout.tsx
import { Stack } from 'expo-router';

export default function SecurityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="ai-firewall" />
      <Stack.Screen name="user-threat/[userId]" />
    </Stack>
  );
}
