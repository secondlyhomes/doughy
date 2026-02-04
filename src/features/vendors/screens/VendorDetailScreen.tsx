// src/features/vendors/screens/VendorDetailScreen.tsx
// Detail screen for viewing and managing a vendor

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  Edit2,
  Users,
  Phone,
  Mail,
  MapPin,
  Award,
  DollarSign,
  Calendar,
  FileText,
  Trash2,
  Shield,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import {
  LoadingSpinner,
  Button,
  SimpleFAB,
  TAB_BAR_SAFE_PADDING,
  Separator,
  BottomSheet,
  DetailRow,
} from '@/components/ui';
import { useNativeHeader } from '@/hooks';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import { useVendor, useVendorMutations } from '../hooks/useVendors';
import { MessageVendorSheet } from '../components/MessageVendorSheet';
import {
  VendorHeaderCard,
  QuickActions,
  InfoSection,
  formatCurrency,
  formatDate,
} from './vendor-detail';

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

  // Build fallback route based on whether we're in a property context or settings
  const fallbackRoute = propertyId
    ? `/(tabs)/rental-properties/${propertyId}/vendors`
    : '/(tabs)/settings/vendors';

  const { headerOptions, handleBack } = useNativeHeader({
    title: vendor?.name || 'Vendor',
    fallbackRoute,
    rightAction: vendor?.is_primary ? (
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
    ) : undefined,
  });

  const handleEdit = useCallback(() => {
    const basePath = propertyId
      ? `/(tabs)/rental-properties/${propertyId}/vendors/${vendorId}/edit`
      : `/(tabs)/settings/vendors/${vendorId}/edit`;
    router.push(basePath as never);
  }, [router, propertyId, vendorId]);

  const handleCall = useCallback(() => {
    if (vendor?.phone) {
      const { Linking } = require('react-native');
      Linking.openURL(`tel:${vendor.phone}`);
    }
  }, [vendor]);

  const handleEmail = useCallback(() => {
    if (vendor?.email) {
      const { Linking } = require('react-native');
      Linking.openURL(`mailto:${vendor.email}`);
    }
  }, [vendor]);

  const handleMessage = useCallback(() => setShowMessageSheet(true), []);

  const handleSetPrimary = useCallback(async () => {
    if (!vendor) return;
    try {
      await setPrimaryVendor(vendorId, vendor.category);
      refetch();
    } catch {
      Alert.alert('Error', 'Failed to set as primary vendor');
    }
  }, [vendor, setPrimaryVendor, vendorId, refetch]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteVendor(vendorId);
      setShowDeleteConfirm(false);
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to delete vendor');
    }
  }, [deleteVendor, vendorId, router]);

  // Loading state
  if (isLoading && !vendor) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <LoadingSpinner fullScreen text="Loading vendor..." />
        </ThemedSafeAreaView>
      </>
    );
  }

  // Error/Not found state
  if (error || !vendor) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
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
      </>
    );
  }

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
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
          }
        >
          <VendorHeaderCard vendor={vendor} />

          <QuickActions
            phone={vendor.phone}
            email={vendor.email}
            onCall={handleCall}
            onEmail={handleEmail}
            onMessage={handleMessage}
          />

          {/* Contact Details */}
          <InfoSection title="Contact">
            <DetailRow icon={Phone} label="Phone" value={vendor.phone} onPress={handleCall} valueColor={colors.primary} />
            <Separator />
            <DetailRow icon={Mail} label="Email" value={vendor.email} onPress={handleEmail} valueColor={colors.primary} />
            <Separator />
            <DetailRow icon={MapPin} label="Address" value={vendor.address} />
          </InfoSection>

          {/* Rates */}
          <InfoSection title="Rates">
            <DetailRow
              icon={DollarSign}
              label="Hourly Rate"
              value={vendor.hourly_rate ? `${formatCurrency(vendor.hourly_rate)}/hr` : null}
              valueColor={colors.success}
            />
            <Separator />
            <DetailRow icon={DollarSign} label="Service Fee" value={formatCurrency(vendor.service_fee)} />
            <Separator />
            <DetailRow icon={FileText} label="Payment Terms" value={vendor.payment_terms} />
          </InfoSection>

          {/* License & Insurance */}
          {(vendor.license_number || vendor.insurance_verified) && (
            <InfoSection title="License & Insurance">
              <DetailRow icon={FileText} label="License Number" value={vendor.license_number} />
              {vendor.license_expires && (
                <>
                  <Separator />
                  <DetailRow icon={Calendar} label="License Expires" value={formatDate(vendor.license_expires)} />
                </>
              )}
              <Separator />
              <View className="flex-row items-center py-3">
                <Shield size={18} color={vendor.insurance_verified ? colors.success : colors.mutedForeground} />
                <View className="ml-3 flex-1">
                  <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}>Insurance</Text>
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
            </InfoSection>
          )}

          {/* Notes */}
          {vendor.notes && (
            <InfoSection title="Notes">
              <Text style={{ color: colors.foreground, fontSize: FONT_SIZES.sm, lineHeight: 22 }}>
                {vendor.notes}
              </Text>
            </InfoSection>
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
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Set as Primary Vendor</Text>
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

        <SimpleFAB icon={<Edit2 size={24} color="white" />} onPress={handleEdit} accessibilityLabel="Edit vendor" />

        {/* Delete Confirmation Sheet */}
        <BottomSheet visible={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Vendor">
          <View className="py-4">
            <Text style={{ color: colors.foreground, fontSize: FONT_SIZES.base, textAlign: 'center' }}>
              Are you sure you want to delete <Text style={{ fontWeight: '700' }}>{vendor.name}</Text>?
            </Text>
          </View>
          <View className="flex-row gap-3 pt-4 pb-6">
            <Button variant="outline" onPress={() => setShowDeleteConfirm(false)} className="flex-1" disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onPress={handleDelete} className="flex-1" disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </View>
        </BottomSheet>

        <MessageVendorSheet visible={showMessageSheet} onClose={() => setShowMessageSheet(false)} vendor={vendor} context={{ type: 'general' }} />
      </ThemedSafeAreaView>
    </>
  );
}

export default VendorDetailScreen;
