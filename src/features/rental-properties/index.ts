// src/features/rental-properties/index.ts
// Rental Properties Feature - Barrel Export
// Export all rental properties components, screens, hooks, and types

// Screens
export { RentalPropertiesListScreen } from './screens/RentalPropertiesListScreen';
export { RentalPropertyDetailScreen } from './screens/RentalPropertyDetailScreen';

// Components
export { RentalPropertyCard } from './components/RentalPropertyCard';
export { PropertyStatsRow } from './components/PropertyStatsRow';
export { RoomsList } from './components/RoomsList';

// Hooks
export {
  useRentalProperties,
  useRentalPropertiesWithRooms,
  useRentalProperty,
  useCreateRentalProperty,
  useUpdateRentalProperty,
  useDeleteRentalProperty,
  useFilteredRentalProperties,
  rentalPropertyKeys,
} from './hooks/useRentalProperties';

export {
  useRentalPropertyDetail,
  useRentalPropertyMutations,
  rentalPropertyDetailKeys,
} from './hooks/useRentalPropertyDetail';

// Types
export * from './types';
