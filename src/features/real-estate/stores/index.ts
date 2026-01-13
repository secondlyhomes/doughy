// src/features/real-estate/stores/index.ts

export { usePropertyStore, propertyEvents } from './propertyStore';
export { useDrawerStore } from './drawerStore';

// Re-export types from centralized types location
export type {
  IPropertyBasicInfo,
  IPropertyRepairItem,
  IPropertyDebtItem,
  IPropertyFinancials,
  IBuyingCriteria,
  IProperty,
  KeyPropertyValues,
} from '../types';

export { PROPERTY_EVENTS } from '../types';
