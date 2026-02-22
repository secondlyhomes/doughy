// src/features/real-estate/index.ts
// Main entry point for the real-estate feature module

// Export types (includes IProperty*, IBuyingCriteria, KeyPropertyValues, PROPERTY_EVENTS)
export * from './types';

// Export stores (types already exported from ./types above)
export {
  usePropertyStore,
  propertyEvents,
  useDrawerStore,
} from './stores';

// Export hooks
export { useProperties, useProperty, usePropertyMutations } from './hooks';

// Export components
export {
  PropertyCard,
  PropertyImagePicker,
  PropertyForm,
  PropertyMap,
  PropertyLocationMap,
  AddressAutocomplete,
  PropertyAnalytics,
} from './components';
export type { AddressResult, PropertyAnalyticsProps } from './components';

// Export screens
export {
  PropertyListScreen,
  PropertyDetailScreen,
  AddPropertyScreen,
  EditPropertyScreen,
  PropertyMapScreen,
} from './screens';

// Export utilities
export * from './utils';

// Note: Navigation is now handled by Expo Router (see app/(tabs)/properties/)
