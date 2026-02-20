// src/features/rental-properties/screens/RentalPropertyDetailScreen.tsx
// Detail screen for viewing and editing rental property information
// Redesigned to match DealCockpitScreen with tab-based navigation

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  Linking,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import {
  Edit2,
  MapPin,
  ExternalLink,
  Trash2,
  Home,
  ChevronLeft,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { DetailTabBar, type TabConfig } from '@/components/navigation';
import {
  LoadingSpinner,
  Button,
  BottomSheet,
  BottomSheetSection,
  TAB_BAR_SAFE_PADDING,
  Separator,
  Card,
  HeaderActionMenu,
  ConfirmButton,
  useToast,
} from '@/components/ui';
import { SPACING, FONT_SIZES, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { RentalPropertyHeader } from '../components/RentalPropertyHeader';
import { PropertyHubGrid } from '../components/PropertyHubGrid';
import { RoomsList } from '../components/RoomsList';
import {
  useRentalPropertyDetail,
  useRentalPropertyMutations,
} from '../hooks/useRentalPropertyDetail';
import { PropertyStatus } from '../types';
import {
  usePropertyInventory,
  useInventoryCount,
  InventoryPreview,
} from '@/features/property-inventory';
import { useOpenMaintenanceCount } from '@/features/property-maintenance';
import { useVendorCount } from '@/features/vendors';
import { useNextTurnover } from '@/features/turnovers';

// Extracted components and utilities
import {
  UUID_REGEX,
  formatCurrency,
  formatRateType,
  getStatusInfo,
  FinancialRow,
  AmenityChip,
} from './rental-property-detail';

// Tab types
type TabKey = 'overview' | 'financials' | 'rooms' | 'inventory' | 'listings';

const TAB_LABELS: Record<TabKey, string> = {
  overview: 'Overview',
  financials: 'Financials',
  rooms: 'Rooms',
  inventory: 'Inventory',
  listings: 'Listings',
};

export function RentalPropertyDetailScreen() {
  const params = useLocalSearchParams();
  const propertyId = params.id as string;

  // Check if propertyId is a valid UUID
  const isValidUUID = Boolean(propertyId && UUID_REGEX.test(propertyId));

  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY - before any early returns
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const { toast } = useToast();

  const {
    property,
    rooms,
    upcomingBookings,
    isLoading,
    isLoadingRooms,
    error,
    refetch,
  } = useRentalPropertyDetail(isValidUUID ? propertyId : '');

  const { updateStatus, deleteProperty, isSaving } =
    useRentalPropertyMutations(isValidUUID ? propertyId : '');

  // Hub counts for the property management grid
  const { data: inventoryItems = [], isLoading: isLoadingInventoryItems } = usePropertyInventory(isValidUUID ? propertyId : '');
  const { data: inventoryCount = 0, isLoading: isLoadingInventory } = useInventoryCount(isValidUUID ? propertyId : '');
  const { data: maintenanceCount = 0, isLoading: isLoadingMaintenance } = useOpenMaintenanceCount(isValidUUID ? propertyId : '');
  const { data: vendorCount = 0, isLoading: isLoadingVendors } = useVendorCount(isValidUUID ? propertyId : '');
  const { data: nextTurnover, isLoading: isLoadingTurnover } = useNextTurnover(isValidUUID ? propertyId : '');

  const isLoadingHubCounts = isLoadingInventory || isLoadingMaintenance || isLoadingVendors || isLoadingTurnover;

  // Calculate tab visibility
  const hasListingUrls = property?.listing_urls && Object.values(property.listing_urls).some(url => url);

  // Build tabs config with visibility
  const tabs: TabConfig<TabKey>[] = useMemo(() => [
    { key: 'overview', label: TAB_LABELS.overview },
    { key: 'financials', label: TAB_LABELS.financials },
    { key: 'rooms', label: TAB_LABELS.rooms, visible: property?.is_room_by_room_enabled },
    { key: 'inventory', label: TAB_LABELS.inventory },
    { key: 'listings', label: TAB_LABELS.listings, visible: hasListingUrls },
  ], [property?.is_room_by_room_enabled, hasListingUrls]);

  // Safe back navigation with fallback
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/rental-properties');
    }
  }, [router]);

  const handleEdit = useCallback(() => {
    router.push(`/(tabs)/rental-properties/edit/${propertyId}` as never);
  }, [router, propertyId]);

  const handleOpenMap = useCallback(() => {
    if (!property) return;

    const address = encodeURIComponent(
      `${property.address}, ${property.city}, ${property.state} ${property.zip || ''}`
    );
    const url = `https://maps.google.com/?q=${address}`;
    Linking.openURL(url);
  }, [property]);

  const handleStatusChange = useCallback(
    async (newStatus: PropertyStatus) => {
      try {
        await updateStatus(newStatus);
        setShowStatusSheet(false);
        refetch();
      } catch (err) {
        console.error('[RentalPropertyDetailScreen] Failed to update status:', err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        Alert.alert('Error', `Failed to update property status: ${message}`);
      }
    },
    [updateStatus, refetch]
  );

  const handleDelete = useCallback(async () => {
    try {
      await deleteProperty();
      toast({ title: 'Property deleted', type: 'success' });
      router.back();
    } catch (err) {
      console.error('[RentalPropertyDetailScreen] Failed to delete property:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Error', `Failed to delete property: ${message}`);
    }
  }, [deleteProperty, router, toast]);

  const handleAddRoom = useCallback(() => {
    router.push(`/(tabs)/rental-properties/${propertyId}/rooms/add` as never);
  }, [router, propertyId]);

  const handleRoomPress = useCallback(
    (room: { id: string }) => {
      router.push(`/(tabs)/rental-properties/${propertyId}/rooms/${room.id}` as never);
    },
    [router, propertyId]
  );

  const handleInventorySeeAll = useCallback(() => {
    router.push(`/(tabs)/rental-properties/${propertyId}/inventory` as never);
  }, [router, propertyId]);

  const handleInventoryItemPress = useCallback(
    (item: { id: string }) => {
      router.push(`/(tabs)/rental-properties/${propertyId}/inventory/${item.id}` as never);
    },
    [router, propertyId]
  );

  // Native header options for consistent iOS styling with glass blur
  const headerOptions = useMemo((): NativeStackNavigationOptions => ({
    headerShown: true,
    headerStyle: { backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.background },
    headerShadowVisible: false,
    headerStatusBarHeight: insets.top,
    ...(Platform.OS === 'ios' ? { headerTransparent: true, headerBlurEffect: 'systemChromeMaterial' } : {}),
    headerTitle: () => (
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.base }}>
          {property?.name || 'Property Details'}
        </Text>
      </View>
    ),
    headerLeft: () => (
      <TouchableOpacity
        onPress={handleBack}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: `${colors.muted}80`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ChevronLeft size={ICON_SIZES.xl} color={colors.foreground} />
      </TouchableOpacity>
    ),
    headerRight: property
      ? () => (
          <HeaderActionMenu
            actions={[
              { label: 'Edit', icon: Edit2, onPress: () => handleEdit() },
              { label: 'Change Status', icon: Home, onPress: () => setShowStatusSheet(true) },
              { label: 'Delete', icon: Trash2, onPress: () => handleDelete(), destructive: true },
            ]}
          />
        )
      : undefined,
  }), [colors, insets.top, property, handleBack]);

  // Guard against invalid UUIDs (e.g., "add" being captured by this route)
  // Must come AFTER all hook calls to follow React's rules of hooks
  if (!isValidUUID) {
    return <Redirect href="/(tabs)/rental-properties" />;
  }

  // Loading state
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

  // Error state
  if (error || !property) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <View className="flex-1 items-center justify-center p-4">
            <Home size={ICON_SIZES['3xl']} color={colors.mutedForeground} />
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: FONT_SIZES.base,
                textAlign: 'center',
                marginTop: 12,
              }}
            >
              {error?.message || 'Property not found'}
            </Text>
            <Button variant="outline" onPress={handleBack} className="mt-4">
              Go Back
            </Button>
          </View>
        </ThemedSafeAreaView>
      </>
    );
  }

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            {/* Property Management Hub Grid (2x2) */}
            <PropertyHubGrid
              propertyId={propertyId}
              maintenanceCount={maintenanceCount}
              vendorCount={vendorCount}
              nextTurnover={nextTurnover ?? undefined}
              bookingsCount={upcomingBookings.length}
              isLoading={isLoadingHubCounts}
              variant="glass"
            />

            {/* Address Card (always visible) */}
            <TouchableOpacity
              onPress={handleOpenMap}
              className="p-4 rounded-xl flex-row items-center justify-between mb-4"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
              activeOpacity={PRESS_OPACITY.DEFAULT}
            >
              <View className="flex-row items-center flex-1">
                <MapPin size={ICON_SIZES.lg} color={colors.primary} />
                <View className="ml-3 flex-1">
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: FONT_SIZES.base,
                      fontWeight: '500',
                    }}
                    numberOfLines={1}
                  >
                    {property.address}
                  </Text>
                  <Text
                    style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm }}
                    numberOfLines={1}
                  >
                    {property.city}, {property.state} {property.zip || ''}
                  </Text>
                </View>
              </View>
              <ExternalLink size={ICON_SIZES.ml} color={colors.mutedForeground} />
            </TouchableOpacity>

            {/* Amenities (always visible) */}
            {property.amenities && property.amenities.length > 0 && (
              <View className="mb-4">
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: FONT_SIZES.lg,
                    fontWeight: '600',
                    marginBottom: SPACING.sm,
                  }}
                >
                  Amenities
                </Text>
                <View className="flex-row flex-wrap">
                  {property.amenities.map((amenity, index) => (
                    <AmenityChip key={index} amenity={amenity} />
                  ))}
                </View>
              </View>
            )}
          </>
        );

      case 'financials':
        return (
          <Card variant="glass" className="p-4">
            <FinancialRow
              label="Base Rate"
              value={`${formatCurrency(property.base_rate)}${formatRateType(property.rate_type)}`}
              valueColor={colors.success}
            />
            <Separator className="my-1" />
            <FinancialRow
              label="Cleaning Fee"
              value={formatCurrency(property.cleaning_fee)}
            />
            <Separator className="my-1" />
            <FinancialRow
              label="Security Deposit"
              value={formatCurrency(property.security_deposit)}
            />
          </Card>
        );

      case 'rooms':
        return (
          <RoomsList
            rooms={rooms}
            isLoading={isLoadingRooms}
            onRoomPress={handleRoomPress}
            onAddRoom={handleAddRoom}
          />
        );

      case 'inventory':
        return (
          <InventoryPreview
            items={inventoryItems}
            totalCount={inventoryCount}
            isLoading={isLoadingInventoryItems}
            onSeeAll={handleInventorySeeAll}
            onItemPress={handleInventoryItemPress}
          />
        );

      case 'listings':
        return (
          <Card variant="glass" className="p-4">
            {property.listing_urls &&
              Object.entries(property.listing_urls).map(
                ([platform, url]) =>
                  url && (
                    <TouchableOpacity
                      key={platform}
                      onPress={() => Linking.openURL(url)}
                      className="flex-row items-center justify-between py-3"
                      activeOpacity={PRESS_OPACITY.DEFAULT}
                    >
                      <Text
                        style={{
                          color: colors.foreground,
                          fontSize: FONT_SIZES.base,
                          textTransform: 'capitalize',
                        }}
                      >
                        {platform}
                      </Text>
                      <ExternalLink size={ICON_SIZES.md} color={colors.primary} />
                    </TouchableOpacity>
                  )
              )}
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>
        <ScrollView
          className="flex-1"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{
            paddingBottom: TAB_BAR_SAFE_PADDING,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          stickyHeaderIndices={[1]}
        >
          {/* Hero Image Header */}
          <RentalPropertyHeader property={property} />

          {/* Sticky Tab Bar */}
          <View style={{ backgroundColor: colors.background }}>
            <DetailTabBar
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </View>

          {/* Tab Content */}
          <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm }}>
            {renderTabContent()}
          </View>
        </ScrollView>

        {/* Status Change Sheet */}
        <BottomSheet
          visible={showStatusSheet}
          onClose={() => setShowStatusSheet(false)}
          title="Property Options"
        >
          <BottomSheetSection title="Status">
            <View className="gap-2">
              {(['active', 'inactive', 'maintenance'] as PropertyStatus[]).map(
                (status) => {
                  const info = getStatusInfo(status);
                  const isActive = property.status === status;
                  const StatusIcon = info.icon;

                  return (
                    <TouchableOpacity
                      key={status}
                      onPress={() => handleStatusChange(status)}
                      className="flex-row items-center p-4 rounded-xl"
                      style={{
                        backgroundColor: isActive
                          ? withOpacity(colors.primary, 'light')
                          : colors.muted,
                        borderWidth: isActive ? 1 : 0,
                        borderColor: colors.primary,
                      }}
                      disabled={isSaving}
                    >
                      <StatusIcon
                        size={ICON_SIZES.lg}
                        color={isActive ? colors.primary : colors.foreground}
                      />
                      <Text
                        style={{
                          color: isActive ? colors.primary : colors.foreground,
                          fontSize: FONT_SIZES.base,
                          fontWeight: '500',
                          marginLeft: 12,
                        }}
                      >
                        {info.label}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
          </BottomSheetSection>

          <View className="pt-4 pb-6">
            <Button
              variant="outline"
              onPress={() => setShowStatusSheet(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </View>
        </BottomSheet>
      </ThemedSafeAreaView>
    </>
  );
}

export default RentalPropertyDetailScreen;
