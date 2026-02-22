// src/features/admin/services/investor-seeder/index.ts
// Investor database seeding service - main entry point
// Provides seed/clear operations with safety checks for development testing

export type { SeedResult, ClearResult, SafetyCheckResult } from './types';
export { canSeedDatabase } from './safety-checks';
export { clearDatabase } from './clear-database';
export { seedDatabase } from './seed-database';

import { canSeedDatabase } from './safety-checks';
import { clearDatabase } from './clear-database';
import { seedDatabase } from './seed-database';

/**
 * Investor database seeding service for development testing.
 * Provides triple-layered safety checks to prevent production use.
 */
export const investorSeeder = {
  canSeedInvestorDatabase: canSeedDatabase,
  clearInvestorData: clearDatabase,
  seedInvestorData: seedDatabase,
};

// Backward compatibility alias
export const seedService = {
  canSeedDatabase,
  clearDatabase,
  seedDatabase,
};

export default investorSeeder;
