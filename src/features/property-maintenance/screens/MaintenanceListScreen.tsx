// src/features/property-maintenance/screens/MaintenanceListScreen.tsx
// List screen for property maintenance work orders with status filters

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Wrench, Plus, Filter, AlertTriangle } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import {
  LoadingSpinner,
  SimpleFAB,
  TAB_BAR_SAFE_PADDING,
  Badge,
  ListEmptyState,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import {
  useFilteredMaintenance,
} from '../hooks/usePropertyMaintenance';
import { MaintenanceCard } from '../components/MaintenanceCard';
import { AddMaintenanceSheet } from '../components/AddMaintenanceSheet';
import { MaintenanceWorkOrder, MaintenanceStatus } from '../types';

export function MaintenanceListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const propertyId = params.id as string;

  const [activeTab, setActiveTab] = useState<'open' | 'completed'>('open');
  const [showAddSheet, setShowAddSheet] = useState(false);

  const statusFilter = activeTab === 'open' ? 'open' : 'completed';

  const {
    data: workOrders = [],
    openCount,
    completedCount,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useFilteredMaintenance(propertyId, statusFilter as MaintenanceStatus | 'all' | 'open');

  // Count emergency items
  const emergencyCount = useMemo(
    () =>
      workOrders.filter(
        (wo) =>
          wo.priority === 'emergency' &&
          !['completed', 'cancelled'].includes(wo.status)
      ).length,
    [workOrders]
  );

  // Navigation handlers
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleWorkOrderPress = useCallback(
    (workOrder: MaintenanceWorkOrder) => {
      router.push(
        `/(tabs)/rental-properties/${propertyId}/maintenance/${workOrder.id}` as never
      );
    },
    [router, propertyId]
  );

  const handleAddSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  // Loading state
  if (isLoading && workOrders.length === 0) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading maintenance..." />
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScreenHeader
        title="Maintenance"
        backButton
        onBack={handleBack}
        rightAction={
          emergencyCount > 0 && (
            <View className="flex-row items-center">
              <AlertTriangle size={16} color={colors.destructive} />
              <Badge variant="danger" size="sm" className="ml-1">
                {emergencyCount}
              </Badge>
            </View>
          )
        }
      />

      {/* Tabs */}
      <View className="px-4 pb-2">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'open' | 'completed')}>
          <TabsList className="w-full">
            <TabsTrigger value="open" className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text
                  style={{
                    color: activeTab === 'open' ? colors.primary : colors.mutedForeground,
                    fontWeight: activeTab === 'open' ? '600' : '400',
                  }}
                >
                  Open
                </Text>
                {openCount > 0 && (
                  <Badge
                    variant={activeTab === 'open' ? 'default' : 'secondary'}
                    size="sm"
                  >
                    {openCount}
                  </Badge>
                )}
              </View>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text
                  style={{
                    color: activeTab === 'completed' ? colors.primary : colors.mutedForeground,
                    fontWeight: activeTab === 'completed' ? '600' : '400',
                  }}
                >
                  Completed
                </Text>
                {completedCount > 0 && (
                  <Badge
                    variant={activeTab === 'completed' ? 'success' : 'secondary'}
                    size="sm"
                  >
                    {completedCount}
                  </Badge>
                )}
              </View>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </View>

      {/* Content */}
      {workOrders.length === 0 ? (
        <ListEmptyState
          icon={Wrench}
          title={activeTab === 'open' ? 'No Open Issues' : 'No Completed Work'}
          description={
            activeTab === 'open'
              ? 'All maintenance is up to date'
              : 'Completed work orders will appear here'
          }
          action={
            activeTab === 'open'
              ? {
                  label: 'Report Issue',
                  onPress: () => setShowAddSheet(true),
                }
              : undefined
          }
        />
      ) : (
        <FlatList
          data={workOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="px-4">
              <MaintenanceCard
                workOrder={item}
                onPress={() => handleWorkOrderPress(item)}
              />
            </View>
          )}
          contentContainerStyle={{
            paddingTop: SPACING.sm,
            paddingBottom: TAB_BAR_SAFE_PADDING + 80,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
        />
      )}

      {/* Add FAB */}
      <SimpleFAB
        icon={<Plus size={24} color="white" />}
        onPress={() => setShowAddSheet(true)}
        accessibilityLabel="Report issue"
      />

      {/* Add Maintenance Sheet */}
      <AddMaintenanceSheet
        visible={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        propertyId={propertyId}
        onSuccess={handleAddSuccess}
      />
    </ThemedSafeAreaView>
  );
}

export default MaintenanceListScreen;
