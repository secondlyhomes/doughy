// app/(tabs)/settings/vendors/index.tsx
// Route for global vendors list screen (all vendors across properties)

import { VendorsListScreen } from '@/features/vendors/screens/VendorsListScreen';

export default function GlobalVendorsListRoute() {
  return <VendorsListScreen isGlobal />;
}
