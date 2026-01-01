// src/features/real-estate/index.ts
// Main entry point for the real-estate feature module

// Export types
export * from './types';

// Export stores
export {
  usePropertyStore,
  propertyEvents,
  PROPERTY_EVENTS,
  useDrawerStore,
} from './stores';
export type {
  IPropertyBasicInfo,
  IPropertyRepairItem,
  IPropertyDebtItem,
  IPropertyFinancials,
  IBuyingCriteria,
  IProperty,
  KeyPropertyValues,
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

// Export navigation
export { RealEstateNavigator } from './navigation';
export type { RealEstateStackParamList } from './navigation';
