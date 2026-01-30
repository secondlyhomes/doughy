// src/features/settings/services/landlord-seeder/index.ts
// Landlord seeder service - main entry point
// Provides seed scenarios and data clearing for development testing

import type { SeedScenario, ClearDataResult } from './types';
import { getCurrentUserId } from './helpers';
import { clearAllLandlordData } from './clear-data';
import {
  seedStarterLandlord,
  seedBusyLandlord,
  seedRoomByRoom,
  seedFullPropertyManager,
  seedEdgeCases,
} from './scenarios';

// Re-export types
export type { SeedScenario, ClearDataResult };

// Re-export clear function
export { clearAllLandlordData };

// All available seed scenarios
export const seedScenarios: SeedScenario[] = [
  seedStarterLandlord,
  seedBusyLandlord,
  seedRoomByRoom,
  seedFullPropertyManager,
  seedEdgeCases,
];

/**
 * Run a specific seed scenario by ID
 * @param scenarioId - The ID of the scenario to run
 * @throws Error if scenario not found or user not authenticated
 */
export async function runSeedScenario(scenarioId: string): Promise<void> {
  const userId = await getCurrentUserId();
  const scenario = seedScenarios.find(s => s.id === scenarioId);
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`);
  await scenario.seed(userId);
}
