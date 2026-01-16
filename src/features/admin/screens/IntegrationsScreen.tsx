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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import {
  SearchBar,
  LoadingSpinner,
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
import { checkAllIntegrations, clearHealthCache } from '../services/apiKeyHealthService';
import type { Integration, IntegrationHealth, IntegrationStatus } from '../types/integrations';

// Filter type for status filtering
type StatusFilter = 'all' | 'operational' | 'error' | 'not-configured' | 'configured';

// Spacing constants for floating search bar
const SEARCH_BAR_CONTAINER_HEIGHT =
  SPACING.sm +  // pt-2 (8px top padding)
  48 +          // SearchBar size="lg" height
  SPACING.xs;   // pb-1 (4px bottom padding)
  // Total: ~60px

const FILTER_PILLS_HEIGHT = 40; // Approximate height of filter pills row
const SEARCH_BAR_TO_CONTENT_GAP = SPACING.md; // 12px gap

// Extended integration type with health data
interface IntegrationWithHealth extends Integration {
  health?: IntegrationHealth;
  overallStatus: IntegrationStatus;
}

export function IntegrationsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [healthStatuses, setHealthStatuses] = useState<Map<string, IntegrationHealth>>(new Map());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedIntegration, setExpandedIntegration] = useState<string>('');

  // Load all health statuses
  const loadAllHealth = useCallback(async () => {
    try {
      const allServices = INTEGRATIONS.flatMap((i) => i.fields.map((f) => f.key));
      const results = await checkAllIntegrations(allServices);

      const healthMap = new Map<string, IntegrationHealth>();
      results.forEach((health) => {
        healthMap.set(health.service, health);
      });
      setHealthStatuses(healthMap);
    } catch (error) {
      console.error('Error loading health:', error);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadAllHealth().finally(() => setIsLoading(false));
  }, [loadAllHealth]);

  const handleRefresh = useCallback(async () => {
    // Clear all cached health data to force fresh checks
    clearHealthCache();
    setIsRefreshing(true);
    await loadAllHealth();
    setIsRefreshing(false);
  }, [loadAllHealth]);

  // Get overall status for an integration (based on its fields)
  const getOverallStatus = useCallback(
    (integration: Integration): IntegrationStatus => {
      const fieldStatuses = integration.fields.map(
        (field) => healthStatuses.get(field.key)?.status || 'not-configured'
      );

      // If any field has error, overall is error
      if (fieldStatuses.includes('error')) return 'error';
      // If all required fields are operational, overall is operational
      const requiredFields = integration.fields.filter((f) => f.required);
      const requiredStatuses = requiredFields.map(
        (f) => healthStatuses.get(f.key)?.status || 'not-configured'
      );
      if (requiredStatuses.length > 0 && requiredStatuses.every((s) => s === 'operational')) {
        return 'operational';
      }
      // If any field is configured, overall is configured
      if (fieldStatuses.includes('operational') || fieldStatuses.includes('configured')) {
        return 'configured';
      }
      return 'not-configured';
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

  // Render integration accordion item
  const renderIntegration = ({ item }: { item: IntegrationWithHealth }) => {
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
          onValueChange={(value) => setExpandedIntegration(value)}
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
  };

  // Loading state with skeletons - matches floating search bar layout
  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={[]}>
        {/* Floating search bar skeleton */}
        <View className="absolute top-0 left-0 right-0 z-10" style={{ paddingTop: insets.top }}>
          <View className="px-4 pt-2 pb-1">
            <Skeleton className="h-12 rounded-full" />
          </View>
        </View>

        {/* Content skeletons with matching paddingTop */}
        <View style={{ paddingTop: SEARCH_BAR_CONTAINER_HEIGHT + insets.top + SEARCH_BAR_TO_CONTENT_GAP }}>
          <View className="px-4">
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

  // Calculate dynamic padding based on filter visibility (includes insets.top since we handle safe area manually)
  const listPaddingTop = SEARCH_BAR_CONTAINER_HEIGHT + insets.top + SEARCH_BAR_TO_CONTENT_GAP + (showFilters ? FILTER_PILLS_HEIGHT : 0);

  return (
    <ThemedSafeAreaView className="flex-1" edges={[]}>
      {/* Floating Glass Search Bar - positioned absolutely at top */}
      <View className="absolute top-0 left-0 right-0 z-10" style={{ paddingTop: insets.top }}>
        <View className="px-4 pt-2 pb-1">
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search integrations..."
            size="lg"
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
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View className="px-4 mb-3">
            <IntegrationHealthCard />
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
      />
    </ThemedSafeAreaView>
  );
}

// Status badge component
interface StatusBadgeProps {
  status: IntegrationStatus;
  colors: ReturnType<typeof useThemeColors>;
}

function StatusBadge({ status, colors }: StatusBadgeProps) {
  const config = {
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
}

// Filter pill component - matches Users/Logs screens
interface FilterPillProps {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
  color?: string;
  colors: ReturnType<typeof useThemeColors>;
}

function FilterPill({ label, count, active, onPress, color, colors }: FilterPillProps) {
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
}
