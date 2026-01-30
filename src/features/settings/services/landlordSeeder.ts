// src/features/settings/services/landlordSeeder.ts
// DEPRECATED: This file re-exports from landlord-seeder/ for backward compatibility
// Import directly from '@/features/settings/services/landlord-seeder' for new code

export {
  seedScenarios,
  runSeedScenario,
  clearAllLandlordData,
} from './landlord-seeder';

export type {
  SeedScenario,
  ClearDataResult,
} from './landlord-seeder';
