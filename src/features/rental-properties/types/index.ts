// src/features/rental-properties/types/index.ts
// Re-export types from the rental-properties store

export type {
  PropertyType,
  RentalType,
  RateType,
  PropertyStatus,
  RentalProperty,
  RentalPropertiesState,
} from '@/stores/rental-properties-store';

export {
  useRentalPropertiesStore,
  selectProperties,
  selectActiveProperties,
  selectSelectedProperty,
  selectPropertyById,
} from '@/stores/rental-properties-store';
