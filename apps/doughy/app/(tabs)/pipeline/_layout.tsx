// app/(tabs)/pipeline/_layout.tsx
// Pipeline stack navigator - unified Leads + Deals + Portfolio for Investor platform
import { Stack } from 'expo-router';

export default function PipelineLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Main pipeline screen */}
      <Stack.Screen name="index" />

      {/* Lead screens */}
      <Stack.Screen name="lead/[leadId]" />
      <Stack.Screen name="lead/add" options={{ presentation: 'fullScreenModal' }} />

      {/* Property screens (from leads) */}
      <Stack.Screen name="property/[id]" />

      {/* Deal screens */}
      <Stack.Screen name="deal/[dealId]" />
      <Stack.Screen name="deal/new" options={{ presentation: 'fullScreenModal' }} />

      {/* Portfolio screens */}
      <Stack.Screen name="portfolio/[propertyId]" />
      <Stack.Screen
        name="portfolio/add"
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
        }}
      />
    </Stack>
  );
}
