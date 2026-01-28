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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useKeyboardAvoidance } from '@/hooks';
import { withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import {
  SearchBar,
  TAB_BAR_SAFE_PADDING,
  Skeleton,
} from '@/components/ui';
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
import { batchHealthCheck, clearHealthCache } from '../services/apiKeyHealthService';
import type { Integration, IntegrationHealth, IntegrationStatus } from '../types/integrations';

// Filter type for status filtering
type StatusFilter = 'all' | 'operational' | 'error' | 'not-configured' | 'configured';

// Spacing constants for floating search bar
const SEARCH_BAR_CONTAINER_HEIGHT =
  SPACING.sm +  // pt-2 (8px top padding)
  40 +          // SearchBar size="md" estimated height
  SPACING.xs;   // pb-1 (4px bottom padding)
  // Total: ~52px

const FILTER_PILLS_HEIGHT = 40; // Approximate height of filter pills row
const SEARCH_BAR_TO_CONTENT_GAP = SPACING.lg; // 16px comfortable gap

// Extended integration type with health data
interface IntegrationWithHealth extends Integration {
  health?: IntegrationHealth;
  overallStatus: IntegrationStatus;
}

export function IntegrationsScreen() {
  const colors = useThemeColors();
  const keyboardProps = useKeyboardAvoidance({ hasNavigationHeader: true });
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [healthStatuses, setHealthStatuses] = useState<Map<string, IntegrationHealth>>(new Map());
  const [healthProgress, setHealthProgress] = useState<{ completed: number; total: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedIntegration, setExpandedIntegration] = useState<string>('');

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

  // Load all health statuses with progress feedback and progressive updates
  const loadAllHealth = useCallback(async () => {
    setLoadError(null); // Clear previous errors
    try {
      // Check per integration (16 services) instead of per field (40+ services)
      // This reduces API calls by ~60% while still getting accurate status
      const allServices = INTEGRATIONS.map((i) => i.service);
      setHealthProgress({ completed: 0, total: allServices.length });

      await batchHealthCheck(allServices, handleHealthProgress, handleHealthResult);
    } catch (error) {
      console.error('Error loading health:', error);
      const message = error instanceof Error
        ? error.message
        : 'Failed to check integration health. Please try again.';
      setLoadError(message);
    } finally {
      setHealthProgress(null);
    }
  }, [handleHealthProgress, handleHealthResult]);

  useEffect(() => {
    setIsLoading(true);
    loadAllHealth().finally(() => setIsLoading(false));
  }, [loadAllHealth]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setLoadError(null);

    try {
      // Only refresh items older than 1 minute (selective refresh)
      const STALE_THRESHOLD = 60 * 1000; // 1 minute
      const now = Date.now();

      const staleServices = INTEGRATIONS
        .filter((i) => {
          const health = healthStatuses.get(i.service);
          if (!health?.lastChecked) return true; // Never checked
          return now - health.lastChecked.getTime() > STALE_THRESHOLD;
        })
        .map((i) => i.service);

      if (staleServices.length > 0) {
        // Clear cache only for stale services
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
      setIsRefreshing(false); // Always reset refresh state
    }
  }, [healthStatuses, handleHealthProgress, handleHealthResult]);

  // Get overall status for an integration (based on primary service health check)
  const getOverallStatus = useCallback(
    (integration: Integration): IntegrationStatus => {
      // Use the integration's primary service health status
      const health = healthStatuses.get(integration.service);
      if (!health) return 'not-configured';
      return health.status;
    },
    [healthStatuses]
  );

  // Merge integrations with health data
  const integrationsWithHealth: IntegrationWithHealth[] = useMemo(() => {
    return INTEGRATIONS.map((integration) => ({
      ...integration,
      health: healthStatuses.get(integration.service),
      overallStatus: getOverallStatus(integration),
    }));
  }, [healthStatuses, getOverallStatus]);

  // Filter integrations by search and status
  const filteredIntegrations = useMemo(() => {
    return integrationsWithHealth.filter((integration) => {
      // Search filter
      const matchesSearch =
        !search ||
        integration.name.toLowerCase().includes(search.toLowerCase()) ||
        integration.description.toLowerCase().includes(search.toLowerCase()) ||
        integration.group.toLowerCase().includes(search.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === 'all' || integration.overallStatus === statusFilter;

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
      'not-configured': integrationsWithHealth.filter((i) => i.overallStatus === 'not-configured')
        .length,
    };
  }, [integrationsWithHealth]);

  // Render integration accordion item - memoized with useCallback for FlatList optimization
  const renderIntegration = useCallback(({ item }: { item: IntegrationWithHealth }) => {
    const isExpanded = expandedIntegration === item.id;

    return (
      <View
        className="mx-4 mb-3 rounded-xl overflow-hidden"
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}
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
                    <Text
                      className="text-base font-semibold"
                      style={{ color: colors.foreground }}
                    >
                      {item.name}
                    </Text>
                    <StatusBadge status={item.overallStatus} colors={colors} />
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
            <AccordionContent className="px-4">
              {/* Integration Fields */}
              <View className="gap-3 pt-2">
                {item.fields.map((field) => (
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
                    onSaved={handleRefresh}
                  />
                ))}
              </View>

              {/* Documentation Link */}
              {item.docsUrl && (
                <TouchableOpacity
                  className="flex-row items-center mt-4 pt-3"
                  style={{ borderTopWidth: 1, borderTopColor: colors.border }}
                  onPress={() => Linking.openURL(item.docsUrl!)}
                >
                  <ExternalLink size={14} color={colors.primary} />
                  <Text
                    className="text-sm ml-1.5 font-medium"
                    style={{ color: colors.primary }}
                  >
                    View Documentation
                  </Text>
                </TouchableOpacity>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </View>
    );
  }, [colors, healthStatuses, handleRefresh, expandedIntegration]);

  // Loading state with skeletons - matches floating search bar layout
  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={[]}>
        {/* Floating search bar skeleton */}
        <View className="absolute top-0 left-0 right-0 z-10" style={{ paddingTop: insets.top }}>
          <View className="px-4 pt-2 pb-1">
            <Skeleton className="h-10 rounded-full" />
          </View>
        </View>

        {/* Content skeletons with matching paddingTop */}
        <View style={{ paddingTop: SEARCH_BAR_CONTAINER_HEIGHT + insets.top + SEARCH_BAR_TO_CONTENT_GAP }}>
          <View className="px-4">
            {/* Progress indicator */}
            {healthProgress && (
              <View className="mb-4">
                <Text
                  className="text-sm text-center mb-2"
                  style={{ color: colors.mutedForeground }}
                >
                  Checking integrations... {healthProgress.completed} of {healthProgress.total}
                </Text>
                <View
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: colors.muted }}
                >
                  <View
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: colors.primary,
                      width: `${(healthProgress.completed / healthProgress.total) * 100}%`,
                    }}
                  />
                </View>
              </View>
            )}
            {/* IntegrationHealthCard skeleton */}
            <Skeleton className="h-24 rounded-xl mb-3" />
            {/* Integration cards skeleton */}
            {[1, 2, 3, 4].map((i) => (
              <View key={i} className="mb-3">
                <Skeleton className="h-20 rounded-xl" />
              </View>
            ))}
          </View>
        </View>
      </ThemedSafeAreaView>
    );
  }

  // Calculate dynamic padding based on filter visibility
  const listPaddingTop = SEARCH_BAR_CONTAINER_HEIGHT + insets.top + SEARCH_BAR_TO_CONTENT_GAP + (showFilters ? FILTER_PILLS_HEIGHT : 0);

  return (
    <ThemedSafeAreaView className="flex-1" edges={[]}>
      <KeyboardAvoidingView
        behavior={keyboardProps.behavior}
        keyboardVerticalOffset={keyboardProps.keyboardVerticalOffset}
        className="flex-1"
      >
      {/* Floating Glass Search Bar - positioned absolutely at top */}
      <View className="absolute top-0 left-0 right-0 z-10" style={{ paddingTop: insets.top }}>
        <View className="px-4 pt-2 pb-1">
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={`Search ${integrationsWithHealth.length} integrations...`}
            size="md"
            glass={true}
            onFilter={() => setShowFilters(!showFilters)}
            hasActiveFilters={statusFilter !== 'all'}
          />
        </View>

        {/* Filter Pills - same pattern as other screens */}
        {showFilters && (
          <View className="px-4 pb-2">
            <View className="flex-row flex-wrap gap-2">
              <FilterPill
                label="All"
                count={statusCounts.all}
                active={statusFilter === 'all'}
                onPress={() => setStatusFilter('all')}
                colors={colors}
              />
              <FilterPill
                label="Operational"
                count={statusCounts.operational}
                active={statusFilter === 'operational'}
                onPress={() => setStatusFilter('operational')}
                color={colors.success}
                colors={colors}
              />
              <FilterPill
                label="Error"
                count={statusCounts.error}
                active={statusFilter === 'error'}
                onPress={() => setStatusFilter('error')}
                color={colors.destructive}
                colors={colors}
              />
              <FilterPill
                label="Not Set"
                count={statusCounts['not-configured']}
                active={statusFilter === 'not-configured'}
                onPress={() => setStatusFilter('not-configured')}
                colors={colors}
              />
            </View>
          </View>
        )}
      </View>

      {/* Integration List - content scrolls beneath search bar */}
      <FlatList
        data={filteredIntegrations}
        keyExtractor={(item) => item.id}
        renderItem={renderIntegration}
        extraData={expandedIntegration}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View className="px-4 mb-3">
            {/* Progress indicator during refresh */}
            {isRefreshing && healthProgress && (
              <View className="mb-3">
                <Text
                  className="text-sm text-center mb-2"
                  style={{ color: colors.mutedForeground }}
                >
                  Checking integrations... {healthProgress.completed} of {healthProgress.total}
                </Text>
                <View
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: colors.muted }}
                >
                  <View
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: colors.primary,
                      width: `${(healthProgress.completed / healthProgress.total) * 100}%`,
                    }}
                  />
                </View>
              </View>
            )}
            <IntegrationHealthCard />
            {/* Error message with retry */}
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
            {/* Subtle count text */}
            {filteredIntegrations.length !== integrationsWithHealth.length && (
              <Text
                className="text-xs mt-2 text-center"
                style={{ color: colors.mutedForeground }}
              >
                Showing {filteredIntegrations.length} of {integrationsWithHealth.length} integrations
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-24">
            <XCircle size={48} color={colors.mutedForeground} />
            <Text
              className="mt-4 text-base"
              style={{ color: colors.mutedForeground }}
            >
              No integrations found
            </Text>
          </View>
        }
        contentContainerStyle={{
          paddingTop: listPaddingTop,
          paddingBottom: TAB_BAR_SAFE_PADDING, // Just breathing room - iOS auto-handles tab bar with NativeTabs
        }}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={8}
      />
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}

