// src/features/admin/screens/IntegrationsScreen.tsx
// Integrations management screen - matches Users/Logs admin pattern

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  KeyboardAvoidingView,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useKeyboardAvoidance } from '@/hooks';
import { ThemedSafeAreaView } from '@/components';
import { SearchBar, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { SPACING } from '@/constants/design-tokens';
import { EnvironmentBadge } from '../components/EnvironmentBadge';

// Extracted components
import {
  type IntegrationWithHealth,
  FilterPill,
  IntegrationAccordionItem,
  IntegrationListHeader,
  IntegrationListEmpty,
  LoadingSkeletons,
  useIntegrationHealth,
} from './integrations';

export function IntegrationsScreen() {
  const colors = useThemeColors();
  const keyboardProps = useKeyboardAvoidance({ hasNavigationHeader: false });

  const {
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
  } = useIntegrationHealth();

  // Render integration accordion item
  const renderIntegration = useCallback(({ item }: { item: IntegrationWithHealth }) => {
    return (
      <IntegrationAccordionItem
        item={item}
        expandedIntegration={expandedIntegration}
        setExpandedIntegration={setExpandedIntegration}
        healthStatuses={healthStatuses}
        apiKeys={apiKeys}
        handleHealthResult={handleHealthResult}
        setApiKeyRefreshTrigger={setApiKeyRefreshTrigger}
        loadApiKeys={loadApiKeys}
      />
    );
  }, [expandedIntegration, setExpandedIntegration, healthStatuses, apiKeys, handleHealthResult, setApiKeyRefreshTrigger, loadApiKeys]);

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
          <LoadingSkeletons healthProgress={healthProgress} />
        ) : (
          <FlatList
            data={filteredIntegrations}
            keyExtractor={(item) => item.id}
            renderItem={renderIntegration}
            extraData={expandedIntegration}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
            ListHeaderComponent={
              <IntegrationListHeader
                isRefreshing={isRefreshing}
                healthProgress={healthProgress}
                apiKeyRefreshTrigger={apiKeyRefreshTrigger}
                loadError={loadError}
                loadAllHealth={loadAllHealth}
                filteredCount={filteredIntegrations.length}
                totalCount={integrationsWithHealth.length}
              />
            }
            ListEmptyComponent={<IntegrationListEmpty />}
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
