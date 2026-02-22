// src/features/admin/screens/security-health/integration-health-helpers.ts
// Pure helper functions for mapping integrations to health statuses

import { INTEGRATIONS } from '../../data/integrationData';
import type { IntegrationHealth, ApiKeyRecord } from '../../types/integrations';

/**
 * Get all field keys for an integration
 * This maps integration service names to their database field keys
 */
export function getIntegrationFieldKeys(integration: (typeof INTEGRATIONS)[number]): string[] {
  return integration.fields.map((f) => f.key);
}

/**
 * Find API keys in database that belong to an integration
 */
export function findKeysForIntegration(
  integration: (typeof INTEGRATIONS)[number],
  apiKeys: ApiKeyRecord[]
): ApiKeyRecord[] {
  const fieldKeys = getIntegrationFieldKeys(integration);
  return apiKeys.filter((key) => fieldKeys.includes(key.service));
}

/**
 * Get the best health status for an integration from its field keys
 * Priority: operational > configured > error > not-configured
 */
export function getBestHealthForIntegration(
  integration: (typeof INTEGRATIONS)[number],
  healthStatuses: Map<string, IntegrationHealth>
): IntegrationHealth | undefined {
  const fieldKeys = getIntegrationFieldKeys(integration);
  let bestHealth: IntegrationHealth | undefined;

  for (const key of fieldKeys) {
    const health = healthStatuses.get(key);
    if (!health) continue;

    if (!bestHealth) {
      bestHealth = health;
      continue;
    }

    // Prioritize operational status
    if (health.status === 'operational') {
      bestHealth = health;
      break;
    }

    // Prefer configured over error
    if (health.status === 'configured' && bestHealth.status === 'error') {
      bestHealth = health;
    }
  }

  return bestHealth;
}
