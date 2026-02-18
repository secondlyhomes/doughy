// src/features/vendors/index.ts
// Barrel export for vendors feature

// Screens
export { VendorsListScreen } from './screens/VendorsListScreen';
export { VendorDetailScreen } from './screens/VendorDetailScreen';

// Components
export { VendorCard } from './components/VendorCard';
export { AddVendorSheet } from './components/AddVendorSheet';
export { MessageVendorSheet } from './components/MessageVendorSheet';

// Hooks
export {
  useVendors,
  useVendor,
  useVendorCount,
  useVendorMutations,
  useVendorsGroupedByCategory,
  usePrimaryVendor,
  vendorKeys,
} from './hooks/useVendors';

// Types
export * from './types';
