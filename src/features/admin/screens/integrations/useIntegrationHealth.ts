// src/features/admin/screens/integrations/useIntegrationHealth.ts
// Hook encapsulating health check loading, refresh, filtering, and status derivation

import { useState, useEffect, useCallback, useMemo } from 'react';
import { INTEGRATIONS } from '../../data/integrationData';
import { batchHealthCheck, clearHealthCache, checkCredentialsExist } from '../../services/api-key-health';
import { fetchAllApiKeys, getKeyAgeStatus, calculateKeyAgeDays, getEffectiveDate } from '../../services/securityHealthService';
import type { Integration, IntegrationHealth, IntegrationStatus, ApiKeyRecord } from '../../types/integrations';
import type { StatusFilter, IntegrationWithHealth } from './types';

export function useIntegrationHealth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [healthStatuses, setHealthStatuses] = useState<Map<string, IntegrationHealth>>(new Map());
  const [credentialExists, setCredentialExists] = useState<Map<string, boolean>>(new Map());
  const [healthProgress, setHealthProgress] = useState<{ completed: number; total: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedIntegration, setExpandedIntegration] = useState<string>('');
  const [apiKeyRefreshTrigger, setApiKeyRefreshTrigger] = useState(0);
  const [apiKeys, setApiKeys] = useState<Map<string, ApiKeyRecord>>(new Map());

  // Shared callback for progressive health status updates
  const handleHealthResult = useCallback((service: string, health: IntegrationHealth) => {
    setHealthStatuses((prev) => {
      const next = new Map(prev);
      next.set(service, health);
      return next;
    });
  }, []);

  // Shared progress callback
  const handleHealthProgress = useCallback((completed: number, total: number) => {
    setHealthProgress({ completed, total });
  }, []);

  // Load API keys to get dates for age indicators
  const loadApiKeys = useCallback(async () => {
    try {
      const result = await fetchAllApiKeys();
      if (result.success) {
        const keyMap = new Map<string, ApiKeyRecord>();
        result.keys.forEach((key) => {
          keyMap.set(key.service, key);
        });
        setApiKeys(keyMap);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  }, []);

  // Check credential existence (fast, no decryption) for initial UI state
  const loadCredentialExistence = useCallback(async () => {
    try {
      const allServices = INTEGRATIONS.flatMap((i) =>
        i.fields.map((f) => f.key)
      );
      const existenceMap = await checkCredentialsExist(allServices);

      // Convert to simple boolean map
      const boolMap = new Map<string, boolean>();
      existenceMap.forEach((result, service) => {
        boolMap.set(service, result.exists);
      });
      setCredentialExists(boolMap);
    } catch (error) {
      console.error('Error checking credential existence:', error);
    }
  }, []);

  // Load all health statuses with progress feedback and progressive updates
  const loadAllHealth = useCallback(async () => {
    setLoadError(null);
    try {
      const allServices = INTEGRATIONS.map((i) => i.service);
      setHealthProgress({ completed: 0, total: allServices.length });

      // First, quickly check which credentials exist (no decryption)
      // This allows UI to show "checking" for existing creds vs "not-configured" for missing
      await loadCredentialExistence();

      await Promise.all([
        batchHealthCheck(allServices, handleHealthProgress, handleHealthResult),
        loadApiKeys(),
      ]);
    } catch (error) {
      console.error('Error loading health:', error);
      const message = error instanceof Error
        ? error.message
        : 'Failed to check integration health. Please try again.';
      setLoadError(message);
    } finally {
      setHealthProgress(null);
    }
  }, [handleHealthProgress, handleHealthResult, loadApiKeys, loadCredentialExistence]);

  useEffect(() => {
    setIsLoading(true);
    loadAllHealth().finally(() => setIsLoading(false));
  }, [loadAllHealth]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setLoadError(null);

    try {
      const STALE_THRESHOLD = 60 * 1000; // 1 minute
      const now = Date.now();

      const staleServices = INTEGRATIONS
        .filter((i) => {
          const health = healthStatuses.get(i.service);
          if (!health?.lastChecked) return true;
          return now - health.lastChecked.getTime() > STALE_THRESHOLD;
        })
        .map((i) => i.service);

      if (staleServices.length > 0) {
        staleServices.forEach((s) => clearHealthCache(s));
        setHealthProgress({ completed: 0, total: staleServices.length });
        await batchHealthCheck(staleServices, handleHealthProgress, handleHealthResult);
      }
    } catch (error) {
      console.error('Error refreshing health:', error);
      const message = error instanceof Error
        ? error.message
        : 'Failed to refresh. Please try again.';
      setLoadError(message);
    } finally {
      setHealthProgress(null);
      setIsRefreshing(false);
    }
  }, [healthStatuses, handleHealthProgress, handleHealthResult]);

  // Get overall status for an integration
  // Considers both health check results and credential existence
  const getOverallStatus = useCallback(
    (integration: Integration): IntegrationStatus => {
      const health = healthStatuses.get(integration.service);

      // If we have a health check result, use it
      if (health) {
        return health.status;
      }

      // No health result yet - check if credentials exist
      // If any field for this integration has credentials, show "checking"
      const hasCredentials = integration.fields.some(
        (field) => credentialExists.get(field.key) === true
      );

      if (hasCredentials) {
        // Credentials exist but health check hasn't completed yet
        return 'checking';
      }

      // No credentials found
      return 'not-configured';
    },
    [healthStatuses, credentialExists]
  );

  // Merge integrations with health data and key dates
  const integrationsWithHealth: IntegrationWithHealth[] = useMemo(() => {
    return INTEGRATIONS.map((integration) => {
      const apiKey = apiKeys.get(integration.service);
      const effectiveDate = apiKey ? getEffectiveDate(apiKey) : null;
      const ageDays = effectiveDate ? calculateKeyAgeDays(effectiveDate) : 0;
      const ageStatus = getKeyAgeStatus(ageDays);

      return {
        ...integration,
        health: healthStatuses.get(integration.service),
        overallStatus: getOverallStatus(integration),
        updatedAt: apiKey?.updated_at || null,
        createdAt: apiKey?.created_at || null,
        needsRotation: ageStatus === 'stale',
      };
    });
  }, [healthStatuses, getOverallStatus, apiKeys]);

  // Filter integrations by search and status
  const filteredIntegrations = useMemo(() => {
    return integrationsWithHealth.filter((integration) => {
      const matchesSearch =
        !search ||
        integration.name.toLowerCase().includes(search.toLowerCase()) ||
        integration.description.toLowerCase().includes(search.toLowerCase()) ||
        integration.group.toLowerCase().includes(search.toLowerCase());

      let matchesStatus = false;
      if (statusFilter === 'all') {
        matchesStatus = true;
      } else if (statusFilter === 'needs-rotation') {
        matchesStatus = integration.needsRotation === true;
      } else {
        matchesStatus = integration.overallStatus === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [integrationsWithHealth, search, statusFilter]);

  // Get status counts for filter badges
  const statusCounts = useMemo(() => {
    return {
      all: integrationsWithHealth.length,
      operational: integrationsWithHealth.filter((i) => i.overallStatus === 'operational').length,
      error: integrationsWithHealth.filter((i) => i.overallStatus === 'error').length,
      configured: integrationsWithHealth.filter((i) => i.overallStatus === 'configured').length,
      'not-configured': integrationsWithHealth.filter((i) => i.overallStatus === 'not-configured').length,
      'needs-rotation': integrationsWithHealth.filter((i) => i.needsRotation).length,
    };
  }, [integrationsWithHealth]);

  return {
    isLoading,
    isRefreshing,
    healthStatuses,
    healthProgress,
    loadError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    showFilters,
    setShowFilters,
    expandedIntegration,
    setExpandedIntegration,
    apiKeyRefreshTrigger,
    setApiKeyRefreshTrigger,
    apiKeys,
    integrationsWithHealth,
    filteredIntegrations,
    statusCounts,
    handleRefresh,
    handleHealthResult,
    loadAllHealth,
    loadApiKeys,
  };
}
