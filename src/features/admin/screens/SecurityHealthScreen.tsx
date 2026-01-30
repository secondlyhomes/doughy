// src/features/admin/screens/SecurityHealthScreen.tsx
// Main security health dashboard screen

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';

import { SecurityScoreCard } from '../components/SecurityScoreCard';
import { KeyHealthSummary } from '../components/KeyHealthSummary';
import { IntegrationStatusGrid, type IntegrationGridItem } from '../components/IntegrationStatusGrid';
import { KeyAgeDistributionBar } from '../components/KeyAgeDistributionBar';
import { EnvironmentBadge } from '../components/EnvironmentBadge';

import {
  fetchAllApiKeys,
  getSecurityHealthSummary,
  getKeysNeedingAttention,
} from '../services/securityHealthService';
import { batchHealthCheck } from '../services/apiKeyHealthService';
import { INTEGRATIONS } from '../data/integrationData';
import type { IntegrationHealth, ApiKeyRecord } from '../types/integrations';
import type { SecurityHealthSummary as Summary, ApiKeyWithAge } from '../types/security';

/**
 * Get all field keys for an integration
 * This maps integration service names to their database field keys
 */
function getIntegrationFieldKeys(integration: (typeof INTEGRATIONS)[number]): string[] {
  return integration.fields.map((f) => f.key);
}

/**
 * Find API keys in database that belong to an integration
 */
function findKeysForIntegration(
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
function getBestHealthForIntegration(
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

export function SecurityHealthScreen() {
  const router = useRouter();
  const colors = useThemeColors();

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

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: SPACING.md,
          paddingTop: SPACING.md,
          paddingBottom: TAB_BAR_SAFE_PADDING + SPACING['4xl'] * 2,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header with environment badge */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.md,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: colors.foreground,
            }}
          >
            Security Health
          </Text>
          <EnvironmentBadge />
        </View>

        {/* Error message */}
        {error && (
          <View
            style={{
              backgroundColor: colors.destructive + '20',
              padding: 12,
              borderRadius: BORDER_RADIUS.md,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: colors.destructive }}>{error}</Text>
          </View>
        )}

        {/* AI Security Firewall Link */}
        <TouchableOpacity
          onPress={() => router.push('/(admin)/security/ai-firewall')}
          style={{
            backgroundColor: colors.card,
            borderRadius: BORDER_RADIUS.lg,
            padding: 16,
            marginBottom: SPACING.md,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: BORDER_RADIUS['2xl'],
              backgroundColor: colors.primary + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="shield" size={ICON_SIZES.lg} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
              AI Security Firewall
            </Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
              Circuit breakers, threat tracking, pattern monitoring
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={ICON_SIZES.lg} color={colors.mutedForeground} />
        </TouchableOpacity>

        {/* Security Score Card */}
        <SecurityScoreCard
          score={summary?.score ?? 0}
          loading={isLoading}
          subtitle={scoreSubtitle}
        />

        {/* Key Health Summary */}
        <KeyHealthSummary summary={summary} loading={isLoading} />

        {/* Key Age Distribution */}
        <KeyAgeDistributionBar summary={summary} loading={isLoading} />

        {/* Integration Status Grid */}
        <IntegrationStatusGrid
          integrations={integrationGridItems}
          onNavigate={handleNavigateToIntegrations}
          loading={isLoading}
        />

        {/* Keys Needing Attention */}
        {keysNeedingAttention.length > 0 && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: BORDER_RADIUS.lg,
              padding: 16,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground,
                marginBottom: 12,
              }}
            >
              Keys Needing Attention
            </Text>

            {keysNeedingAttention.slice(0, 5).map((key) => (
              <View
                key={key.service}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: key.hasError
                      ? colors.destructive
                      : key.ageStatus === 'stale'
                      ? colors.destructive
                      : colors.warning,
                    marginRight: 8,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: colors.foreground }}>
                    {key.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                    {key.hasError
                      ? 'Has errors'
                      : key.ageDays > 0
                      ? `Updated ${key.ageDays} days ago`
                      : 'Unknown age'}
                  </Text>
                </View>
              </View>
            ))}

            {keysNeedingAttention.length > 5 && (
              <Text
                style={{
                  fontSize: 12,
                  color: colors.primary,
                  marginTop: 8,
                  textAlign: 'center',
                }}
                onPress={handleNavigateToIntegrations}
              >
                +{keysNeedingAttention.length - 5} more
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </ThemedSafeAreaView>
  );
}
