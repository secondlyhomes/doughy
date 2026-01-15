// src/features/admin/services/integrationsService.ts
// Real integrations management service using Supabase

import { supabase } from '@/lib/supabase';
import { INTEGRATIONS } from '../data/integrationData';
import type { Integration, IntegrationHealth } from '../types/integrations';
import { checkIntegrationHealth, getHealthStatusFromDB } from './apiKeyHealthService';
import { normalizeServiceName } from '../utils/serviceHelpers';

// Re-export types from integrationData for backward compatibility
export type { Integration };
export type IntegrationStatus = 'operational' | 'configured' | 'error' | 'not-configured' | 'checking';

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

export interface IntegrationHealthResult {
  success: boolean;
  health?: IntegrationHealth;
  error?: string;
}

/**
 * Get all available integrations from configuration
 */
export async function getIntegrations(): Promise<IntegrationsResult> {
  try {
    // Return all configured integrations from integrationData
    return { success: true, integrations: INTEGRATIONS };
  } catch (error) {
    console.error('Error getting integrations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get integrations',
    };
  }
}

/**
 * Get configured integrations (integrations with API keys stored)
 */
export async function getConfiguredIntegrations(): Promise<IntegrationsResult> {
  try {
    // Query api_keys table for configured services
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('service, status, last_used, last_checked');

    if (error) {
      throw error;
    }

    // Map API keys to integrations
    const configuredServices = new Set(apiKeys?.map((k) => k.service) || []);

    const configured = INTEGRATIONS.filter((integration) =>
      configuredServices.has(integration.service)
    );

    return { success: true, integrations: configured };
  } catch (error) {
    console.error('Error getting configured integrations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get configured integrations',
    };
  }
}

/**
 * Get integration by service name
 */
export async function getIntegrationByService(service: string): Promise<IntegrationResult> {
  try {
    const normalizedService = normalizeServiceName(service);
    const integration = INTEGRATIONS.find(
      (i) => i.service === normalizedService || i.id === normalizedService
    );

    if (!integration) {
      return { success: false, error: 'Integration not found' };
    }

    return { success: true, integration };
  } catch (error) {
    console.error('Error getting integration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get integration',
    };
  }
}

/**
 * Test integration health
 */
export async function testIntegrationHealth(service: string): Promise<IntegrationHealthResult> {
  try {
    const health = await checkIntegrationHealth(service, true); // Skip cache for manual test
    return { success: true, health };
  } catch (error) {
    console.error('Error testing integration health:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test integration health',
    };
  }
}

/**
 * Toggle integration (enable/disable)
 * Note: This updates the status in the api_keys table
 */
export async function toggleIntegration(
  service: string,
  enabled: boolean
): Promise<IntegrationResult> {
  try {
    const normalizedService = normalizeServiceName(service);

    const { error } = await supabase
      .from('api_keys')
      .update({
        status: enabled ? 'active' : 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('service', normalizedService);

    if (error) {
      throw error;
    }

    const integration = INTEGRATIONS.find((i) => i.service === normalizedService);

    return { success: true, integration };
  } catch (error) {
    console.error('Error toggling integration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle integration',
    };
  }
}

/**
 * Trigger integration sync (runs health check)
 */
export async function syncIntegration(service: string): Promise<IntegrationResult> {
  try {
    const normalizedService = normalizeServiceName(service);

    // Run health check which will update last_used and status
    await checkIntegrationHealth(normalizedService, true);

    const integration = INTEGRATIONS.find((i) => i.service === normalizedService);

    return { success: true, integration };
  } catch (error) {
    console.error('Error syncing integration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync integration',
    };
  }
}
