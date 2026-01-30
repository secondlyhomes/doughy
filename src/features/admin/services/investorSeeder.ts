// src/features/admin/services/investorSeeder.ts
// DEPRECATED: This file re-exports from investor-seeder/ for backward compatibility
// Import directly from '@/features/admin/services/investor-seeder' for new code

export {
  investorSeeder,
  seedService,
  canSeedDatabase,
  clearDatabase,
  seedDatabase,
} from './investor-seeder';

export type {
  SeedResult,
  ClearResult,
  SafetyCheckResult,
} from './investor-seeder';

export { default } from './investor-seeder';
