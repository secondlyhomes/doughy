// src/features/integrations/hooks/useIntegrations.ts
// React Query hooks for integrations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIntegrationsStore, selectSeamConfig, selectTracerfyConfig } from '@/stores/integrations-store';
import { IntegrationProvider, SeamConfig, TracerfyConfig } from '../types';

// Query key factory
export const integrationKeys = {
  all: ['integrations'] as const,
  seam: () => [...integrationKeys.all, 'seam'] as const,
  tracerfy: () => [...integrationKeys.all, 'tracerfy'] as const,
};

/**
 * Hook to fetch all integrations
 */
export function useIntegrations() {
  const store = useIntegrationsStore();

  return useQuery({
    queryKey: integrationKeys.all,
    queryFn: async () => {
      await store.fetchIntegrations();
      return {
        seam: store.seam,
        tracerfy: store.tracerfy,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get Seam configuration
 */
export function useSeamConfig() {
  const seam = useIntegrationsStore(selectSeamConfig);
  const { isLoading, error } = useIntegrations();

  return {
    config: seam,
    isLoading,
    error,
    isConnected: seam.status === 'connected' && seam.enabled,
  };
}

/**
 * Hook to get Tracerfy configuration
 */
export function useTracerfyConfig() {
  const tracerfy = useIntegrationsStore(selectTracerfyConfig);
  const { isLoading, error } = useIntegrations();

  return {
    config: tracerfy,
    isLoading,
    error,
    isConnected: tracerfy.status === 'connected' && tracerfy.enabled,
  };
}

/**
 * Hook for integration mutations
 */
export function useIntegrationMutations() {
  const queryClient = useQueryClient();
  const store = useIntegrationsStore();

  const updateSeamMutation = useMutation({
    mutationFn: (config: Partial<SeamConfig>) => store.updateSeamConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.all });
    },
  });

  const updateTracerfyMutation = useMutation({
    mutationFn: (config: Partial<TracerfyConfig>) => store.updateTracerfyConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.all });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: (provider: IntegrationProvider) => store.testConnection(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.all });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (provider: IntegrationProvider) => store.disconnectIntegration(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.all });
    },
  });

  return {
    updateSeam: updateSeamMutation.mutateAsync,
    updateTracerfy: updateTracerfyMutation.mutateAsync,
    testConnection: testConnectionMutation.mutateAsync,
    disconnect: disconnectMutation.mutateAsync,
    isUpdating: updateSeamMutation.isPending || updateTracerfyMutation.isPending,
    isTesting: testConnectionMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    isSaving:
      updateSeamMutation.isPending ||
      updateTracerfyMutation.isPending ||
      testConnectionMutation.isPending ||
      disconnectMutation.isPending,
  };
}
