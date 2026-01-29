// src/features/smart-home/components/GenerateCodeSheet.tsx
// Bottom sheet for generating access codes for a lock

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Calendar, Key, User } from 'lucide-react-native';
import { BottomSheet, Button } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import { useAccessCodeMutations } from '../hooks/useSmartHome';
import type { SmartDevice, CreateAccessCodeInput } from '../types';

interface GenerateCodeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  device: SmartDevice;
  bookingId?: string;
  bookingInfo?: {
    guestName: string;
    startDate: string;
    endDate: string;
  };
}

export function GenerateCodeSheet({
  isOpen,
  onClose,
  device,
  bookingId,
  bookingInfo,
}: GenerateCodeSheetProps) {
  const colors = useThemeColors();
  const { create, isCreating } = useAccessCodeMutations();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [useCustomCode, setUseCustomCode] = useState(false);
  const [useDateRange, setUseDateRange] = useState(!!bookingInfo);
  const [startsAt, setStartsAt] = useState(bookingInfo?.startDate || '');
  const [endsAt, setEndsAt] = useState(bookingInfo?.endDate || '');

  // Set default name from booking
  useEffect(() => {
    if (bookingInfo?.guestName && !name) {
      setName(`${bookingInfo.guestName} - Guest Code`);
    }
  }, [bookingInfo?.guestName, name]);

  const generateRandomCode = useCallback(() => {
    const length = Math.random() > 0.5 ? 6 : 4;
    let newCode = '';
    for (let i = 0; i < length; i++) {
      newCode += Math.floor(Math.random() * 10).toString();
    }
    setCode(newCode);
  }, []);

  const resetForm = useCallback(() => {
    setName(bookingInfo?.guestName ? `${bookingInfo.guestName} - Guest Code` : '');
    setCode('');
    setUseCustomCode(false);
    setUseDateRange(!!bookingInfo);
    setStartsAt(bookingInfo?.startDate || '');
    setEndsAt(bookingInfo?.endDate || '');
  }, [bookingInfo]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for this code');
      return;
    }

    if (useCustomCode && (!code || code.length < 4)) {
      Alert.alert('Error', 'Code must be at least 4 digits');
      return;
    }

    const input: CreateAccessCodeInput = {
      device_id: device.id,
      booking_id: bookingId,
      name: name.trim(),
      code: useCustomCode ? code : undefined,
      starts_at: useDateRange && startsAt ? new Date(startsAt).toISOString() : undefined,
      ends_at: useDateRange && endsAt ? new Date(endsAt).toISOString() : undefined,
    };

    try {
      const result = await create(input);
      Alert.alert(
        'Code Created',
        `Access code ${result.code} has been created for ${device.name}`,
        [{ text: 'OK', onPress: handleClose }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create access code. Please try again.');
    }
  }, [device, bookingId, name, code, useCustomCode, useDateRange, startsAt, endsAt, create, handleClose]);

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} snapPoints={['70%']}>
      <View className="flex-1 px-4">
        <Text className="text-xl font-bold mb-4" style={{ color: colors.foreground }}>
          Generate Access Code
        </Text>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Device info */}
          <View
            className="rounded-lg p-3 mb-4"
            style={{ backgroundColor: colors.muted }}
          >
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              Device
            </Text>
            <Text className="font-medium" style={{ color: colors.foreground }}>
              {device.name}
            </Text>
          </View>

          {/* Name */}
          <Text className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>
            Code Name *
          </Text>
          <View
            className="flex-row items-center rounded-lg px-3 mb-4"
            style={{ backgroundColor: colors.muted }}
          >
            <User size={18} color={colors.mutedForeground} />
            <TextInput
              className="flex-1 p-3"
              style={{ color: colors.foreground }}
              placeholder="e.g., John Smith - Guest Code"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Custom Code Toggle */}
          <TouchableOpacity
            className="flex-row items-center mb-4"
            onPress={() => {
              setUseCustomCode(!useCustomCode);
              if (!useCustomCode) generateRandomCode();
            }}
          >
            <View
              className="w-5 h-5 rounded border-2 mr-2 items-center justify-center"
              style={{
                borderColor: useCustomCode ? colors.primary : colors.muted,
                backgroundColor: useCustomCode ? colors.primary : 'transparent',
              }}
            >
              {useCustomCode && (
                <Text style={{ color: colors.primaryForeground, fontSize: 12 }}>*</Text>
              )}
            </View>
            <Text style={{ color: colors.foreground }}>Use custom code</Text>
          </TouchableOpacity>

          {/* Custom Code Input */}
          {useCustomCode && (
            <View className="mb-4">
              <Text className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>
                Access Code
              </Text>
              <View className="flex-row items-center">
                <View
                  className="flex-row items-center flex-1 rounded-lg px-3"
                  style={{ backgroundColor: colors.muted }}
                >
                  <Key size={18} color={colors.mutedForeground} />
                  <TextInput
                    className="flex-1 p-3 font-mono text-lg"
                    style={{ color: colors.foreground }}
                    placeholder="1234"
                    placeholderTextColor={colors.mutedForeground}
                    value={code}
                    onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    maxLength={8}
                  />
                </View>
                <TouchableOpacity
                  className="ml-2 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: colors.primary }}
                  onPress={generateRandomCode}
                >
                  <Text style={{ color: colors.primaryForeground }}>Random</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Date Range Toggle */}
          <TouchableOpacity
            className="flex-row items-center mb-4"
            onPress={() => setUseDateRange(!useDateRange)}
          >
            <View
              className="w-5 h-5 rounded border-2 mr-2 items-center justify-center"
              style={{
                borderColor: useDateRange ? colors.primary : colors.muted,
                backgroundColor: useDateRange ? colors.primary : 'transparent',
              }}
            >
              {useDateRange && (
                <Text style={{ color: colors.primaryForeground, fontSize: 12 }}>*</Text>
              )}
            </View>
            <Text style={{ color: colors.foreground }}>Set date range (auto-expire)</Text>
          </TouchableOpacity>

          {/* Date Range Inputs */}
          {useDateRange && (
            <View className="mb-4">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>
                    Start Date
                  </Text>
                  <View
                    className="flex-row items-center rounded-lg px-3"
                    style={{ backgroundColor: colors.muted }}
                  >
                    <Calendar size={16} color={colors.mutedForeground} />
                    <TextInput
                      className="flex-1 p-3"
                      style={{ color: colors.foreground }}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.mutedForeground}
                      value={startsAt}
                      onChangeText={setStartsAt}
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>
                    End Date
                  </Text>
                  <View
                    className="flex-row items-center rounded-lg px-3"
                    style={{ backgroundColor: colors.muted }}
                  >
                    <Calendar size={16} color={colors.mutedForeground} />
                    <TextInput
                      className="flex-1 p-3"
                      style={{ color: colors.foreground }}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.mutedForeground}
                      value={endsAt}
                      onChangeText={setEndsAt}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Booking info notice */}
          {bookingInfo && (
            <View
              className="rounded-lg p-3 mb-4"
              style={{ backgroundColor: `${colors.info}20` }}
            >
              <Text className="text-sm" style={{ color: colors.info }}>
                This code will be linked to the booking for {bookingInfo.guestName}.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Submit Button */}
        <View className="py-4">
          <Button
            onPress={handleSubmit}
            loading={isCreating}
            disabled={isCreating}
            className="w-full"
          >
            Generate Code
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
}
