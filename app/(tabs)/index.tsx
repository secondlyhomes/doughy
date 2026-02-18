// app/(tabs)/index.tsx
// Default route redirect - sends users to the first tab based on platform
import { Redirect } from 'expo-router';
import { usePlatform } from '@/contexts/PlatformContext';

export default function TabsIndex() {
  const { activePlatform } = usePlatform();
  const isLandlord = activePlatform === 'landlord';

  // Redirect to the first tab: Leads (investor) or People/Contacts (landlord)
  return <Redirect href={isLandlord ? '/(tabs)/contacts' : '/(tabs)/leads'} />;
}
