// src/features/property-inventory/screens/inventory-detail/InventoryItemDetailScreen.tsx
// Detail screen for viewing and editing an inventory item

import React, { useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Edit2, Trash2, Package, Wrench } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import {
  LoadingSpinner,
  Button,
  TAB_BAR_SAFE_PADDING,
  HeaderActionMenu,
  useToast,
} from '@/components/ui';
import { useNativeHeader } from '@/hooks';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import { useInventoryItem, useInventoryMutations } from '../../hooks/usePropertyInventory';
import { INVENTORY_CONDITION_CONFIG } from '../../types';

import { getWarrantyStatus } from './utils';
import { InventoryDetailHeader } from './InventoryDetailHeader';
import { InventoryDetailCards } from './InventoryDetailCards';
import { InventoryDetailActions } from './InventoryDetailActions';

export function InventoryItemDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const propertyId = params.id as string;
  const itemId = params.itemId as string;
  const { toast } = useToast();

  const {
    data: item,
    isLoading,
    refetch,
    error,
  } = useInventoryItem(itemId);

  const { deleteItem, isDeleting } = useInventoryMutations(propertyId);

  // Condition config moved from header to content area
  const conditionConfig = item ? INVENTORY_CONDITION_CONFIG[item.condition] : null;

  const { headerOptions, handleBack } = useNativeHeader({
    title: item?.name || 'Inventory Item',
    fallbackRoute: `/(tabs)/rental-properties/${propertyId}/inventory`,
    rightAction: (
      <HeaderActionMenu
        actions={[
          { label: 'Edit', icon: Edit2, onPress: () => handleEdit() },
          { label: 'Log Maintenance', icon: Wrench, onPress: () => handleLogMaintenance() },
          { label: 'Delete', icon: Trash2, onPress: () => handleDelete(), destructive: true },
        ]}
      />
    ),
  });

  const handleEdit = useCallback(() => {
    router.push(
      `/(tabs)/rental-properties/${propertyId}/inventory/${itemId}/edit` as never
    );
  }, [router, propertyId, itemId]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteItem(itemId);
      toast({ title: 'Item deleted', type: 'success' });
      router.back();
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to delete item'
      );
    }
  }, [deleteItem, itemId, router, toast]);

  const handleLogMaintenance = useCallback(() => {
    router.push(
      `/(tabs)/rental-properties/${propertyId}/maintenance/add?inventoryItemId=${itemId}` as never
    );
  }, [router, propertyId, itemId]);

  // Loading state
  if (isLoading && !item) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <LoadingSpinner fullScreen text="Loading item..." />
        </ThemedSafeAreaView>
      </>
    );
  }

  // Error/Not found state
  if (error || !item) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <View className="flex-1 items-center justify-center p-4">
            <Package size={48} color={colors.mutedForeground} />
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: FONT_SIZES.base,
                textAlign: 'center',
                marginTop: 12,
              }}
            >
              Item not found
            </Text>
            <Button variant="outline" onPress={handleBack} className="mt-4">
              Go Back
            </Button>
          </View>
        </ThemedSafeAreaView>
      </>
    );
  }

  const warrantyStatus = getWarrantyStatus(item.warranty_expires);

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: SPACING.md,
            paddingBottom: TAB_BAR_SAFE_PADDING,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        >
          <InventoryDetailHeader
            item={item}
            conditionConfig={conditionConfig}
            warrantyStatus={warrantyStatus}
          />

          <InventoryDetailCards
            item={item}
            warrantyStatus={warrantyStatus}
          />

          <InventoryDetailActions
            onLogMaintenance={handleLogMaintenance}
            onDelete={handleDelete}
          />
        </ScrollView>
      </ThemedSafeAreaView>
    </>
  );
}

export default InventoryItemDetailScreen;
