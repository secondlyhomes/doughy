// app/(tabs)/deals/index.tsx
// Entry point for Deals tab - renders DealsListScreen
import { DealsListScreen } from '@/features/deals/screens/DealsListScreen';

export default function DealsIndexRoute() {
  return <DealsListScreen />;
}
