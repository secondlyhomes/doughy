// src/features/admin/screens/integrations/types.ts
// Types for integrations screen

import type { Integration, IntegrationHealth, IntegrationStatus } from '../../types/integrations';

// Filter type for status filtering - includes 'needs-rotation' for stale keys
export type StatusFilter = 'all' | 'operational' | 'error' | 'not-configured' | 'configured' | 'needs-rotation';

// Extended integration type with health data and key dates
export interface IntegrationWithHealth extends Integration {
  health?: IntegrationHealth;
  overallStatus: IntegrationStatus;
  updatedAt?: string | null;
  createdAt?: string | null;
  needsRotation?: boolean;
}
