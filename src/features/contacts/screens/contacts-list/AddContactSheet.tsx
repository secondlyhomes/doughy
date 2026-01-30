// src/features/contacts/screens/contacts-list/AddContactSheet.tsx
// Bottom sheet for adding a new contact

import React from 'react';
import { View } from 'react-native';
import { BottomSheet, BottomSheetSection, Button, FormField } from '@/components/ui';
import type { AddContactSheetProps } from './types';

export function AddContactSheet({
  visible,
  onClose,
  firstName,
  lastName,
  phone,
  email,
  onFirstNameChange,
  onLastNameChange,
  onPhoneChange,
  onEmailChange,
  onSubmit,
  isSubmitting,
}: AddContactSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add Contact">
      <BottomSheetSection>
        <FormField
          label="First Name"
          required
          value={firstName}
          onChangeText={onFirstNameChange}
          placeholder="First name"
        />
        <FormField
          label="Last Name"
          value={lastName}
          onChangeText={onLastNameChange}
          placeholder="Last name"
        />
        <FormField
          label="Phone"
          value={phone}
          onChangeText={onPhoneChange}
          placeholder="(555) 123-4567"
          keyboardType="phone-pad"
        />
        <FormField
          label="Email"
          value={email}
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
          disabled={!firstName.trim() || isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Contact'}
        </Button>
      </View>
    </BottomSheet>
  );
}
