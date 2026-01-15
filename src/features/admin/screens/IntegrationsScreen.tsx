// src/features/admin/screens/IntegrationsScreen.tsx
// Integrations management screen with API key configuration

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Activity,
} from 'lucide-react-native';
import { useThemeColors, type ThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import { LoadingSpinner, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { INTEGRATIONS, getIntegrationsByGroup, getIntegrationGroups } from '../data/integrationData';
import { ApiKeyFormItem } from '../components/ApiKeyFormItem';
import { IntegrationHealthCard } from '../components/IntegrationHealthCard';
import { checkAllIntegrations } from '../services/apiKeyHealthService';
import type { ServiceGroup, IntegrationHealth, IntegrationStatus } from '../types/integrations';

type TabType = 'Health' | ServiceGroup;

export function IntegrationsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabType>('Health');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [healthStatuses, setHealthStatuses] = useState<Map<string, IntegrationHealth>>(new Map());
  const [allHealths, setAllHealths] = useState<IntegrationHealth[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const serviceGroups = getIntegrationGroups() as ServiceGroup[];
  const tabs: TabType[] = ['Health', ...serviceGroups];
  const activeIntegrations = activeTab !== 'Health' ? getIntegrationsByGroup(activeTab) : [];

  // Load all health statuses
  const loadAllHealth = useCallback(async () => {
    try {
      setIsCheckingHealth(true);
      const allServices = INTEGRATIONS.map((i) => i.service);
      const results = await checkAllIntegrations(allServices);

      // Add group info to each health result
      const healthsWithGroups = results.map((health) => {
        const integration = INTEGRATIONS.find((i) => i.service === health.service);
        return {
          ...health,
          group: integration?.group,
        };
      });

      setAllHealths(healthsWithGroups);
      setLastChecked(new Date());

      // Update the health status map
      const healthMap = new Map<string, IntegrationHealth>();
      healthsWithGroups.forEach((health) => {
        healthMap.set(health.service, health);
      });
      setHealthStatuses(healthMap);
    } catch (error) {
      console.error('Error loading health:', error);
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadAllHealth().finally(() => setIsLoading(false));
  }, [loadAllHealth]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadAllHealth();
    setIsRefreshing(false);
  }, [loadAllHealth]);

  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen />
      </ThemedSafeAreaView>
    );
  }

  // Get health counts by status
  const getStatusCount = (status: IntegrationStatus) => {
    return allHealths.filter((h) => h.status === status).length;
  };

  // Group healths by service group
  const healthsByGroup = serviceGroups.reduce(
    (acc, group) => {
      acc[group] = allHealths.filter((h) => h.group === group);
      return acc;
    },
    {} as Record<ServiceGroup, IntegrationHealth[]>
  );

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Tabs - wrapped in View to prevent flex expansion */}
      <View style={[styles.tabWrapper, { backgroundColor: withOpacity(colors.muted, 'opaque'), borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContent}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            const isHealthTab = tab === 'Health';
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  { borderBottomColor: isActive ? colors.primary : 'transparent' },
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <View style={styles.tabInner}>
                  {isHealthTab && <Activity size={14} color={isActive ? colors.primary : colors.mutedForeground} />}
                  <Text
                    style={[
                      styles.tabText,
                      { color: isActive ? colors.primary : colors.mutedForeground },
                    ]}
                  >
                    {tab}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Health Tab Content */}
      {activeTab === 'Health' ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING + insets.bottom }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Database Connection Health */}
          <IntegrationHealthCard />

          {/* Health Summary Card */}
          <View style={[styles.healthSummaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.healthSummaryHeader}>
              <Text style={[styles.healthSummaryTitle, { color: colors.foreground }]}>
                Integration Health Overview
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}
                disabled={isCheckingHealth}
              >
                {isCheckingHealth ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <RefreshCw size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.healthStatsRow}>
              <View style={[styles.healthStat, { backgroundColor: withOpacity(colors.success, 'subtle') }]}>
                <CheckCircle size={20} color={colors.success} />
                <Text style={[styles.healthStatNumber, { color: colors.success }]}>
                  {getStatusCount('operational')}
                </Text>
                <Text style={[styles.healthStatLabel, { color: colors.success }]}>Operational</Text>
              </View>
              <View style={[styles.healthStat, { backgroundColor: withOpacity(colors.info, 'subtle') }]}>
                <Clock size={20} color={colors.info} />
                <Text style={[styles.healthStatNumber, { color: colors.info }]}>
                  {getStatusCount('configured')}
                </Text>
                <Text style={[styles.healthStatLabel, { color: colors.info }]}>Configured</Text>
              </View>
              <View style={[styles.healthStat, { backgroundColor: withOpacity(colors.destructive, 'subtle') }]}>
                <AlertCircle size={20} color={colors.destructive} />
                <Text style={[styles.healthStatNumber, { color: colors.destructive }]}>
                  {getStatusCount('error')}
                </Text>
                <Text style={[styles.healthStatLabel, { color: colors.destructive }]}>Error</Text>
              </View>
              <View style={[styles.healthStat, { backgroundColor: withOpacity(colors.muted, 'medium') }]}>
                <XCircle size={20} color={colors.mutedForeground} />
                <Text style={[styles.healthStatNumber, { color: colors.mutedForeground }]}>
                  {getStatusCount('not-configured')}
                </Text>
                <Text style={[styles.healthStatLabel, { color: colors.mutedForeground }]}>Not Set</Text>
              </View>
            </View>

            {lastChecked && (
              <Text style={[styles.lastCheckedText, { color: colors.mutedForeground }]}>
                Last checked: {lastChecked.toLocaleTimeString()}
              </Text>
            )}
          </View>

          {/* Health by Group */}
          {serviceGroups.map((group) => {
            const groupHealths = healthsByGroup[group] || [];
            if (groupHealths.length === 0) return null;

            return (
              <View key={group} style={[styles.healthGroupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.healthGroupHeader}
                  onPress={() => setActiveTab(group)}
                >
                  <Text style={[styles.healthGroupTitle, { color: colors.foreground }]}>{group}</Text>
                  <Text style={[styles.healthGroupCount, { color: colors.mutedForeground }]}>
                    {groupHealths.length} integration{groupHealths.length !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>

                <View style={[styles.healthGroupList, { borderTopColor: colors.border }]}>
                  {groupHealths.map((health) => (
                    <View key={health.service} style={styles.healthItem}>
                      <View style={styles.healthItemInfo}>
                        {getStatusIcon(health.status, colors)}
                        <Text style={[styles.healthItemName, { color: colors.foreground }]}>
                          {health.name}
                        </Text>
                      </View>
                      <View style={styles.healthItemStatus}>
                        {health.latency && (
                          <Text style={[styles.healthItemLatency, { color: colors.mutedForeground }]}>
                            {health.latency}
                          </Text>
                        )}
                        <Text
                          style={[
                            styles.healthItemStatusText,
                            { color: getStatusColor(health.status, colors) },
                          ]}
                        >
                          {getStatusLabel(health.status)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        /* Integrations List for other tabs */
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING + insets.bottom }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          {activeIntegrations.map((integration) => (
            <View
              key={integration.id}
              style={[styles.integrationCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              {/* Integration Header */}
              <View style={styles.integrationHeader}>
                <View style={styles.integrationInfo}>
                  <Text style={[styles.integrationName, { color: colors.foreground }]}>
                    {integration.name}
                  </Text>
                  <Text style={[styles.integrationDescription, { color: colors.mutedForeground }]}>
                    {integration.description}
                  </Text>
                </View>
              </View>

              {/* Integration Fields */}
              <View style={styles.fieldsContainer}>
                {integration.fields.map((field) => (
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
              {integration.docsUrl && (
                <TouchableOpacity
                  style={styles.docsLink}
                  onPress={() => {
                    // TODO: Open docs URL in browser
                    console.log('Open docs:', integration.docsUrl);
                  }}
                >
                  <Text style={[styles.docsLinkText, { color: colors.primary }]}>
                    View Documentation →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {activeIntegrations.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No integrations in this category
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </ThemedSafeAreaView>
  );
}

// Helper functions
function getStatusIcon(status: IntegrationStatus, colors: ThemeColors) {
  switch (status) {
    case 'operational':
      return <CheckCircle size={16} color={colors.success} />;
    case 'error':
      return <XCircle size={16} color={colors.destructive} />;
    case 'configured':
      return <Clock size={16} color={colors.info} />;
    case 'checking':
      return <ActivityIndicator size="small" color={colors.info} />;
    default:
      return <XCircle size={16} color={colors.mutedForeground} />;
  }
}

function getStatusColor(status: IntegrationStatus, colors: ThemeColors): string {
  switch (status) {
    case 'operational':
      return colors.success;
    case 'error':
      return colors.destructive;
    case 'configured':
      return colors.info;
    default:
      return colors.mutedForeground;
  }
}

function getStatusLabel(status: IntegrationStatus): string {
  switch (status) {
    case 'operational':
      return 'Operational';
    case 'error':
      return 'Error';
    case 'configured':
      return 'Configured';
    case 'not-configured':
      return 'Not Set';
    case 'checking':
      return 'Checking...';
    default:
      return 'Unknown';
  }
}

const styles = StyleSheet.create({
  tabWrapper: {
    borderBottomWidth: 1,
  },
  tabContent: {
    paddingHorizontal: 16,
    gap: 4,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Health Tab Styles
  healthSummaryCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  healthSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthSummaryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  refreshButton: {
    padding: 4,
  },
  healthStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  healthStat: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  healthStatNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  healthStatLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  lastCheckedText: {
    fontSize: 11,
    marginTop: 12,
    textAlign: 'center',
  },
  healthGroupCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  healthGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  healthGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  healthGroupCount: {
    fontSize: 12,
  },
  healthGroupList: {
    borderTopWidth: 1,
  },
  healthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  healthItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  healthItemName: {
    fontSize: 14,
  },
  healthItemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthItemLatency: {
    fontSize: 11,
  },
  healthItemStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Integration Card Styles
  integrationCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  integrationHeader: {
    marginBottom: 16,
  },
  integrationInfo: {
    gap: 4,
  },
  integrationName: {
    fontSize: 18,
    fontWeight: '600',
  },
  integrationDescription: {
    fontSize: 13,
  },
  fieldsContainer: {
    gap: 8,
  },
  docsLink: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  docsLinkText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
  },
});
