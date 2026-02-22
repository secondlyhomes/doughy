// src/features/rental-properties/screens/RentalPropertyDetailScreen.tsx
// Detail screen for viewing and editing rental property information
// Thin orchestrator — sub-components, hooks, and types live in ./rental-property-detail/

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useLocalSearchParams, Stack, Redirect } from 'expo-router';
import { Home } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { DetailTabBar, type TabConfig } from '@/components/navigation';
import { LoadingSpinner, Button, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { SPACING, FONT_SIZES, ICON_SIZES } from '@/constants/design-tokens';
import { RentalPropertyHeader } from '../components/RentalPropertyHeader';
import {
  useRentalPropertyDetail,
  useRentalPropertyMutations,
} from '../hooks/useRentalPropertyDetail';
import { usePropertyInventory, useInventoryCount } from '@/features/property-inventory';
import { useOpenMaintenanceCount } from '@/features/property-maintenance';
import { useVendorCount } from '@/features/vendors';
import { useNextTurnover } from '@/features/turnovers';
import {
  UUID_REGEX,
  StatusBottomSheet,
  PropertyTabContent,
  usePropertyDetailHeader,
  usePropertyDetailActions,
  TAB_LABELS,
  type TabKey,
} from './rental-property-detail';

export function RentalPropertyDetailScreen() {
  const params = useLocalSearchParams();
  const propertyId = params.id as string;
  const isValidUUID = Boolean(propertyId && UUID_REGEX.test(propertyId));
  const safeId = isValidUUID ? propertyId : '';

  const colors = useThemeColors();
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const {
    property, rooms, upcomingBookings,
    isLoading, isLoadingRooms, error, refetch,
  } = useRentalPropertyDetail(safeId);

  const { updateStatus, deleteProperty, isSaving } =
    useRentalPropertyMutations(safeId);

  const { data: inventoryItems = [], isLoading: isLoadingInventoryItems } = usePropertyInventory(safeId);
  const { data: inventoryCount = 0, isLoading: isLoadingInventory } = useInventoryCount(safeId);
  const { data: maintenanceCount = 0, isLoading: isLoadingMaintenance } = useOpenMaintenanceCount(safeId);
  const { data: vendorCount = 0, isLoading: isLoadingVendors } = useVendorCount(safeId);
  const { data: nextTurnover, isLoading: isLoadingTurnover } = useNextTurnover(safeId);
  const isLoadingHubCounts = isLoadingInventory || isLoadingMaintenance || isLoadingVendors || isLoadingTurnover;

  const actions = usePropertyDetailActions({
    propertyId: safeId, property, updateStatus,
    deleteProperty, refetch, setShowStatusSheet,
  });

  const headerOptions = usePropertyDetailHeader({
    property,
    onBack: actions.handleBack,
    onEdit: actions.handleEdit,
    onDelete: actions.handleDelete,
    onChangeStatus: () => setShowStatusSheet(true),
  });

  const hasListingUrls = property?.listing_urls && Object.values(property.listing_urls).some(url => url);
  const tabs: TabConfig<TabKey>[] = useMemo(() => [
    { key: 'overview', label: TAB_LABELS.overview },
    { key: 'financials', label: TAB_LABELS.financials },
    { key: 'rooms', label: TAB_LABELS.rooms, visible: property?.is_room_by_room_enabled },
    { key: 'inventory', label: TAB_LABELS.inventory },
    { key: 'listings', label: TAB_LABELS.listings, visible: hasListingUrls },
  ], [property?.is_room_by_room_enabled, hasListingUrls]);

  // Guard — must come AFTER all hook calls
  if (!isValidUUID) return <Redirect href="/(tabs)/rental-properties" />;

  if (isLoading && !property) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <LoadingSpinner fullScreen text="Loading property..." />
        </ThemedSafeAreaView>
      </>
    );
  }

  if (error || !property) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <View className="flex-1 items-center justify-center p-4">
            <Home size={ICON_SIZES['3xl']} color={colors.mutedForeground} />
            <Text style={{
              color: colors.mutedForeground, fontSize: FONT_SIZES.base,
              textAlign: 'center', marginTop: 12,
            }}>
              {error?.message || 'Property not found'}
            </Text>
            <Button variant="outline" onPress={actions.handleBack} className="mt-4">
              Go Back
            </Button>
          </View>
        </ThemedSafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>
        <ScrollView
          className="flex-1"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
          }
          stickyHeaderIndices={[1]}
        >
          <RentalPropertyHeader property={property} />
          <View style={{ backgroundColor: colors.background }}>
            <DetailTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
          </View>
          <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm }}>
            <PropertyTabContent
              activeTab={activeTab}
              property={property}
              propertyId={propertyId}
              maintenanceCount={maintenanceCount}
              vendorCount={vendorCount}
              nextTurnover={nextTurnover ?? undefined}
              bookingsCount={upcomingBookings.length}
              isLoadingHubCounts={isLoadingHubCounts}
              onOpenMap={actions.handleOpenMap}
              rooms={rooms}
              isLoadingRooms={isLoadingRooms}
              onRoomPress={actions.handleRoomPress}
              onAddRoom={actions.handleAddRoom}
              inventoryItems={inventoryItems}
              inventoryCount={inventoryCount}
              isLoadingInventoryItems={isLoadingInventoryItems}
              onInventorySeeAll={actions.handleInventorySeeAll}
              onInventoryItemPress={actions.handleInventoryItemPress}
            />
          </View>
        </ScrollView>
        <StatusBottomSheet
          visible={showStatusSheet}
          onClose={() => setShowStatusSheet(false)}
          currentStatus={property.status}
          onStatusChange={actions.handleStatusChange}
          isSaving={isSaving}
        />
      </ThemedSafeAreaView>
    </>
  );
}

export default RentalPropertyDetailScreen;
