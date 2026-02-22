// src/features/settings/services/landlord-seeder/types.ts
// Type definitions for landlord seeding

export interface SeedScenario {
  id: string;
  name: string;
  description: string;
  seed: (userId: string) => Promise<void>;
}

export interface ClearDataResult {
  success: boolean;
  errors: { table: string; message: string }[];
}
