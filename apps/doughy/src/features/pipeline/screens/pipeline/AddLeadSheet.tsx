// src/features/pipeline/screens/pipeline/AddLeadSheet.tsx
// Quick-add lead bottom sheet for pipeline screen

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomSheet, BottomSheetSection, Button, FormField } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';

export interface AddLeadSheetProps {
  visible: boolean;
  onClose: () => void;
  newLeadName: string;
  onNameChange: (text: string) => void;
  newLeadPhone: string;
  onPhoneChange: (text: string) => void;
  newLeadEmail: string;
  onEmailChange: (text: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function AddLeadSheet({
  visible,
  onClose,
  newLeadName,
  onNameChange,
  newLeadPhone,
  onPhoneChange,
  newLeadEmail,
  onEmailChange,
  onSubmit,
  isPending,
}: AddLeadSheetProps) {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add Lead"
    >
      <BottomSheetSection>
        <FormField
          label="Name"
          required
          value={newLeadName}
          onChangeText={onNameChange}
          placeholder="Contact name"
        />
        <FormField
          label="Phone"
          value={newLeadPhone}
          onChangeText={onPhoneChange}
          placeholder="(555) 123-4567"
          keyboardType="phone-pad"
        />
        <FormField
          label="Email"
          value={newLeadEmail}
          onChangeText={onEmailChange}
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </BottomSheetSection>

      <View className="flex-row gap-3 pt-4 pb-6">
        <Button variant="outline" onPress={onClose} className="flex-1">
          Cancel
        </Button>
        <Button
          onPress={onSubmit}
          className="flex-1"
          disabled={!newLeadName.trim() || isPending}
        >
          {isPending ? 'Adding...' : 'Add Lead'}
        </Button>
      </View>

      <TouchableOpacity
        onPress={() => {
          onClose();
          router.push('/(tabs)/pipeline/lead/add');
        }}
        style={{ paddingBottom: 16 }}
      >
        <Text style={{ color: colors.primary, textAlign: 'center' }}>
          Need more options? Use full form
        </Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}
