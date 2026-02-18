// src/features/property-inventory/screens/inventory-detail/InventoryItemDetailScreen.tsx
// Detail screen for viewing and editing an inventory item

import React, { useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  Edit2,
  Trash2,
  Package,
  MapPin,
  Calendar,
  DollarSign,
  AlertTriangle,
  Wrench,
  Info,
  Tag,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import {
  LoadingSpinner,
  Button,
  Badge,
  TAB_BAR_SAFE_PADDING,
  Separator,
  PhotoGallery,
  DetailRow,
  HeaderActionMenu,
  ConfirmButton,
  useToast,
} from '@/components/ui';
import { useNativeHeader } from '@/hooks';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { useInventoryItem, useInventoryMutations } from '../../hooks/usePropertyInventory';
import {
  INVENTORY_CATEGORY_LABELS,
  INVENTORY_CONDITION_CONFIG,
} from '../../types';

import { formatCurrency, formatDate, getWarrantyStatus } from './utils';

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

  const categoryLabel = INVENTORY_CATEGORY_LABELS[item.category];
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
          {/* Photo Gallery */}
          <View className="my-4">
            <PhotoGallery
              photos={(item.photos || []).map((p, i) => ({
                id: `photo-${i}`,
                url: p.url,
                caption: p.caption,
              }))}
              editable={false}
              size="large"
              emptyText="No photos"
            />
          </View>

          {/* Category & Condition Badges */}
          <View className="flex-row items-center mb-4 flex-wrap gap-2">
            {conditionConfig && (
              <Badge variant={conditionConfig.variant} size="lg">
                {conditionConfig.label}
              </Badge>
            )}
            <Badge variant="secondary" size="lg">
              {categoryLabel}
            </Badge>
            {item.location && (
              <View className="flex-row items-center ml-3">
                <MapPin size={14} color={colors.mutedForeground} />
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: FONT_SIZES.sm,
                    marginLeft: 4,
                  }}
                >
                  {item.location}
                </Text>
              </View>
            )}
          </View>

          {/* Warranty Warning */}
          {warrantyStatus && warrantyStatus !== 'valid' && (
            <View
              className="p-3 rounded-xl mb-4 flex-row items-center"
              style={{
                backgroundColor:
                  warrantyStatus === 'expired'
                    ? withOpacity(colors.destructive, 'light')
                    : withOpacity(colors.warning, 'light'),
              }}
            >
              <AlertTriangle
                size={20}
                color={warrantyStatus === 'expired' ? colors.destructive : colors.warning}
              />
              <Text
                style={{
                  color: warrantyStatus === 'expired' ? colors.destructive : colors.warning,
                  fontSize: FONT_SIZES.sm,
                  fontWeight: '500',
                  marginLeft: 8,
                }}
              >
                {warrantyStatus === 'expired'
                  ? `Warranty expired on ${formatDate(item.warranty_expires)}`
                  : `Warranty expires on ${formatDate(item.warranty_expires)}`}
              </Text>
            </View>
          )}

          {/* Product Details Card */}
          <View
            className="rounded-xl p-4 mb-4"
            style={{ backgroundColor: colors.card }}
          >
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.lg,
                fontWeight: '600',
                marginBottom: 8,
              }}
            >
              Product Details
            </Text>

            <DetailRow icon={Tag} label="Brand" value={item.brand} />
            <Separator />
            <DetailRow icon={Info} label="Model" value={item.model} />
            <Separator />
            <DetailRow icon={Tag} label="Serial Number" value={item.serial_number} />
          </View>

          {/* Dates Card */}
          <View
            className="rounded-xl p-4 mb-4"
            style={{ backgroundColor: colors.card }}
          >
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.lg,
                fontWeight: '600',
                marginBottom: 8,
              }}
            >
              Dates & Warranty
            </Text>

            <DetailRow
              icon={Calendar}
              label="Purchase Date"
              value={formatDate(item.purchase_date)}
            />
            <Separator />
            <DetailRow
              icon={Calendar}
              label="Install Date"
              value={formatDate(item.install_date)}
            />
            <Separator />
            <DetailRow
              icon={Calendar}
              label="Warranty Expires"
              value={formatDate(item.warranty_expires)}
              valueColor={
                warrantyStatus === 'expired'
                  ? colors.destructive
                  : warrantyStatus === 'expiring'
                  ? colors.warning
                  : undefined
              }
            />
            <Separator />
            <DetailRow
              icon={Calendar}
              label="Last Inspected"
              value={formatDate(item.last_inspected_at)}
            />
          </View>

          {/* Financial Card */}
          <View
            className="rounded-xl p-4 mb-4"
            style={{ backgroundColor: colors.card }}
          >
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.lg,
                fontWeight: '600',
                marginBottom: 8,
              }}
            >
              Financial
            </Text>

            <DetailRow
              icon={DollarSign}
              label="Purchase Price"
              value={formatCurrency(item.purchase_price)}
            />
            <Separator />
            <DetailRow
              icon={DollarSign}
              label="Replacement Cost"
              value={formatCurrency(item.replacement_cost)}
            />
          </View>

          {/* Notes Card */}
          {(item.notes || item.inspection_notes) && (
            <View
              className="rounded-xl p-4 mb-4"
              style={{ backgroundColor: colors.card }}
            >
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: FONT_SIZES.lg,
                  fontWeight: '600',
                  marginBottom: 8,
                }}
              >
                Notes
              </Text>

              {item.notes && (
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: FONT_SIZES.sm,
                    lineHeight: 20,
                  }}
                >
                  {item.notes}
                </Text>
              )}

              {item.inspection_notes && (
                <View className="mt-3">
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: FONT_SIZES.xs,
                      marginBottom: 4,
                    }}
                  >
                    Inspection Notes
                  </Text>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: FONT_SIZES.sm,
                      lineHeight: 20,
                    }}
                  >
                    {item.inspection_notes}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View className="gap-3 mb-6">
            <Button
              variant="outline"
              onPress={handleLogMaintenance}
              className="flex-row items-center justify-center gap-2"
            >
              <Wrench size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '600' }}>
                Log Maintenance
              </Text>
            </Button>

            <ConfirmButton
              label="Delete Item"
              onConfirm={handleDelete}
            />
          </View>
        </ScrollView>
      </ThemedSafeAreaView>
    </>
  );
}

export default InventoryItemDetailScreen;
