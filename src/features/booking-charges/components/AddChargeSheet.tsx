// src/features/booking-charges/components/AddChargeSheet.tsx
// Bottom sheet for adding a new charge to a booking

import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { BottomSheet, Button, Badge } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import { useChargeMutations } from '../hooks/useBookingCharges';
import type { BookingChargeType, CreateChargeInput } from '../types';
import { CHARGE_TYPE_CONFIG } from '../types';

interface AddChargeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  maintenanceId?: string;
  defaultType?: BookingChargeType;
  defaultAmount?: number;
  defaultDescription?: string;
}

export function AddChargeSheet({
  isOpen,
  onClose,
  bookingId,
  maintenanceId,
  defaultType = 'other',
  defaultAmount,
  defaultDescription,
}: AddChargeSheetProps) {
  const colors = useThemeColors();
  const { createCharge, isLoading } = useChargeMutations();

  const [type, setType] = useState<BookingChargeType>(defaultType);
  const [description, setDescription] = useState(defaultDescription || '');
  const [amount, setAmount] = useState(defaultAmount?.toString() || '');
  const [notes, setNotes] = useState('');

  const resetForm = useCallback(() => {
    setType(defaultType);
    setDescription(defaultDescription || '');
    setAmount(defaultAmount?.toString() || '');
    setNotes('');
  }, [defaultType, defaultDescription, defaultAmount]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async () => {
    const amountNum = parseFloat(amount);

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const input: CreateChargeInput = {
      booking_id: bookingId,
      maintenance_id: maintenanceId,
      type,
      description: description.trim(),
      amount: amountNum,
      notes: notes.trim() || undefined,
    };

    try {
      await createCharge.mutateAsync(input);
      handleClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create charge. Please try again.');
    }
  }, [bookingId, maintenanceId, type, description, amount, notes, createCharge, handleClose]);

  const chargeTypes = Object.entries(CHARGE_TYPE_CONFIG) as [BookingChargeType, typeof CHARGE_TYPE_CONFIG[BookingChargeType]][];

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} snapPoints={['70%']}>
      <View className="flex-1 px-4">
        <Text className="text-xl font-bold mb-4" style={{ color: colors.foreground }}>
          Add Charge
        </Text>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Charge Type Selection */}
          <Text className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>
            Charge Type
          </Text>
          <View className="flex-row flex-wrap mb-4">
            {chargeTypes.map(([key, config]) => (
              <TouchableOpacity
                key={key}
                className="mr-2 mb-2 px-3 py-2 rounded-lg flex-row items-center"
                style={{
                  backgroundColor: type === key ? colors.primary : colors.muted,
                }}
                onPress={() => setType(key)}
              >
                <Text className="mr-1">{config.emoji}</Text>
                <Text
                  className="text-sm font-medium"
                  style={{ color: type === key ? colors.primaryForeground : colors.foreground }}
                >
                  {config.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description */}
          <Text className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>
            Description *
          </Text>
          <TextInput
            className="rounded-lg p-3 mb-4"
            style={{
              backgroundColor: colors.muted,
              color: colors.foreground,
              minHeight: 80,
            }}
            placeholder="Describe the charge..."
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />

          {/* Amount */}
          <Text className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>
            Amount *
          </Text>
          <View
            className="flex-row items-center rounded-lg px-3 mb-4"
            style={{ backgroundColor: colors.muted }}
          >
            <Text style={{ color: colors.foreground }}>$</Text>
            <TextInput
              className="flex-1 p-3"
              style={{ color: colors.foreground }}
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Notes */}
          <Text className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>
            Notes (optional)
          </Text>
          <TextInput
            className="rounded-lg p-3 mb-4"
            style={{
              backgroundColor: colors.muted,
              color: colors.foreground,
            }}
            placeholder="Additional notes..."
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {/* Linked Maintenance Notice */}
          {maintenanceId && (
            <View
              className="rounded-lg p-3 mb-4"
              style={{ backgroundColor: `${colors.info}20` }}
            >
              <Text className="text-sm" style={{ color: colors.info }}>
                This charge will be linked to the associated maintenance work order.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Submit Button */}
        <View className="py-4">
          <Button
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            className="w-full"
          >
            Add Charge
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
}
