// src/stores/integrations-store.ts
// Zustand store for managing third-party integrations

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import {
  IntegrationProvider,
  IntegrationStatus,
  SeamConfig,
  TracerfyConfig,
  DEFAULT_SEAM_CONFIG,
  DEFAULT_TRACERFY_CONFIG,
} from '@/features/integrations/types';

interface IntegrationRecord {
  id: string;
  user_id: string;
  provider: IntegrationProvider;
  enabled: boolean;
  api_key?: string;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  last_checked_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

interface IntegrationsState {
  seam: SeamConfig;
  tracerfy: TracerfyConfig;
  isLoading: boolean;
  error: Error | null;

  // Actions
  fetchIntegrations: () => Promise<void>;
  updateSeamConfig: (config: Partial<SeamConfig>) => Promise<void>;
  updateTracerfyConfig: (config: Partial<TracerfyConfig>) => Promise<void>;
  testConnection: (provider: IntegrationProvider) => Promise<boolean>;
  disconnectIntegration: (provider: IntegrationProvider) => Promise<void>;
  clearError: () => void;
}

export const useIntegrationsStore = create<IntegrationsState>((set, get) => ({
  seam: DEFAULT_SEAM_CONFIG,
  tracerfy: DEFAULT_TRACERFY_CONFIG,
  isLoading: false,
  error: null,

  fetchIntegrations: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.user.id);

      if (error) throw error;

      const integrations = data as IntegrationRecord[];

      // Parse integrations into state
      const seamRecord = integrations.find((i) => i.provider === 'seam');
      const tracerfyRecord = integrations.find((i) => i.provider === 'tracerfy');

      set({
        seam: seamRecord
          ? {
              provider: 'seam',
              enabled: seamRecord.enabled,
              apiKey: seamRecord.api_key,
              status: seamRecord.status,
              supportedBrands: (seamRecord.config?.supportedBrands as string[]) || ['schlage'],
              workspaceId: seamRecord.config?.workspaceId as string | undefined,
              lastChecked: seamRecord.last_checked_at,
              error: seamRecord.error_message,
            }
          : DEFAULT_SEAM_CONFIG,
        tracerfy: tracerfyRecord
          ? {
              provider: 'tracerfy',
              enabled: tracerfyRecord.enabled,
              apiKey: tracerfyRecord.api_key,
              status: tracerfyRecord.status,
              autoSkipTrace: (tracerfyRecord.config?.autoSkipTrace as boolean) ?? true,
              autoMatchToProperty: (tracerfyRecord.config?.autoMatchToProperty as boolean) ?? true,
              creditsRemaining: tracerfyRecord.config?.creditsRemaining as number | undefined,
              lastChecked: tracerfyRecord.last_checked_at,
              error: tracerfyRecord.error_message,
            }
          : DEFAULT_TRACERFY_CONFIG,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },

  updateSeamConfig: async (config: Partial<SeamConfig>) => {
    set({ isLoading: true, error: null });
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const currentSeam = get().seam;
      const newConfig: SeamConfig = { ...currentSeam, ...config };

      const { error } = await supabase
        .from('user_integrations')
        .upsert(
          {
            user_id: user.user.id,
            provider: 'seam',
            enabled: newConfig.enabled,
            api_key: newConfig.apiKey,
            status: newConfig.status,
            config: {
              supportedBrands: newConfig.supportedBrands,
              workspaceId: newConfig.workspaceId,
            },
            last_checked_at: newConfig.lastChecked,
            error_message: newConfig.error,
          },
          {
            onConflict: 'user_id,provider',
          }
        );

      if (error) throw error;

      set({ seam: newConfig, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  updateTracerfyConfig: async (config: Partial<TracerfyConfig>) => {
    set({ isLoading: true, error: null });
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const currentTracerfy = get().tracerfy;
      const newConfig: TracerfyConfig = { ...currentTracerfy, ...config };

      const { error } = await supabase
        .from('user_integrations')
        .upsert(
          {
            user_id: user.user.id,
            provider: 'tracerfy',
            enabled: newConfig.enabled,
            api_key: newConfig.apiKey,
            status: newConfig.status,
            config: {
              autoSkipTrace: newConfig.autoSkipTrace,
              autoMatchToProperty: newConfig.autoMatchToProperty,
              creditsRemaining: newConfig.creditsRemaining,
            },
            last_checked_at: newConfig.lastChecked,
            error_message: newConfig.error,
          },
          {
            onConflict: 'user_id,provider',
          }
        );

      if (error) throw error;

      set({ tracerfy: newConfig, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  testConnection: async (provider: IntegrationProvider) => {
    const state = get();
    const config = provider === 'seam' ? state.seam : state.tracerfy;

    if (!config.apiKey) {
      return false;
    }

    // TODO: Implement actual API connection tests via edge functions
    // For now, just mark as connected if API key is present
    try {
      if (provider === 'seam') {
        await state.updateSeamConfig({
          status: 'connected',
          lastChecked: new Date().toISOString(),
          error: undefined,
        });
      } else {
        await state.updateTracerfyConfig({
          status: 'connected',
          lastChecked: new Date().toISOString(),
          error: undefined,
        });
      }
      return true;
    } catch {
      return false;
    }
  },

  disconnectIntegration: async (provider: IntegrationProvider) => {
    set({ isLoading: true, error: null });
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', user.user.id)
        .eq('provider', provider);

      if (error) throw error;

      if (provider === 'seam') {
        set({ seam: DEFAULT_SEAM_CONFIG, isLoading: false });
      } else {
        set({ tracerfy: DEFAULT_TRACERFY_CONFIG, isLoading: false });
      }
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

// Selectors
export const selectSeamConfig = (state: IntegrationsState) => state.seam;
export const selectTracerfyConfig = (state: IntegrationsState) => state.tracerfy;
export const selectIsSeamConnected = (state: IntegrationsState) =>
  state.seam.status === 'connected' && state.seam.enabled;
export const selectIsTracerfyConnected = (state: IntegrationsState) =>
  state.tracerfy.status === 'connected' && state.tracerfy.enabled;
