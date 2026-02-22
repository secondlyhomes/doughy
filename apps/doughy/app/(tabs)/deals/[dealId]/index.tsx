// app/(tabs)/deals/[dealId]/index.tsx
// Deal detail route - renders DealCockpitScreen
import { DealCockpitScreen } from '@/features/deals/screens/DealCockpitScreen';

export default function DealDetailRoute() {
  // dealId is obtained via useLocalSearchParams inside DealCockpitScreen
  return <DealCockpitScreen />;
}
