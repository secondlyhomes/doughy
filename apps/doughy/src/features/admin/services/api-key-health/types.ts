// src/features/admin/services/api-key-health/types.ts
// Types for API key health service

import type { IntegrationStatus } from '../../types/integrations';

export interface HealthStatusFromDBResult {
  status: IntegrationStatus;
  error?: string;
}

export interface CredentialExistsResult {
  exists: boolean;
  service: string;
  createdAt?: string;
  updatedAt?: string;
}
