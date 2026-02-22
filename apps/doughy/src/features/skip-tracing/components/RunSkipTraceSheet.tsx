// src/features/skip-tracing/components/RunSkipTraceSheet.tsx
// Bottom sheet for running a new skip trace

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Alert } from 'react-native';
import { Search, User, MapPin, Building2 } from 'lucide-react-native';
import { BottomSheet, Button } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useRunSkipTrace } from '../hooks/useSkipTracing';
import { isValidSkipTraceInput, getSkipTraceInputValidationError } from '../types';
import type { SkipTraceInput } from '../types';

interface RunSkipTraceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  // Pre-fill options
  contactId?: string;
  leadId?: string;
  propertyId?: string;
  initialData?: {
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  onSuccess?: (resultId: string) => void;
}

export function RunSkipTraceSheet({
  isOpen,
  onClose,
  contactId,
  leadId,
  propertyId,
  initialData,
  onSuccess,
}: RunSkipTraceSheetProps) {
  const colors = useThemeColors();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  const runSkipTrace = useRunSkipTrace();

  // Reset form fields helper
  const resetToInitialValues = () => {
    setFirstName(initialData?.firstName || '');
    setLastName(initialData?.lastName || '');
    setAddress(initialData?.address || '');
    setCity(initialData?.city || '');
    setState(initialData?.state || '');
    setZip(initialData?.zip || '');
  };

  // Pre-fill and reset form based on sheet state and initialData
  useEffect(() => {
    if (isOpen) {
      resetToInitialValues();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    initialData?.firstName,
    initialData?.lastName,
    initialData?.address,
    initialData?.city,
    initialData?.state,
    initialData?.zip,
  ]);

  // Build current input for validation
  const currentInput: SkipTraceInput = {
    first_name: firstName.trim() || undefined,
    last_name: lastName.trim() || undefined,
    address: address.trim() || undefined,
    city: city.trim() || undefined,
    state: state.trim() || undefined,
    zip: zip.trim() || undefined,
    contact_id: contactId,
    lead_id: leadId,
    property_id: propertyId,
  };

  const canSubmit = isValidSkipTraceInput(currentInput);

  const handleSubmit = async () => {
    const validationError = getSkipTraceInputValidationError(currentInput);
    if (validationError) {
      Alert.alert('Missing Information', validationError);
      return;
    }

    try {
      const result = await runSkipTrace.mutateAsync(currentInput);
      onClose();

      if (onSuccess && result?.id) {
        onSuccess(result.id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to run skip trace. Please try again.';
      console.error('Skip trace submission failed:', error);
      Alert.alert('Skip Trace Failed', errorMessage);
    }
  };

  const inputStyle = {
    backgroundColor: colors.muted,
    borderRadius: 8,
    padding: 12,
    color: colors.foreground,
    fontSize: 16,
  };

  const labelStyle = {
    color: colors.mutedForeground,
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500' as const,
  };

  return (
    <BottomSheet
      visible={isOpen}
      onClose={onClose}
      title="Run Skip Trace"
      snapPoints={['85%']}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Info Box */}
        <View
          style={{
            backgroundColor: colors.primary + '15',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Search size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>
              Tracerfy Skip Tracing
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
            Find phone numbers, emails, addresses, and property ownership information.
            Provide either a name or an address to search.
          </Text>
        </View>

        {/* Person Information */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <User size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>
              Person Information
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={labelStyle}>First Name</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="John"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="words"
                style={inputStyle}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={labelStyle}>Last Name</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Smith"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="words"
                style={inputStyle}
              />
            </View>
          </View>
        </View>

        {/* Address Information */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <MapPin size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>
              Address Information
            </Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={labelStyle}>Street Address</Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="123 Main Street"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="words"
              style={inputStyle}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={labelStyle}>City</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Austin"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="words"
                style={inputStyle}
              />
            </View>
            <View style={{ width: 80 }}>
              <Text style={labelStyle}>State</Text>
              <TextInput
                value={state}
                onChangeText={setState}
                placeholder="TX"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
                maxLength={2}
                style={inputStyle}
              />
            </View>
          </View>

          <View style={{ width: 120 }}>
            <Text style={labelStyle}>ZIP Code</Text>
            <TextInput
              value={zip}
              onChangeText={setZip}
              placeholder="78701"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              maxLength={10}
              style={inputStyle}
            />
          </View>
        </View>

        {/* Linked Records Info */}
        {(contactId || leadId || propertyId) && (
          <View
            style={{
              backgroundColor: colors.muted,
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Building2 size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>
                Linked Records
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
              {contactId && 'This trace will be linked to the selected contact. '}
              {leadId && 'This trace will be linked to the selected lead. '}
              {propertyId && 'This trace will be linked to the selected property.'}
            </Text>
          </View>
        )}

        {/* Credit Info */}
        <View
          style={{
            backgroundColor: colors.warning + '15',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            Each skip trace uses 1 credit from your Tracerfy account. Results typically
            include phone numbers, email addresses, and property ownership information.
          </Text>
        </View>

        {/* Submit Button */}
        <Button
          onPress={handleSubmit}
          disabled={!canSubmit || runSkipTrace.isPending}
          style={{ marginTop: 8 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Search size={18} color={colors.primaryForeground} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.primaryForeground, fontWeight: '500' }}>
              {runSkipTrace.isPending ? 'Running Skip Trace...' : 'Run Skip Trace'}
            </Text>
          </View>
        </Button>
      </ScrollView>
    </BottomSheet>
  );
}
