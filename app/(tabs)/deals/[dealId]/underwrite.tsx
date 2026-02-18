// app/(tabs)/deals/[dealId]/underwrite.tsx
// Quick Underwrite route - renders QuickUnderwriteScreen
import { QuickUnderwriteScreen } from '@/features/deals/screens/QuickUnderwriteScreen';

export default function QuickUnderwriteRoute() {
  // dealId is obtained via useLocalSearchParams inside QuickUnderwriteScreen
  return <QuickUnderwriteScreen />;
}
