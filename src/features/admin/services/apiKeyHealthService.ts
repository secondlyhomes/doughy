// src/features/admin/services/apiKeyHealthService.ts
// DEPRECATED: This file re-exports from api-key-health/ for backward compatibility
// Import directly from '@/features/admin/services/api-key-health' for new code

export {
  clearHealthCache,
  testApiKeyWithoutSaving,
  checkIntegrationHealth,
  checkAllIntegrations,
  checkCredentialsExist,
  getHealthStatusFromDB,
  batchHealthCheck,
} from './api-key-health';

export type {
  HealthStatusFromDBResult,
  CredentialExistsResult,
} from './api-key-health';
