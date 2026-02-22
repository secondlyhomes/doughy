// src/features/admin/screens/security-health/useSecurityHealthData.ts
// State management and data-fetching hook for SecurityHealthScreen

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';

import { type IntegrationGridItem } from '../../components/IntegrationStatusGrid';
import {
  fetchAllApiKeys,
  getSecurityHealthSummary,
  getKeysNeedingAttention,
} from '../../services/securityHealthService';
import { batchHealthCheck } from '../../services/api-key-health';
import { INTEGRATIONS } from '../../data/integrationData';
import type { IntegrationHealth, ApiKeyRecord } from '../../types/integrations';
import type { SecurityHealthSummary as Summary, ApiKeyWithAge } from '../../types/security';

import { findKeysForIntegration, getBestHealthForIntegration } from './integration-health-helpers';

export function useSecurityHealthData() {
  const router = useRouter();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [healthStatuses, setHealthStatuses] = useState<Map<string, IntegrationHealth>>(new Map());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [keysNeedingAttention, setKeysNeedingAttention] = useState<ApiKeyWithAge[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load API keys from database
  const loadApiKeys = useCallback(async () => {
    const result = await fetchAllApiKeys();
    if (result.success) {
      setApiKeys(result.keys);
      return result.keys;
    } else {
      setError(result.error || 'Failed to load API keys');
      return [];
    }
  }, []);

  // Handle health status updates from batch check
  const handleHealthResult = useCallback((service: string, health: IntegrationHealth) => {
    setHealthStatuses((prev) => {
      const next = new Map(prev);
      next.set(service, health);
      return next;
    });
  }, []);

  // Load health statuses - check field keys that exist in database
  const loadHealthStatuses = useCallback(async (configuredKeys: ApiKeyRecord[]) => {
    // Get all configured service names from the database
    const configuredServiceNames = configuredKeys.map((k) => k.service);

    if (configuredServiceNames.length === 0) {
      return; // No configured keys to check
    }

    await batchHealthCheck(configuredServiceNames, undefined, handleHealthResult);
  }, [handleHealthResult]);

  // Calculate summary when data changes
  useEffect(() => {
    if (apiKeys.length > 0) {
      const newSummary = getSecurityHealthSummary(apiKeys, healthStatuses);
      setSummary(newSummary);

      const attention = getKeysNeedingAttention(apiKeys, healthStatuses);
      setKeysNeedingAttention(attention);
    } else {
      setSummary(null);
      setKeysNeedingAttention([]);
    }
  }, [apiKeys, healthStatuses]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // First load API keys, then check health only for configured ones
        const keys = await loadApiKeys();
        if (keys.length > 0) {
          await loadHealthStatuses(keys);
        }
      } catch (err) {
        console.error('[SecurityHealthScreen] Load error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [loadApiKeys, loadHealthStatuses]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const keys = await loadApiKeys();
      if (keys.length > 0) {
        await loadHealthStatuses(keys);
      }
    } catch (err) {
      console.error('[SecurityHealthScreen] Refresh error:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setIsRefreshing(false);
    }
  }, [loadApiKeys, loadHealthStatuses]);

  // Navigate to integrations screen
  const handleNavigateToIntegrations = useCallback(() => {
    router.push('/(admin)/integrations');
  }, [router]);

  // Build integration grid items
  const integrationGridItems: IntegrationGridItem[] = useMemo(() => {
    return INTEGRATIONS.map((integration) => {
      // Find keys in database that belong to this integration
      const integrationKeys = findKeysForIntegration(integration, apiKeys);
      const isConfigured = integrationKeys.length > 0;

      // Get health status from any of the field keys
      const health = getBestHealthForIntegration(integration, healthStatuses);

      // Get the most recent date from any configured key
      let latestUpdate: string | null = null;
      let earliestCreate: string | null = null;

      for (const key of integrationKeys) {
        if (key.updated_at) {
          if (!latestUpdate || new Date(key.updated_at) > new Date(latestUpdate)) {
            latestUpdate = key.updated_at;
          }
        }
        if (key.created_at) {
          if (!earliestCreate || new Date(key.created_at) < new Date(earliestCreate)) {
            earliestCreate = key.created_at;
          }
        }
      }

      return {
        id: integration.id,
        name: integration.name,
        service: integration.service,
        status: health?.status || (isConfigured ? 'configured' : 'not-configured'),
        updatedAt: latestUpdate,
        createdAt: earliestCreate,
        requiresOAuth: integration.requiresOAuth,
        group: integration.group,
      };
    });
  }, [healthStatuses, apiKeys]);

  // Calculate subtitle for score card
  const scoreSubtitle = useMemo(() => {
    if (!summary) return undefined;
    const attentionCount = keysNeedingAttention.length;
    if (attentionCount === 0) return 'All keys are current';
    return `${attentionCount} key${attentionCount > 1 ? 's' : ''} need${attentionCount === 1 ? 's' : ''} attention`;
  }, [summary, keysNeedingAttention]);

  return {
    isLoading,
    isRefreshing,
    summary,
    keysNeedingAttention,
    error,
    scoreSubtitle,
    integrationGridItems,
    handleRefresh,
    handleNavigateToIntegrations,
  };
}
