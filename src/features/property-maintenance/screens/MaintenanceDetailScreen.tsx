// src/features/property-maintenance/screens/MaintenanceDetailScreen.tsx
// Detail screen for viewing and managing a maintenance work order

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
  Wrench,
  DollarSign,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Tag,
  FileText,
  Camera,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
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
  Switch,
  Input,
  FormField,
} from '@/components/ui';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import {
  useMaintenanceWorkOrder,
  useMaintenanceMutations,
} from '../hooks/usePropertyMaintenance';
import { MaintenanceTimeline } from '../components/MaintenanceTimeline';
import {
  MaintenanceStatus,
  MAINTENANCE_STATUS_CONFIG,
  MAINTENANCE_PRIORITY_CONFIG,
  MAINTENANCE_CATEGORY_LABELS,
  CHARGE_TO_LABELS,
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

// ============================================
// Main Component
// ============================================

export function MaintenanceDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const propertyId = params.id as string;
  const workOrderId = params.workOrderId as string;

  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [showGuestChargeSheet, setShowGuestChargeSheet] = useState(false);
  const [guestChargeAmount, setGuestChargeAmount] = useState('');

  const {
    data: workOrder,
    isLoading,
    refetch,
    error,
  } = useMaintenanceWorkOrder(workOrderId);

  const { updateStatus, updateWorkOrder, isUpdating } =
    useMaintenanceMutations(propertyId);

  // Handlers
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleEdit = useCallback(() => {
    router.push(
      `/(tabs)/rental-properties/${propertyId}/maintenance/${workOrderId}/edit` as never
    );
  }, [router, propertyId, workOrderId]);

  const handleStatusChange = useCallback(
    async (newStatus: MaintenanceStatus) => {
      try {
        await updateStatus(workOrderId, newStatus);
        setShowStatusSheet(false);
        refetch();
      } catch (error) {
        Alert.alert(
          'Error',
          error instanceof Error ? error.message : 'Failed to update status'
        );
      }
    },
    [updateStatus, workOrderId, refetch]
  );

  const handleToggleGuestCharge = useCallback(async () => {
    if (!workOrder) return;

    if (!workOrder.is_guest_chargeable) {
      // Opening: show sheet to set amount
      setGuestChargeAmount(workOrder.guest_charge_amount?.toString() || '');
      setShowGuestChargeSheet(true);
    } else {
      // Disabling guest charge
      try {
        await updateWorkOrder(workOrderId, {
          is_guest_chargeable: false,
          guest_charge_amount: undefined,
        });
        refetch();
      } catch (error) {
        Alert.alert('Error', 'Failed to update guest charge');
      }
    }
  }, [workOrder, updateWorkOrder, workOrderId, refetch]);

  const handleSetGuestCharge = useCallback(async () => {
    const amount = parseFloat(guestChargeAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid charge amount');
      return;
    }

    try {
      await updateWorkOrder(workOrderId, {
        is_guest_chargeable: true,
        guest_charge_amount: amount,
      });
      setShowGuestChargeSheet(false);
      refetch();
    } catch (error) {
      Alert.alert('Error', 'Failed to set guest charge');
    }
  }, [guestChargeAmount, updateWorkOrder, workOrderId, refetch]);

  // Loading state
  if (isLoading && !workOrder) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading work order..." />
      </ThemedSafeAreaView>
    );
  }

  // Error/Not found state
  if (error || !workOrder) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <ScreenHeader title="Work Order" backButton onBack={handleBack} />
        <View className="flex-1 items-center justify-center p-4">
          <Wrench size={48} color={colors.mutedForeground} />
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: FONT_SIZES.base,
              textAlign: 'center',
              marginTop: 12,
            }}
          >
            Work order not found
          </Text>
          <Button variant="outline" onPress={handleBack} className="mt-4">
            Go Back
          </Button>
        </View>
      </ThemedSafeAreaView>
    );
  }

  const statusConfig = MAINTENANCE_STATUS_CONFIG[workOrder.status];
  const priorityConfig = MAINTENANCE_PRIORITY_CONFIG[workOrder.priority];
  const isOpen = !['completed', 'cancelled'].includes(workOrder.status);

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScreenHeader
        title={workOrder.work_order_number}
        backButton
        onBack={handleBack}
        rightAction={
          <TouchableOpacity onPress={() => setShowStatusSheet(true)}>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </TouchableOpacity>
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
        {/* Title and Priority */}
        <View className="my-4">
          <Text
            style={{
              color: colors.foreground,
              fontSize: FONT_SIZES.xl,
              fontWeight: '700',
            }}
          >
            {workOrder.title}
          </Text>

          <View className="flex-row items-center mt-2 gap-2">
            <Badge
              variant={priorityConfig.variant}
              size="sm"
              style={{
                borderWidth: 1,
                borderColor: priorityConfig.color,
              }}
            >
              {workOrder.priority === 'emergency' && (
                <AlertTriangle size={12} color={priorityConfig.color} />
              )}
              <Text style={{ marginLeft: workOrder.priority === 'emergency' ? 4 : 0 }}>
                {priorityConfig.label}
              </Text>
            </Badge>
            <Badge variant="secondary" size="sm">
              {MAINTENANCE_CATEGORY_LABELS[workOrder.category]}
            </Badge>
          </View>
        </View>

        {/* Description */}
        {workOrder.description && (
          <View
            className="p-4 rounded-xl mb-4"
            style={{ backgroundColor: colors.card }}
          >
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.sm,
                lineHeight: 22,
              }}
            >
              {workOrder.description}
            </Text>
          </View>
        )}

        {/* Photos */}
        {workOrder.photos && workOrder.photos.length > 0 && (
          <View className="mb-4">
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.lg,
                fontWeight: '600',
                marginBottom: 8,
              }}
            >
              Photos
            </Text>
            <PhotoGallery
              photos={workOrder.photos.map((p, i) => ({
                id: `photo-${i}`,
                url: p.url,
                caption: p.caption,
                type: p.type,
              }))}
              editable={false}
              size="medium"
              showCaptions
            />
          </View>
        )}

        {/* Timeline */}
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
            Status Timeline
          </Text>
          <MaintenanceTimeline workOrder={workOrder} />
        </View>

        {/* Details Card */}
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
            Details
          </Text>

          <DetailRow icon={MapPin} label="Location" value={workOrder.location} />
          <Separator />
          <DetailRow icon={User} label="Vendor" value={workOrder.vendor_name} />
          <Separator />
          <DetailRow
            icon={DollarSign}
            label="Estimated Cost"
            value={formatCurrency(workOrder.estimated_cost)}
          />
          <Separator />
          <DetailRow
            icon={DollarSign}
            label="Actual Cost"
            value={formatCurrency(workOrder.actual_cost)}
            valueColor={colors.success}
          />
          <Separator />
          <DetailRow
            icon={Tag}
            label="Charge To"
            value={CHARGE_TO_LABELS[workOrder.charge_to]}
          />
        </View>

        {/* Guest Charge Section */}
        <View
          className="rounded-xl p-4 mb-4"
          style={{ backgroundColor: colors.card }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: FONT_SIZES.base,
                  fontWeight: '600',
                }}
              >
                Guest Chargeable
              </Text>
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: FONT_SIZES.sm,
                  marginTop: 2,
                }}
              >
                Flag this repair to charge the guest
              </Text>
            </View>
            <Switch
              value={workOrder.is_guest_chargeable}
              onValueChange={handleToggleGuestCharge}
              disabled={isUpdating}
            />
          </View>

          {workOrder.is_guest_chargeable && workOrder.guest_charge_amount && (
            <View
              className="mt-3 p-3 rounded-lg flex-row items-center"
              style={{ backgroundColor: withOpacity(colors.warning, 'light') }}
            >
              <DollarSign size={18} color={colors.warning} />
              <Text
                style={{
                  color: colors.warning,
                  fontSize: FONT_SIZES.base,
                  fontWeight: '600',
                  marginLeft: 8,
                }}
              >
                {formatCurrency(workOrder.guest_charge_amount)} to be charged
              </Text>
            </View>
          )}
        </View>

        {/* Resolution Notes */}
        {workOrder.resolution_notes && (
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
              Resolution Notes
            </Text>
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.sm,
                lineHeight: 22,
              }}
            >
              {workOrder.resolution_notes}
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        {isOpen && (
          <View className="gap-3 mb-6">
            {workOrder.status === 'reported' && (
              <Button
                onPress={() => handleStatusChange('scheduled')}
                disabled={isUpdating}
              >
                Mark as Scheduled
              </Button>
            )}
            {workOrder.status === 'scheduled' && (
              <Button
                onPress={() => handleStatusChange('in_progress')}
                disabled={isUpdating}
              >
                Start Work
              </Button>
            )}
            {workOrder.status === 'in_progress' && (
              <Button
                onPress={() => handleStatusChange('completed')}
                disabled={isUpdating}
                className="flex-row items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} color="white" />
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  Mark Complete
                </Text>
              </Button>
            )}
          </View>
        )}
      </ScrollView>

      {/* Edit FAB */}
      <SimpleFAB
        icon={<Edit2 size={24} color="white" />}
        onPress={handleEdit}
        accessibilityLabel="Edit work order"
      />

      {/* Status Change Sheet */}
      <BottomSheet
        visible={showStatusSheet}
        onClose={() => setShowStatusSheet(false)}
        title="Update Status"
      >
        <BottomSheetSection title="Select Status">
          <View className="gap-2">
            {(
              ['reported', 'scheduled', 'in_progress', 'completed', 'cancelled'] as MaintenanceStatus[]
            ).map((status) => {
              const config = MAINTENANCE_STATUS_CONFIG[status];
              const isActive = workOrder.status === status;

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
                  disabled={isUpdating}
                >
                  <Badge variant={config.variant} size="sm">
                    {config.label}
                  </Badge>
                </TouchableOpacity>
              );
            })}
          </View>
        </BottomSheetSection>
      </BottomSheet>

      {/* Guest Charge Sheet */}
      <BottomSheet
        visible={showGuestChargeSheet}
        onClose={() => setShowGuestChargeSheet(false)}
        title="Set Guest Charge"
      >
        <View className="py-4">
          <FormField label="Charge Amount" required>
            <Input
              value={guestChargeAmount}
              onChangeText={setGuestChargeAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              leftIcon={<Text style={{ color: colors.mutedForeground }}>$</Text>}
              autoFocus
            />
          </FormField>
        </View>

        <View className="flex-row gap-3 pt-4 pb-6">
          <Button
            variant="outline"
            onPress={() => setShowGuestChargeSheet(false)}
            className="flex-1"
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            onPress={handleSetGuestCharge}
            className="flex-1"
            disabled={isUpdating || !guestChargeAmount}
          >
            {isUpdating ? 'Saving...' : 'Set Charge'}
          </Button>
        </View>
      </BottomSheet>
    </ThemedSafeAreaView>
  );
}

export default MaintenanceDetailScreen;
