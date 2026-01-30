// src/features/property-inventory/screens/InventoryItemDetailScreen.tsx
// Detail screen for viewing and editing an inventory item

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  SimpleFAB,
  TAB_BAR_SAFE_PADDING,
  Separator,
  PhotoGallery,
  BottomSheet,
  BottomSheetSection,
} from '@/components/ui';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { useInventoryItem, useInventoryMutations } from '../hooks/usePropertyInventory';
import {
  INVENTORY_CATEGORY_LABELS,
  INVENTORY_CONDITION_CONFIG,
} from '../types';

// ============================================
// Helper Components
// ============================================

interface DetailRowProps {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  valueColor?: string;
}

function DetailRow({ icon: Icon, label, value, valueColor }: DetailRowProps) {
  const colors = useThemeColors();

  if (!value) return null;

  return (
    <View className="flex-row items-center py-3">
      <Icon size={18} color={colors.mutedForeground} />
      <View className="ml-3 flex-1">
        <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}>
          {label}
        </Text>
        <Text
          style={{
            color: valueColor || colors.foreground,
            fontSize: FONT_SIZES.base,
            fontWeight: '500',
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function formatCurrency(amount: number | null | undefined): string {
  if (!amount) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ============================================
// Main Component
// ============================================

export function InventoryItemDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const propertyId = params.id as string;
  const itemId = params.itemId as string;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    data: item,
    isLoading,
    refetch,
    error,
  } = useInventoryItem(itemId);

  const { deleteItem, isDeleting } = useInventoryMutations(propertyId);

  // Handlers
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleEdit = useCallback(() => {
    // Navigate to edit screen (or show edit sheet)
    // For now, we'll use the same route pattern
    router.push(
      `/(tabs)/rental-properties/${propertyId}/inventory/${itemId}/edit` as never
    );
  }, [router, propertyId, itemId]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteItem(itemId);
      setShowDeleteConfirm(false);
      router.back();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to delete item'
      );
    }
  }, [deleteItem, itemId, router]);

  const handleLogMaintenance = useCallback(() => {
    // Navigate to maintenance with this item pre-selected
    router.push(
      `/(tabs)/rental-properties/${propertyId}/maintenance/add?inventoryItemId=${itemId}` as never
    );
  }, [router, propertyId, itemId]);

  // Loading state
  if (isLoading && !item) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading item..." />
      </ThemedSafeAreaView>
    );
  }

  // Error/Not found state
  if (error || !item) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <ScreenHeader title="Inventory Item" backButton onBack={handleBack} />
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
    );
  }

  const conditionConfig = INVENTORY_CONDITION_CONFIG[item.condition];
  const categoryLabel = INVENTORY_CATEGORY_LABELS[item.category];

  // Check warranty status
  const warrantyStatus = item.warranty_expires
    ? new Date(item.warranty_expires) < new Date()
      ? 'expired'
      : new Date(item.warranty_expires) <
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ? 'expiring'
      : 'valid'
    : null;

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScreenHeader
        title={item.name}
        backButton
        onBack={handleBack}
        rightAction={
          <Badge variant={conditionConfig.variant}>{conditionConfig.label}</Badge>
        }
      />

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

        {/* Category Badge */}
        <View className="flex-row items-center mb-4">
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

          <Button
            variant="destructive"
            onPress={() => setShowDeleteConfirm(true)}
            className="flex-row items-center justify-center gap-2"
          >
            <Trash2 size={18} color="white" />
            <Text style={{ color: 'white', fontWeight: '600' }}>Delete Item</Text>
          </Button>
        </View>
      </ScrollView>

      {/* Edit FAB */}
      <SimpleFAB
        icon={<Edit2 size={24} color="white" />}
        onPress={handleEdit}
        accessibilityLabel="Edit item"
      />

      {/* Delete Confirmation Sheet */}
      <BottomSheet
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Item"
      >
        <View className="py-4">
          <Text
            style={{
              color: colors.foreground,
              fontSize: FONT_SIZES.base,
              textAlign: 'center',
            }}
          >
            Are you sure you want to delete{' '}
            <Text style={{ fontWeight: '700' }}>{item.name}</Text>?
          </Text>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: FONT_SIZES.sm,
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            This action cannot be undone.
          </Text>
        </View>

        <View className="flex-row gap-3 pt-4 pb-6">
          <Button
            variant="outline"
            onPress={() => setShowDeleteConfirm(false)}
            className="flex-1"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onPress={handleDelete}
            className="flex-1"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </View>
      </BottomSheet>
    </ThemedSafeAreaView>
  );
}

export default InventoryItemDetailScreen;