// Status badge component
interface StatusBadgeProps {
  status: IntegrationStatus;
  colors: ReturnType<typeof useThemeColors>;
}

const StatusBadge = React.memo(function StatusBadge({ status, colors }: StatusBadgeProps) {
  const config: Record<IntegrationStatus, { icon: typeof CheckCircle; color: string; label: string }> = {
    operational: {
      icon: CheckCircle,
      color: colors.success,
      label: 'Operational',
    },
    configured: {
      icon: Clock,
      color: colors.info,
      label: 'Configured',
    },
    error: {
      icon: XCircle,
      color: colors.destructive,
      label: 'Error',
    },
    'not-configured': {
      icon: XCircle,
      color: colors.mutedForeground,
      label: 'Not Set',
    },
    checking: {
      icon: Clock,
      color: colors.info,
      label: 'Checking',
    },
    active: {
      icon: CheckCircle,
      color: colors.success,
      label: 'Active',
    },
    inactive: {
      icon: XCircle,
      color: colors.mutedForeground,
      label: 'Inactive',
    },
  };

  const { icon: Icon, color, label } = config[status] || config['not-configured'];

  return (
    <View
      className="flex-row items-center px-2 py-0.5 rounded-full"
      style={{ backgroundColor: withOpacity(color, 'muted') }}
    >
      <Icon size={12} color={color} />
      <Text className="text-xs ml-1 font-medium" style={{ color }}>
        {label}
      </Text>
    </View>
  );
});

// Filter pill component - matches Users/Logs screens
interface FilterPillProps {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
  color?: string;
  colors: ReturnType<typeof useThemeColors>;
}

const FilterPill = React.memo(function FilterPill({ label, count, active, onPress, color, colors }: FilterPillProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center px-3 py-1.5 rounded-full"
      style={{ backgroundColor: active ? colors.primary : colors.muted }}
      onPress={onPress}
    >
      {color && !active && (
        <View
          className="w-2 h-2 rounded-full mr-1.5"
          style={{ backgroundColor: color }}
        />
      )}
      <Text
        className="text-sm"
        style={{ color: active ? colors.primaryForeground : colors.mutedForeground }}
      >
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <Text
          className="text-xs ml-1"
          style={{
            color: active
              ? withOpacity(colors.primaryForeground, 'strong')
              : colors.mutedForeground,
          }}
        >
          ({count})
        </Text>
      )}
    </TouchableOpacity>
  );
});
