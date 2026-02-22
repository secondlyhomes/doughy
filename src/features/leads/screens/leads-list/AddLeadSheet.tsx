// src/features/leads/screens/leads-list/AddLeadSheet.tsx
// Quick-add lead bottom sheet for leads list screen

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { BottomSheet, BottomSheetSection, Button, FormField } from '@/components/ui';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useCreateLead } from '../../hooks/useLeads';

export interface AddLeadSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function AddLeadSheet({ visible, onClose }: AddLeadSheetProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const createLead = useCreateLead();

  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');

  const resetForm = useCallback(() => {
    setNewLeadName('');
    setNewLeadPhone('');
    setNewLeadEmail('');
  }, []);

  const handleQuickAddLead = useCallback(async () => {
    if (!newLeadName.trim()) return;

    try {
      await createLead.mutateAsync({
        name: newLeadName.trim(),
        phone: newLeadPhone.trim() || undefined,
        email: newLeadEmail.trim() || undefined,
        status: 'new',
      });

      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to create lead:', error);
      Alert.alert(
        'Failed to Add Lead',
        'Unable to create the lead. Please check your connection and try again.'
      );
    }
  }, [newLeadName, newLeadPhone, newLeadEmail, createLead, resetForm, onClose]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add Lead">
      <BottomSheetSection>
        <FormField label="Name" required value={newLeadName} onChangeText={setNewLeadName} placeholder="Contact name" />
        <FormField label="Phone" value={newLeadPhone} onChangeText={setNewLeadPhone} placeholder="(555) 123-4567" keyboardType="phone-pad" />
        <FormField label="Email" value={newLeadEmail} onChangeText={setNewLeadEmail} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" />
      </BottomSheetSection>

      <View className="flex-row gap-3 pt-4 pb-6">
        <Button variant="outline" onPress={onClose} className="flex-1">Cancel</Button>
        <Button onPress={handleQuickAddLead} className="flex-1" disabled={!newLeadName.trim() || createLead.isPending}>
          {createLead.isPending ? 'Adding...' : 'Add Lead'}
        </Button>
      </View>

      <TouchableOpacity onPress={() => { onClose(); router.push('/(tabs)/leads/add'); }} style={{ paddingBottom: 16 }}>
        <Text style={{ color: colors.primary, textAlign: 'center' }}>Need more options? Use full form →</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}
