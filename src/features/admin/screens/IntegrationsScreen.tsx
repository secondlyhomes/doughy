// src/features/admin/screens/IntegrationsScreen.tsx
// Integrations management screen - matches Users/Logs admin pattern

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { XCircle, ExternalLink, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useKeyboardAvoidance } from '@/hooks';
import { withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import { SearchBar, TAB_BAR_SAFE_PADDING, Skeleton } from '@/components/ui';
import { SPACING } from '@/constants/design-tokens';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/Accordion';
import { INTEGRATIONS } from '../data/integrationData';
import { ApiKeyFormItem } from '../components/ApiKeyFormItem';
import { IntegrationHealthCard } from '../components/IntegrationHealthCard';
import { KeyAgeIndicator } from '../components/KeyAgeIndicator';
import { EnvironmentBadge } from '../components/EnvironmentBadge';
import { batchHealthCheck, clearHealthCache, checkCredentialsExist } from '../services/apiKeyHealthService';
import { fetchAllApiKeys, getKeyAgeStatus, calculateKeyAgeDays, getEffectiveDate } from '../services/securityHealthService';
import type { Integration, IntegrationHealth, IntegrationStatus, ApiKeyRecord } from '../types/integrations';

// Extracted components
import {
  type StatusFilter,
  type IntegrationWithHealth,
  StatusBadge,
  FilterPill,
} from './integrations';

export function IntegrationsScreen() {
  const colors = useThemeColors();
  const keyboardProps = useKeyboardAvoidance({ hasNavigationHeader: false });

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

  // Render integration accordion item
  const renderIntegration = useCallback(({ item }: { item: IntegrationWithHealth }) => {
    const isExpanded = expandedIntegration === item.id;

    return (
      <View
        className="mx-4 mb-3 rounded-xl"
        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
      >
        <Accordion
          type="single"
          collapsible
          value={isExpanded ? item.id : ''}
          onValueChange={setExpandedIntegration}
        >
          <AccordionItem value={item.id} className="border-b-0">
            <AccordionTrigger className="px-4">
              <View className="flex-row items-center flex-1 pr-2">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-semibold" style={{ color: colors.foreground }}>
                      {item.name}
                    </Text>
                    <StatusBadge status={item.overallStatus} colors={colors} />
                    {item.overallStatus !== 'not-configured' && (item.updatedAt || item.createdAt) && (
                      <KeyAgeIndicator
                        updatedAt={item.updatedAt ?? null}
                        createdAt={item.createdAt ?? null}
                        compact
                      />
                    )}
                  </View>
                  <Text
                    className="text-sm mt-0.5"
                    style={{ color: colors.mutedForeground }}
                    numberOfLines={1}
                  >
                    {item.description}
                  </Text>
                </View>
              </View>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <View className="gap-3 pt-2">
                {item.fields.map((field) => {
                  const fieldKey = apiKeys.get(field.key);
                  return (
                    <ApiKeyFormItem
                      key={field.key}
                      service={field.key}
                      label={field.label}
                      type={field.type}
                      required={field.required}
                      options={field.options}
                      placeholder={field.placeholder}
                      description={field.description}
                      healthStatus={healthStatuses.get(field.key)?.status}
                      updatedAt={fieldKey?.updated_at}
                      createdAt={fieldKey?.created_at}
                      showAgeIndicator={true}
                      onSaved={(healthResult) => {
                        if (healthResult) {
                          handleHealthResult(healthResult.service, healthResult);
                          if (healthResult.service !== item.service) {
                            handleHealthResult(item.service, healthResult);
                          }
                        }
                        setApiKeyRefreshTrigger((prev) => prev + 1);
                        loadApiKeys();
                      }}
                    />
                  );
                })}
              </View>

              {item.docsUrl && (
                <TouchableOpacity
                  className="flex-row items-center mt-3 pt-3"
                  style={{ borderTopWidth: 1, borderTopColor: colors.border }}
                  onPress={async () => {
                    try {
                      const canOpen = await Linking.canOpenURL(item.docsUrl!);
                      if (canOpen) {
                        await Linking.openURL(item.docsUrl!);
                      } else {
                        Alert.alert('Cannot Open', 'Unable to open the documentation link on this device.');
                      }
                    } catch (error) {
                      console.error('[IntegrationsScreen] Failed to open docs URL:', error);
                      Alert.alert('Error', 'Failed to open the documentation link.');
                    }
                  }}
                >
                  <ExternalLink size={14} color={colors.primary} />
                  <Text className="text-sm ml-1.5 font-medium" style={{ color: colors.primary }}>
                    View Documentation
                  </Text>
                </TouchableOpacity>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </View>
    );
  }, [colors, healthStatuses, handleHealthResult, expandedIntegration, apiKeys, loadApiKeys]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          behavior={keyboardProps.behavior}
          keyboardVerticalOffset={keyboardProps.keyboardVerticalOffset}
          className="flex-1"
          style={{ backgroundColor: colors.background }}
        >
        {/* Header with environment badge */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: SPACING.md,
            paddingTop: SPACING.sm,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>
            Integrations
          </Text>
          <EnvironmentBadge />
        </View>

        {/* Search Bar */}
        <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.xs }}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={isLoading ? 'Search integrations...' : `Search ${integrationsWithHealth.length} integrations...`}
            size="md"
            glass={true}
            onFilter={() => setShowFilters(!showFilters)}
            hasActiveFilters={statusFilter !== 'all'}
          />
        </View>

        {/* Filter Pills */}
        {showFilters && (
          <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
            <View className="flex-row flex-wrap gap-2">
              <FilterPill label="All" count={statusCounts.all} active={statusFilter === 'all'} onPress={() => setStatusFilter('all')} colors={colors} />
              <FilterPill label="Operational" count={statusCounts.operational} active={statusFilter === 'operational'} onPress={() => setStatusFilter('operational')} color={colors.success} colors={colors} />
              <FilterPill label="Error" count={statusCounts.error} active={statusFilter === 'error'} onPress={() => setStatusFilter('error')} color={colors.destructive} colors={colors} />
              <FilterPill label="Not Set" count={statusCounts['not-configured']} active={statusFilter === 'not-configured'} onPress={() => setStatusFilter('not-configured')} colors={colors} />
              {statusCounts['needs-rotation'] > 0 && (
                <FilterPill label="Needs Rotation" count={statusCounts['needs-rotation']} active={statusFilter === 'needs-rotation'} onPress={() => setStatusFilter('needs-rotation')} color={colors.warning} colors={colors} />
              )}
            </View>
          </View>
        )}

        {/* Content: Loading skeletons or Integration List */}
        {isLoading && !integrationsWithHealth?.length ? (
          <View style={{ paddingHorizontal: SPACING.md }}>
            {healthProgress && (
              <View className="mb-4">
                <Text className="text-sm text-center mb-2" style={{ color: colors.mutedForeground }}>
                  Checking integrations... {healthProgress.completed} of {healthProgress.total}
                </Text>
                <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.muted }}>
                  <View
                    className="h-full rounded-full"
                    style={{ backgroundColor: colors.primary, width: `${(healthProgress.completed / healthProgress.total) * 100}%` }}
                  />
                </View>
              </View>
            )}
            <Skeleton className="h-24 rounded-xl mb-3" />
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className="mb-3">
                <Skeleton className="h-20 rounded-xl" />
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={filteredIntegrations}
            keyExtractor={(item) => item.id}
            renderItem={renderIntegration}
            extraData={expandedIntegration}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
            ListHeaderComponent={
              <View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.sm }}>
                {isRefreshing && healthProgress && (
                  <View className="mb-3">
                    <Text className="text-sm text-center mb-2" style={{ color: colors.mutedForeground }}>
                      Checking integrations... {healthProgress.completed} of {healthProgress.total}
                    </Text>
                    <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.muted }}>
                      <View
                        className="h-full rounded-full"
                        style={{ backgroundColor: colors.primary, width: `${(healthProgress.completed / healthProgress.total) * 100}%` }}
                      />
                    </View>
                  </View>
                )}
                <IntegrationHealthCard refreshTrigger={apiKeyRefreshTrigger} />
                {loadError && (
                  <TouchableOpacity
                    className="flex-row items-center p-3 rounded-xl mb-3"
                    style={{ backgroundColor: withOpacity(colors.destructive, 'muted') }}
                    onPress={loadAllHealth}
                  >
                    <AlertTriangle size={18} color={colors.destructive} />
                    <View className="flex-1 ml-2">
                      <Text className="text-sm font-medium" style={{ color: colors.destructive }}>
                        {loadError}
                      </Text>
                      <Text className="text-xs mt-0.5" style={{ color: colors.destructive }}>
                        Tap to retry
                      </Text>
                    </View>
                    <RefreshCw size={16} color={colors.destructive} />
                  </TouchableOpacity>
                )}
                {filteredIntegrations.length !== integrationsWithHealth.length && (
                  <Text className="text-xs mt-2 text-center" style={{ color: colors.mutedForeground }}>
                    Showing {filteredIntegrations.length} of {integrationsWithHealth.length} integrations
                  </Text>
                )}
              </View>
            }
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-24">
                <XCircle size={48} color={colors.mutedForeground} />
                <Text className="mt-4 text-base" style={{ color: colors.mutedForeground }}>
                  No integrations found
                </Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}
            contentInsetAdjustmentBehavior="automatic"
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={8}
          />
        )}
        </KeyboardAvoidingView>
      </ThemedSafeAreaView>
    </GestureHandlerRootView>
  );
}
