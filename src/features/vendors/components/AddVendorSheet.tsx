// src/features/vendors/components/AddVendorSheet.tsx
// Bottom sheet for adding a new vendor

import React, { useState, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';
import {
  BottomSheet,
  BottomSheetSection,
  Button,
  Input,
  Select,
  FormField,
  Switch,
} from '@/components/ui';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import {
  VendorCategory,
  CreateVendorInput,
  VENDOR_CATEGORY_CONFIG,
} from '../types';
import { useVendorMutations } from '../hooks/useVendors';

export interface AddVendorSheetProps {
  visible: boolean;
  onClose: () => void;
  propertyId?: string; // If provided, vendor is property-specific
  onSuccess?: () => void;
}

export function AddVendorSheet({
  visible,
  onClose,
  propertyId,
  onSuccess,
}: AddVendorSheetProps) {
  const colors = useThemeColors();
  const { createVendor, isCreating } = useVendorMutations(propertyId);

  // Form state
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState<VendorCategory>('handyman');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [preferredContact, setPreferredContact] = useState<'phone' | 'email' | 'sms'>('phone');
  const [hourlyRate, setHourlyRate] = useState('');
  const [serviceFee, setServiceFee] = useState('');
  const [notes, setNotes] = useState('');

  // Reset form
  const resetForm = useCallback(() => {
    setName('');
    setCompanyName('');
    setCategory('handyman');
    setPhone('');
    setEmail('');
    setAddress('');
    setIsPrimary(false);
    setPreferredContact('phone');
    setHourlyRate('');
    setServiceFee('');
    setNotes('');
  }, []);

  // Handle submit
  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter the vendor name');
      return;
    }

    try {
      const input: CreateVendorInput = {
        property_id: propertyId,
        name: name.trim(),
        company_name: companyName.trim() || undefined,
        category,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        is_primary: isPrimary,
        preferred_contact_method: preferredContact,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        service_fee: serviceFee ? parseFloat(serviceFee) : undefined,
        notes: notes.trim() || undefined,
      };

      await createVendor(input);
      resetForm();
      onClose();
      onSuccess?.();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to add vendor'
      );
    }
  };

  // Category options
  const categoryOptions = Object.entries(VENDOR_CATEGORY_CONFIG).map(
    ([value, config]) => ({
      value,
      label: `${config.emoji} ${config.label}`,
    })
  );

  // Contact method options
  const contactOptions = [
    { value: 'phone', label: 'Phone Call' },
    { value: 'sms', label: 'Text/SMS' },
    { value: 'email', label: 'Email' },
  ];

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add Vendor"
      snapPoints={['90%']}
    >
      {/* Basic Info */}
      <BottomSheetSection title="Basic Information">
        <FormField label="Name" required>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g., John Smith"
            autoCapitalize="words"
          />
        </FormField>

        <FormField label="Company Name" className="mt-3">
          <Input
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="e.g., ABC Plumbing Services"
            autoCapitalize="words"
          />
        </FormField>

        <FormField label="Category" required className="mt-3">
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as VendorCategory)}
            options={categoryOptions}
          />
        </FormField>

        <View className="flex-row items-center justify-between mt-4 py-2">
          <View>
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.base,
                fontWeight: '500',
              }}
            >
              Primary Vendor
            </Text>
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: FONT_SIZES.sm,
              }}
            >
              Preferred vendor for this category
            </Text>
          </View>
          <Switch value={isPrimary} onValueChange={setIsPrimary} />
        </View>
      </BottomSheetSection>

      {/* Contact Info */}
      <BottomSheetSection title="Contact Information">
        <FormField label="Phone">
          <Input
            value={phone}
            onChangeText={setPhone}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
          />
        </FormField>

        <FormField label="Email" className="mt-3">
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="vendor@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </FormField>

        <FormField label="Address" className="mt-3">
          <Input
            value={address}
            onChangeText={setAddress}
            placeholder="123 Main St, City, State"
          />
        </FormField>

        <FormField label="Preferred Contact" className="mt-3">
          <Select
            value={preferredContact}
            onValueChange={(v) => setPreferredContact(v as 'phone' | 'email' | 'sms')}
            options={contactOptions}
          />
        </FormField>
      </BottomSheetSection>

      {/* Rates */}
      <BottomSheetSection title="Rates">
        <FormField label="Hourly Rate">
          <Input
            value={hourlyRate}
            onChangeText={setHourlyRate}
            placeholder="0.00"
            keyboardType="decimal-pad"
            leftIcon={<Text style={{ color: colors.mutedForeground }}>$</Text>}
          />
        </FormField>

        <FormField label="Service/Call-out Fee" className="mt-3">
          <Input
            value={serviceFee}
            onChangeText={setServiceFee}
            placeholder="0.00"
            keyboardType="decimal-pad"
            leftIcon={<Text style={{ color: colors.mutedForeground }}>$</Text>}
          />
        </FormField>
      </BottomSheetSection>

      {/* Notes */}
      <BottomSheetSection title="Notes">
        <FormField label="">
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes about this vendor..."
            multiline
            numberOfLines={3}
            style={{ minHeight: 80 }}
          />
        </FormField>
      </BottomSheetSection>

      {/* Footer Actions */}
      <View
        className="flex-row gap-3 pt-4 pb-6 px-4"
        style={{ borderTopWidth: 1, borderTopColor: colors.border }}
      >
        <Button
          variant="outline"
          onPress={onClose}
          className="flex-1"
          disabled={isCreating}
        >
          Cancel
        </Button>
        <Button
          onPress={handleSubmit}
          className="flex-1"
          disabled={isCreating || !name.trim()}
        >
          {isCreating ? 'Adding...' : 'Add Vendor'}
        </Button>
      </View>
    </BottomSheet>
  );
}

export default AddVendorSheet;
