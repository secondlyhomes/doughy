// app/(tabs)/index.tsx
// Default route redirect - sends users to the appropriate inbox based on platform
import { Redirect } from 'expo-router';
import { usePlatform } from '@/contexts/PlatformContext';

export default function TabsIndex() {
  const { activePlatform } = usePlatform();
  const isLandlord = activePlatform === 'landlord';

  // Redirect to the appropriate inbox based on platform
  return <Redirect href={isLandlord ? '/(tabs)/landlord-inbox' : '/(tabs)/investor-inbox'} />;
}
