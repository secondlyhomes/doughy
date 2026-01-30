// src/features/turnovers/components/ScheduleCleaningSheet.tsx
// Bottom sheet for scheduling cleaning with a vendor

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { Calendar, Clock, User, Sparkles, Send } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import {
  BottomSheet,
  BottomSheetSection,
  Button,
  Input,
  FormField,
  LoadingSpinner,
  Badge,
} from '@/components/ui';
import { SPACING, FONT_SIZES, BORDER_RADIUS, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { Vendor, VENDOR_CATEGORY_CONFIG } from '@/features/vendors/types';
import { useVendors, usePrimaryVendor } from '@/features/vendors/hooks/useVendors';

export interface ScheduleCleaningSheetProps {
  visible: boolean;
  onClose: () => void;
  propertyId: string;
  propertyAddress?: string;
  checkoutAt: string;
  checkinAt?: string | null;
  onSchedule: (vendorId: string, scheduledAt: string, sendMessage?: boolean) => Promise<void>;
}

export function ScheduleCleaningSheet({
  visible,
  onClose,
  propertyId,
  propertyAddress,
  checkoutAt,
  checkinAt,
  onSchedule,
}: ScheduleCleaningSheetProps) {
  const colors = useThemeColors();

  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [sendMessage, setSendMessage] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);

  // Fetch cleaners (vendors in cleaner category)
  const { data: vendors = [], isLoading } = useVendors(propertyId);
  const { data: primaryCleaner } = usePrimaryVendor(propertyId, 'cleaner');

  const cleaners = vendors.filter((v) => v.category === 'cleaner');

  // Initialize default values when sheet opens
  useEffect(() => {
    if (visible) {
      // Default to primary cleaner if available
      if (primaryCleaner) {
        setSelectedVendorId(primaryCleaner.id);
      } else if (cleaners.length === 1) {
        setSelectedVendorId(cleaners[0].id);
      }

      // Default to checkout date
      if (checkoutAt) {
        const date = new Date(checkoutAt);
        setScheduledDate(date.toISOString().split('T')[0]);
        // Default to 2 hours after checkout
        date.setHours(date.getHours() + 2);
        setScheduledTime(
          date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        );
      }
    }
  }, [visible, primaryCleaner, cleaners, checkoutAt]);

  // Handle schedule
  const handleSchedule = useCallback(async () => {
    if (!selectedVendorId) {
      Alert.alert('Required', 'Please select a cleaner');
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      Alert.alert('Required', 'Please select date and time');
      return;
    }

    setIsScheduling(true);
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      await onSchedule(selectedVendorId, scheduledAt, sendMessage);
      onClose();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to schedule cleaning'
      );
    } finally {
      setIsScheduling(false);
    }
  }, [selectedVendorId, scheduledDate, scheduledTime, sendMessage, onSchedule, onClose]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const selectedVendor = cleaners.find((v) => v.id === selectedVendorId);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Schedule Cleaning"
      snapPoints={['85%']}
      useGlass={false}
      useGlassBackdrop={false}
    >
      {/* Context Info */}
        <View className="px-4 mb-4">
          <View
            className="p-3 rounded-lg"
            style={{ backgroundColor: colors.muted }}
          >
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.sm,
                fontWeight: '500',
              }}
            >
              {propertyAddress || 'Property'}
            </Text>
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: FONT_SIZES.xs,
                marginTop: 4,
              }}
            >
              Checkout: {formatDateTime(checkoutAt)}
              {checkinAt && ` • Next check-in: ${formatDateTime(checkinAt)}`}
            </Text>
          </View>
        </View>

        {/* Cleaner Selection */}
        <BottomSheetSection title="Select Cleaner">
          {isLoading ? (
            <LoadingSpinner size="small" />
          ) : cleaners.length === 0 ? (
            <View
              className="py-6 items-center rounded-xl"
              style={{ backgroundColor: colors.muted }}
            >
              <User size={ICON_SIZES['2xl']} color={colors.mutedForeground} />
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: FONT_SIZES.sm,
                  marginTop: 8,
                  textAlign: 'center',
                }}
              >
                No cleaners found.{'\n'}Add a vendor in the Cleaner category first.
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {cleaners.map((vendor) => {
                const isSelected = selectedVendorId === vendor.id;
                const isPrimary = vendor.is_primary;

                return (
                  <TouchableOpacity
                    key={vendor.id}
                    onPress={() => setSelectedVendorId(vendor.id)}
                    className="flex-row items-center p-3 rounded-xl"
                    style={{
                      backgroundColor: isSelected
                        ? withOpacity(colors.primary, 'light')
                        : colors.muted,
                      borderWidth: isSelected ? 1 : 0,
                      borderColor: colors.primary,
                    }}
                    activeOpacity={PRESS_OPACITY.DEFAULT}
                  >
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: colors.card }}
                    >
                      <Text style={{ fontSize: 18 }}>
                        {VENDOR_CATEGORY_CONFIG.cleaner.emoji}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text
                          style={{
                            color: colors.foreground,
                            fontSize: FONT_SIZES.base,
                            fontWeight: '500',
                          }}
                        >
                          {vendor.name}
                        </Text>
                        {isPrimary && (
                          <Badge variant="success" size="sm">
                            Primary
                          </Badge>
                        )}
                      </View>
                      {vendor.company_name && (
                        <Text
                          style={{
                            color: colors.mutedForeground,
                            fontSize: FONT_SIZES.xs,
                          }}
                        >
                          {vendor.company_name}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </BottomSheetSection>

        {/* Date & Time */}
        <BottomSheetSection title="Schedule">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <FormField label="Date" required>
                <Input
                  value={scheduledDate}
                  onChangeText={setScheduledDate}
                  placeholder="YYYY-MM-DD"
                  leftIcon={<Calendar size={18} color={colors.mutedForeground} />}
                />
              </FormField>
            </View>
            <View className="flex-1">
              <FormField label="Time" required>
                <Input
                  value={scheduledTime}
                  onChangeText={setScheduledTime}
                  placeholder="HH:MM"
                  leftIcon={<Clock size={18} color={colors.mutedForeground} />}
                />
              </FormField>
            </View>
          </View>
        </BottomSheetSection>

      {/* Send Message Toggle */}
      {selectedVendor && (selectedVendor.phone || selectedVendor.email) && (
        <BottomSheetSection title="Notification">
          <TouchableOpacity
            onPress={() => setSendMessage(!sendMessage)}
            className="flex-row items-center p-3 rounded-xl"
            style={{
              backgroundColor: sendMessage
                ? withOpacity(colors.primary, 'light')
                : colors.muted,
            }}
            activeOpacity={PRESS_OPACITY.DEFAULT}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: colors.card }}
            >
              {sendMessage ? (
                <Sparkles size={ICON_SIZES.lg} color={colors.primary} />
              ) : (
                <Send size={ICON_SIZES.lg} color={colors.mutedForeground} />
              )}
            </View>
            <View className="flex-1">
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: FONT_SIZES.base,
                  fontWeight: '500',
                }}
              >
                {sendMessage ? 'AI will send message' : 'No message'}
              </Text>
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: FONT_SIZES.xs,
                }}
              >
                {sendMessage
                  ? `AI will compose and send via ${selectedVendor.preferred_contact_method || 'SMS'}`
                  : 'You will need to contact the cleaner manually'}
              </Text>
            </View>
          </TouchableOpacity>
        </BottomSheetSection>
      )}

      {/* Footer Actions */}
      <View
        className="flex-row gap-3 pt-4 pb-6 px-4"
        style={{ borderTopWidth: 1, borderTopColor: colors.border }}
      >
        <Button
          variant="outline"
          onPress={onClose}
          className="flex-1"
          disabled={isScheduling}
        >
          Cancel
        </Button>
        <Button
          onPress={handleSchedule}
          className="flex-1"
          disabled={isScheduling || !selectedVendorId || cleaners.length === 0}
        >
          {isScheduling ? (
            <LoadingSpinner size="small" color="white" />
          ) : (
            'Schedule'
          )}
        </Button>
      </View>
    </BottomSheet>
  );
}

export default ScheduleCleaningSheet;
