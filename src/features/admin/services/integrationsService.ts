// src/features/admin/services/integrationsService.ts
// Integrations management service for admin
// Note: This uses mock data as the integrations table is not yet in the database schema

export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'pending';

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: IntegrationStatus;
  lastSync?: string;
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationsResult {
  success: boolean;
  integrations?: Integration[];
  error?: string;
}

export interface IntegrationResult {
  success: boolean;
  integration?: Integration;
  error?: string;
}

// In-memory store for demo purposes
let mockIntegrations: Integration[] | null = null;

function getOrCreateMockIntegrations(): Integration[] {
  if (!mockIntegrations) {
    mockIntegrations = createMockIntegrations();
  }
  return mockIntegrations;
}

/**
 * Fetch all integrations
 */
export async function getIntegrations(): Promise<IntegrationsResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { success: true, integrations: getOrCreateMockIntegrations() };
}

/**
 * Toggle integration status
 */
export async function toggleIntegration(
  integrationId: string,
  enabled: boolean
): Promise<IntegrationResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const integrations = getOrCreateMockIntegrations();
  const index = integrations.findIndex((i) => i.id === integrationId);

  if (index !== -1) {
    integrations[index] = {
      ...integrations[index],
      status: enabled ? 'active' : 'inactive',
      updatedAt: new Date().toISOString(),
    };
    return { success: true, integration: integrations[index] };
  }

  return { success: false, error: 'Integration not found' };
}

/**
 * Sync an integration
 */
export async function syncIntegration(integrationId: string): Promise<IntegrationResult> {
  // Simulate network delay and sync operation
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const integrations = getOrCreateMockIntegrations();
  const index = integrations.findIndex((i) => i.id === integrationId);

  if (index !== -1) {
    integrations[index] = {
      ...integrations[index],
      lastSync: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, integration: integrations[index] };
  }

  return { success: false, error: 'Integration not found' };
}

/**
 * Create mock integrations for demo/development
 */
function createMockIntegrations(): Integration[] {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();

  return [
    {
      id: 'int-1',
      name: 'Zillow',
      description: 'Property listings and market data from Zillow',
      icon: 'home',
      status: 'active',
      lastSync: yesterday,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'int-2',
      name: 'Redfin',
      description: 'Real estate listings and neighborhood data',
      icon: 'map-pin',
      status: 'active',
      lastSync: yesterday,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'int-3',
      name: 'MLS',
      description: 'Multiple Listing Service integration',
      icon: 'database',
      status: 'inactive',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'int-4',
      name: 'Stripe',
      description: 'Payment processing and subscriptions',
      icon: 'credit-card',
      status: 'active',
      lastSync: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'int-5',
      name: 'SendGrid',
      description: 'Email delivery and notifications',
      icon: 'mail',
      status: 'active',
      lastSync: yesterday,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'int-6',
      name: 'Twilio',
      description: 'SMS notifications and phone verification',
      icon: 'phone',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'int-7',
      name: 'Google Maps',
      description: 'Maps, geocoding, and location services',
      icon: 'map',
      status: 'active',
      lastSync: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'int-8',
      name: 'DocuSign',
      description: 'Electronic signature and document management',
      icon: 'file-signature',
      status: 'error',
      lastSync: yesterday,
      createdAt: now,
      updatedAt: now,
    },
  ];
}
