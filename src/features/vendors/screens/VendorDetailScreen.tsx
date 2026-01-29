// src/features/vendors/screens/VendorDetailScreen.tsx
// Detail screen for viewing and managing a vendor

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Edit2,
  Users,
  Phone,
  Mail,
  MapPin,
  Star,
  Award,
  DollarSign,
  Calendar,
  FileText,
  MessageSquare,
  Trash2,
  Shield,
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
  BottomSheet,
} from '@/components/ui';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { useVendor, useVendorMutations } from '../hooks/useVendors';
import { MessageVendorSheet } from '../components/MessageVendorSheet';
import { VENDOR_CATEGORY_CONFIG } from '../types';

// ============================================
// Helper Components
// ============================================

interface DetailRowProps {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  valueColor?: string;
  onPress?: () => void;
}

function DetailRow({ icon: Icon, label, value, valueColor, onPress }: DetailRowProps) {
  const colors = useThemeColors();
  if (!value) return null;

  const Content = (
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

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
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

export function VendorDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const propertyId = params.id as string | undefined;
  const vendorId = params.vendorId as string;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMessageSheet, setShowMessageSheet] = useState(false);

  const { data: vendor, isLoading, refetch, error } = useVendor(vendorId);
  const { deleteVendor, setPrimaryVendor, isDeleting, isUpdating } =
    useVendorMutations(propertyId);

  // Handlers
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleEdit = useCallback(() => {
    if (propertyId) {
      router.push(
        `/(tabs)/rental-properties/${propertyId}/vendors/${vendorId}/edit` as never
      );
    } else {
      router.push(`/(tabs)/settings/vendors/${vendorId}/edit` as never);
    }
  }, [router, propertyId, vendorId]);

  const handleCall = useCallback(() => {
    if (vendor?.phone) {
      Linking.openURL(`tel:${vendor.phone}`);
    }
  }, [vendor]);

  const handleEmail = useCallback(() => {
    if (vendor?.email) {
      Linking.openURL(`mailto:${vendor.email}`);
    }
  }, [vendor]);

  const handleMessage = useCallback(() => {
    setShowMessageSheet(true);
  }, []);

  const handleSetPrimary = useCallback(async () => {
    if (!vendor) return;

    try {
      await setPrimaryVendor(vendorId, vendor.category);
      refetch();
    } catch (error) {
      Alert.alert('Error', 'Failed to set as primary vendor');
    }
  }, [vendor, setPrimaryVendor, vendorId, refetch]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteVendor(vendorId);
      setShowDeleteConfirm(false);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete vendor');
    }
  }, [deleteVendor, vendorId, router]);

  // Loading state
  if (isLoading && !vendor) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading vendor..." />
      </ThemedSafeAreaView>
    );
  }

  // Error/Not found state
  if (error || !vendor) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <ScreenHeader title="Vendor" backButton onBack={handleBack} />
        <View className="flex-1 items-center justify-center p-4">
          <Users size={48} color={colors.mutedForeground} />
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: FONT_SIZES.base,
              textAlign: 'center',
              marginTop: 12,
            }}
          >
            Vendor not found
          </Text>
          <Button variant="outline" onPress={handleBack} className="mt-4">
            Go Back
          </Button>
        </View>
      </ThemedSafeAreaView>
    );
  }

  const categoryConfig = VENDOR_CATEGORY_CONFIG[vendor.category];

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScreenHeader
        title={vendor.name}
        backButton
        onBack={handleBack}
        rightAction={
          vendor.is_primary && (
            <View className="flex-row items-center">
              <Award size={16} color={colors.primary} />
              <Text
                style={{
                  color: colors.primary,
                  fontSize: FONT_SIZES.sm,
                  fontWeight: '600',
                  marginLeft: 4,
                }}
              >
                Primary
              </Text>
            </View>
          )
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
        {/* Header Card */}
        <View
          className="p-4 rounded-xl my-4"
          style={{ backgroundColor: colors.card }}
        >
          <View className="flex-row items-center">
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: BORDER_RADIUS.lg,
                backgroundColor: withOpacity(colors.primary, 'subtle'),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 28 }}>{categoryConfig.emoji}</Text>
            </View>

            <View className="flex-1 ml-4">
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: FONT_SIZES.xl,
                  fontWeight: '700',
                }}
              >
                {vendor.name}
              </Text>
              {vendor.company_name && (
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: FONT_SIZES.base,
                    marginTop: 2,
                  }}
                >
                  {vendor.company_name}
                </Text>
              )}
              <Badge variant="secondary" size="sm" className="mt-2 self-start">
                {categoryConfig.label}
              </Badge>
            </View>
          </View>

          {/* Rating and Stats */}
          <View className="flex-row items-center mt-4 gap-4">
            {vendor.rating && (
              <View className="flex-row items-center">
                <Star size={16} color={colors.warning} fill={colors.warning} />
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: FONT_SIZES.base,
                    fontWeight: '600',
                    marginLeft: 4,
                  }}
                >
                  {vendor.rating.toFixed(1)}
                </Text>
              </View>
            )}
            <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm }}>
              {vendor.total_jobs} job{vendor.total_jobs !== 1 ? 's' : ''} completed
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row gap-2 mb-4">
          {vendor.phone && (
            <TouchableOpacity
              onPress={handleCall}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: SPACING.md,
                borderRadius: BORDER_RADIUS.md,
                backgroundColor: colors.muted,
                gap: SPACING.xs,
              }}
              activeOpacity={0.7}
            >
              <Phone size={18} color={colors.primary} />
              <Text
                style={{
                  color: colors.primary,
                  fontSize: FONT_SIZES.sm,
                  fontWeight: '600',
                }}
              >
                Call
              </Text>
            </TouchableOpacity>
          )}
          {vendor.email && (
            <TouchableOpacity
              onPress={handleEmail}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: SPACING.md,
                borderRadius: BORDER_RADIUS.md,
                backgroundColor: colors.muted,
                gap: SPACING.xs,
              }}
              activeOpacity={0.7}
            >
              <Mail size={18} color={colors.primary} />
              <Text
                style={{
                  color: colors.primary,
                  fontSize: FONT_SIZES.sm,
                  fontWeight: '600',
                }}
              >
                Email
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleMessage}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: SPACING.md,
              borderRadius: BORDER_RADIUS.md,
              backgroundColor: withOpacity(colors.primary, 'light'),
              gap: SPACING.xs,
            }}
            activeOpacity={0.7}
          >
            <MessageSquare size={18} color={colors.primary} />
            <Text
              style={{
                color: colors.primary,
                fontSize: FONT_SIZES.sm,
                fontWeight: '600',
              }}
            >
              Message
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contact Details */}
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
            Contact
          </Text>

          <DetailRow
            icon={Phone}
            label="Phone"
            value={vendor.phone}
            onPress={vendor.phone ? handleCall : undefined}
            valueColor={colors.primary}
          />
          <Separator />
          <DetailRow
            icon={Mail}
            label="Email"
            value={vendor.email}
            onPress={vendor.email ? handleEmail : undefined}
            valueColor={colors.primary}
          />
          <Separator />
          <DetailRow icon={MapPin} label="Address" value={vendor.address} />
        </View>

        {/* Rates */}
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
            Rates
          </Text>

          <DetailRow
            icon={DollarSign}
            label="Hourly Rate"
            value={vendor.hourly_rate ? `${formatCurrency(vendor.hourly_rate)}/hr` : null}
            valueColor={colors.success}
          />
          <Separator />
          <DetailRow
            icon={DollarSign}
            label="Service Fee"
            value={formatCurrency(vendor.service_fee)}
          />
          <Separator />
          <DetailRow icon={FileText} label="Payment Terms" value={vendor.payment_terms} />
        </View>

        {/* License & Insurance */}
        {(vendor.license_number || vendor.insurance_verified) && (
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
              License & Insurance
            </Text>

            <DetailRow
              icon={FileText}
              label="License Number"
              value={vendor.license_number}
            />
            {vendor.license_expires && (
              <>
                <Separator />
                <DetailRow
                  icon={Calendar}
                  label="License Expires"
                  value={formatDate(vendor.license_expires)}
                />
              </>
            )}
            <Separator />
            <View className="flex-row items-center py-3">
              <Shield
                size={18}
                color={vendor.insurance_verified ? colors.success : colors.mutedForeground}
              />
              <View className="ml-3 flex-1">
                <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}>
                  Insurance
                </Text>
                <Text
                  style={{
                    color: vendor.insurance_verified ? colors.success : colors.warning,
                    fontSize: FONT_SIZES.base,
                    fontWeight: '500',
                  }}
                >
                  {vendor.insurance_verified ? 'Verified' : 'Not Verified'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Notes */}
        {vendor.notes && (
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
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.sm,
                lineHeight: 22,
              }}
            >
              {vendor.notes}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View className="gap-3 mb-6">
          {!vendor.is_primary && (
            <Button
              variant="outline"
              onPress={handleSetPrimary}
              disabled={isUpdating}
              className="flex-row items-center justify-center gap-2"
            >
              <Award size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '600' }}>
                Set as Primary Vendor
              </Text>
            </Button>
          )}

          <Button
            variant="destructive"
            onPress={() => setShowDeleteConfirm(true)}
            className="flex-row items-center justify-center gap-2"
          >
            <Trash2 size={18} color="white" />
            <Text style={{ color: 'white', fontWeight: '600' }}>Delete Vendor</Text>
          </Button>
        </View>
      </ScrollView>

      {/* Edit FAB */}
      <SimpleFAB
        icon={<Edit2 size={24} color="white" />}
        onPress={handleEdit}
        accessibilityLabel="Edit vendor"
      />

      {/* Delete Confirmation Sheet */}
      <BottomSheet
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Vendor"
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
            <Text style={{ fontWeight: '700' }}>{vendor.name}</Text>?
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

      {/* Message Vendor Sheet */}
      <MessageVendorSheet
        visible={showMessageSheet}
        onClose={() => setShowMessageSheet(false)}
        vendor={vendor}
        context={{
          type: 'general',
        }}
      />
    </ThemedSafeAreaView>
  );
}

export default VendorDetailScreen;
