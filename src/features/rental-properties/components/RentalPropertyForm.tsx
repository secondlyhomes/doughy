// src/features/rental-properties/components/RentalPropertyForm.tsx
// Form component for creating/editing rental properties
// Follows AddLeadScreen pattern with useFormValidation

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  Home,
  MapPin,
  Building2,
  Bed,
  Bath,
  Maximize2,
  DollarSign,
  X,
  ChevronDown,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { FormField, AddressAutofill } from '@/components/ui';
import type { AddressAutofillValue } from '@/components/ui';
import { useFormValidation, useFieldRef } from '@/hooks';
import { rentalPropertyFormSchema, rentalPropertyFieldOrder } from '@/lib/validation';
import {
  RentalPropertyFormData,
  defaultRentalPropertyFormValues,
  COMMON_AMENITIES,
} from '../types/form';
import type { PropertyType, RentalType, RateType, PropertyStatus } from '../types';

// Property type options
const PROPERTY_TYPE_OPTIONS: { label: string; value: PropertyType }[] = [
  { label: 'Single Family', value: 'single_family' },
  { label: 'Multi-Family', value: 'multi_family' },
  { label: 'Condo', value: 'condo' },
  { label: 'Apartment', value: 'apartment' },
  { label: 'Townhouse', value: 'townhouse' },
  { label: 'Room', value: 'room' },
];

// Rental type options
const RENTAL_TYPE_OPTIONS: { label: string; value: RentalType }[] = [
  { label: 'Short-Term (STR)', value: 'str' },
  { label: 'Mid-Term (MTR)', value: 'mtr' },
  { label: 'Long-Term (LTR)', value: 'ltr' },
];

// Rate type options
const RATE_TYPE_OPTIONS: { label: string; value: RateType }[] = [
  { label: 'Nightly', value: 'nightly' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

// Status options
const STATUS_OPTIONS: { label: string; value: PropertyStatus }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Maintenance', value: 'maintenance' },
];

type FieldName = keyof RentalPropertyFormData;

interface RentalPropertyFormProps {
  initialValues?: Partial<RentalPropertyFormData>;
  onSubmit: (data: RentalPropertyFormData) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function RentalPropertyForm({
  initialValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Create Property',
}: RentalPropertyFormProps) {
  const colors = useThemeColors();

  // Field refs for scroll-to-error
  const fieldRefs = useFieldRef<FieldName>();

  // Form validation hook
  const form = useFormValidation<RentalPropertyFormData>({
    initialValues: {
      ...defaultRentalPropertyFormValues,
      ...initialValues,
    },
    schema: rentalPropertyFormSchema,
    validationMode: 'onChange',
    debounceMs: 300,
    fieldOrder: rentalPropertyFieldOrder,
    onScrollToError: (fieldName) => {
      fieldRefs.scrollToField(fieldName as FieldName);
    },
    onSubmit: async (values) => {
      await onSubmit(values);
    },
  });

  // Dropdown states
  const [showPropertyTypePicker, setShowPropertyTypePicker] = useState(false);
  const [showRentalTypePicker, setShowRentalTypePicker] = useState(false);
  const [showRateTypePicker, setShowRateTypePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // Amenity toggle handler
  const handleAmenityToggle = useCallback((amenity: string) => {
    const currentAmenities = form.values.amenities || [];
    if (currentAmenities.includes(amenity)) {
      form.updateField('amenities', currentAmenities.filter(a => a !== amenity));
    } else {
      form.updateField('amenities', [...currentAmenities, amenity]);
    }
  }, [form]);

  // Get label for picker value
  const getPickerLabel = <T extends string>(
    value: T | undefined,
    options: { label: string; value: T }[],
    placeholder: string
  ) => {
    const option = options.find(o => o.value === value);
    return option?.label || placeholder;
  };

  // Render inline picker
  const renderPicker = <T extends string>(
    label: string,
    value: T | undefined,
    options: { label: string; value: T }[],
    placeholder: string,
    showPicker: boolean,
    setShowPicker: (show: boolean) => void,
    onChange: (value: T) => void
  ) => (
    <View className="mb-4">
      <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>{label}</Text>
      <TouchableOpacity
        className="flex-row items-center justify-between rounded-lg px-3 py-3"
        style={{ backgroundColor: colors.muted }}
        onPress={() => setShowPicker(!showPicker)}
      >
        <Text className="text-base" style={{ color: colors.foreground }}>
          {getPickerLabel(value, options, placeholder)}
        </Text>
        <ChevronDown size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      {showPicker && (
        <View
          className="rounded-lg mt-2 overflow-hidden"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          {options.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              className="px-4 py-3"
              style={{
                borderBottomWidth: index < options.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
                backgroundColor: value === option.value ? withOpacity(colors.primary, 'muted') : 'transparent',
              }}
              onPress={() => {
                onChange(option.value);
                setShowPicker(false);
              }}
            >
              <Text
                className="text-base"
                style={{
                  color: value === option.value ? colors.primary : colors.foreground,
                  fontWeight: value === option.value ? '500' : 'normal',
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView
      ref={fieldRefs.scrollViewRef}
      className="flex-1"
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Section: Basic Info */}
      <Text className="text-lg font-semibold mb-3" style={{ color: colors.foreground }}>
        Basic Info
      </Text>

      {/* Property Name */}
      <FormField
        ref={(ref) => fieldRefs.registerInputRef('name', ref)}
        onLayoutContainer={fieldRefs.createLayoutHandler('name')}
        label="Property Name"
        value={form.values.name}
        onChangeText={(text) => form.updateField('name', text)}
        onBlur={() => form.setFieldTouched('name')}
        error={form.getFieldError('name')}
        placeholder="e.g., Beach House, Downtown Condo"
        required
        icon={Home}
        autoCapitalize="words"
      />

      {/* Address with Autofill */}
      <View onLayout={fieldRefs.createLayoutHandler('address')}>
        <AddressAutofill
          label="Street Address"
          value={form.values.address}
          onChange={(addr) => {
            if (typeof addr === 'object' && addr) {
              form.updateField('address', addr.formatted);
            } else {
              form.updateField('address', '');
            }
          }}
          onAddressSelected={(addr: AddressAutofillValue) => {
            // Auto-fill city, state, zip from verified address
            if (addr.city) form.updateField('city', addr.city);
            if (addr.state) form.updateField('state', addr.state);
            if (addr.zip) form.updateField('zip', addr.zip);
          }}
          placeholder="Start typing an address..."
          error={form.getFieldError('address')}
          required
          icon={MapPin}
        />
      </View>

      {/* City, State, ZIP in a row */}
      <View className="flex-row gap-2 mb-4">
        <View className="flex-1">
          <FormField
            ref={(ref) => fieldRefs.registerInputRef('city', ref)}
            onLayoutContainer={fieldRefs.createLayoutHandler('city')}
            label="City"
            value={form.values.city}
            onChangeText={(text) => form.updateField('city', text)}
            onBlur={() => form.setFieldTouched('city')}
            error={form.getFieldError('city')}
            placeholder="City"
            required
            autoCapitalize="words"
          />
        </View>
        <View style={{ width: 80 }}>
          <FormField
            ref={(ref) => fieldRefs.registerInputRef('state', ref)}
            onLayoutContainer={fieldRefs.createLayoutHandler('state')}
            label="State"
            value={form.values.state}
            onChangeText={(text) => form.updateField('state', text.toUpperCase())}
            onBlur={() => form.setFieldTouched('state')}
            error={form.getFieldError('state')}
            placeholder="ST"
            required
            maxLength={2}
            autoCapitalize="characters"
          />
        </View>
        <View style={{ width: 100 }}>
          <FormField
            ref={(ref) => fieldRefs.registerInputRef('zip', ref)}
            onLayoutContainer={fieldRefs.createLayoutHandler('zip')}
            label="ZIP"
            value={form.values.zip}
            onChangeText={(text) => form.updateField('zip', text)}
            onBlur={() => form.setFieldTouched('zip')}
            error={form.getFieldError('zip')}
            placeholder="12345"
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>
      </View>

      {/* Section: Property Details */}
      <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.foreground }}>
        Property Details
      </Text>

      {/* Property Type Picker */}
      {renderPicker(
        'Property Type',
        form.values.property_type,
        PROPERTY_TYPE_OPTIONS,
        'Select property type',
        showPropertyTypePicker,
        setShowPropertyTypePicker,
        (value) => form.updateField('property_type', value)
      )}

      {/* Bedrooms & Bathrooms */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            ref={(ref) => fieldRefs.registerInputRef('bedrooms', ref)}
            onLayoutContainer={fieldRefs.createLayoutHandler('bedrooms')}
            label="Bedrooms"
            value={String(form.values.bedrooms || '')}
            onChangeText={(text) => form.updateField('bedrooms', text)}
            onBlur={() => form.setFieldTouched('bedrooms')}
            error={form.getFieldError('bedrooms')}
            placeholder="0"
            keyboardType="number-pad"
            icon={Bed}
          />
        </View>
        <View className="flex-1">
          <FormField
            ref={(ref) => fieldRefs.registerInputRef('bathrooms', ref)}
            onLayoutContainer={fieldRefs.createLayoutHandler('bathrooms')}
            label="Bathrooms"
            value={String(form.values.bathrooms || '')}
            onChangeText={(text) => form.updateField('bathrooms', text)}
            onBlur={() => form.setFieldTouched('bathrooms')}
            error={form.getFieldError('bathrooms')}
            placeholder="0"
            keyboardType="decimal-pad"
            icon={Bath}
          />
        </View>
      </View>

      {/* Square Feet */}
      <FormField
        ref={(ref) => fieldRefs.registerInputRef('square_feet', ref)}
        onLayoutContainer={fieldRefs.createLayoutHandler('square_feet')}
        label="Square Feet"
        value={String(form.values.square_feet || '')}
        onChangeText={(text) => form.updateField('square_feet', text)}
        onBlur={() => form.setFieldTouched('square_feet')}
        error={form.getFieldError('square_feet')}
        placeholder="e.g., 1500"
        keyboardType="number-pad"
        icon={Maximize2}
      />

      {/* Section: Rental Settings */}
      <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.foreground }}>
        Rental Settings
      </Text>

      {/* Rental Type Picker */}
      {renderPicker(
        'Rental Type',
        form.values.rental_type,
        RENTAL_TYPE_OPTIONS,
        'Select rental type',
        showRentalTypePicker,
        setShowRentalTypePicker,
        (value) => form.updateField('rental_type', value)
      )}

      {/* Base Rate */}
      <FormField
        ref={(ref) => fieldRefs.registerInputRef('base_rate', ref)}
        onLayoutContainer={fieldRefs.createLayoutHandler('base_rate')}
        label="Base Rate"
        value={String(form.values.base_rate || '')}
        onChangeText={(text) => form.updateField('base_rate', text)}
        onBlur={() => form.setFieldTouched('base_rate')}
        error={form.getFieldError('base_rate')}
        placeholder="0.00"
        keyboardType="decimal-pad"
        icon={DollarSign}
        required
        prefix="$"
      />

      {/* Rate Type Picker */}
      {renderPicker(
        'Rate Type',
        form.values.rate_type,
        RATE_TYPE_OPTIONS,
        'Select rate type',
        showRateTypePicker,
        setShowRateTypePicker,
        (value) => form.updateField('rate_type', value)
      )}

      {/* Cleaning Fee & Security Deposit */}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            ref={(ref) => fieldRefs.registerInputRef('cleaning_fee', ref)}
            onLayoutContainer={fieldRefs.createLayoutHandler('cleaning_fee')}
            label="Cleaning Fee"
            value={String(form.values.cleaning_fee || '')}
            onChangeText={(text) => form.updateField('cleaning_fee', text)}
            onBlur={() => form.setFieldTouched('cleaning_fee')}
            error={form.getFieldError('cleaning_fee')}
            placeholder="0.00"
            keyboardType="decimal-pad"
            prefix="$"
          />
        </View>
        <View className="flex-1">
          <FormField
            ref={(ref) => fieldRefs.registerInputRef('security_deposit', ref)}
            onLayoutContainer={fieldRefs.createLayoutHandler('security_deposit')}
            label="Security Deposit"
            value={String(form.values.security_deposit || '')}
            onChangeText={(text) => form.updateField('security_deposit', text)}
            onBlur={() => form.setFieldTouched('security_deposit')}
            error={form.getFieldError('security_deposit')}
            placeholder="0.00"
            keyboardType="decimal-pad"
            prefix="$"
          />
        </View>
      </View>

      {/* Section: Amenities */}
      <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.foreground }}>
        Amenities
      </Text>
      <Text className="text-sm mb-3" style={{ color: colors.mutedForeground }}>
        Select all that apply
      </Text>

      <View className="flex-row flex-wrap gap-2 mb-4">
        {COMMON_AMENITIES.map((amenity) => {
          const isSelected = form.values.amenities?.includes(amenity);
          return (
            <TouchableOpacity
              key={amenity}
              className="px-3 py-2 rounded-full"
              style={{
                backgroundColor: isSelected
                  ? withOpacity(colors.primary, 'muted')
                  : colors.muted,
                borderWidth: 1,
                borderColor: isSelected ? colors.primary : colors.border,
              }}
              onPress={() => handleAmenityToggle(amenity)}
            >
              <Text
                className="text-sm"
                style={{
                  color: isSelected ? colors.primary : colors.foreground,
                  fontWeight: isSelected ? '500' : 'normal',
                }}
              >
                {amenity}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Section: Status */}
      <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.foreground }}>
        Status
      </Text>

      {renderPicker(
        'Property Status',
        form.values.status,
        STATUS_OPTIONS,
        'Select status',
        showStatusPicker,
        setShowStatusPicker,
        (value) => form.updateField('status', value)
      )}

      {/* Submit Button */}
      <TouchableOpacity
        className="rounded-lg py-4 items-center mt-4"
        style={{
          backgroundColor: isSubmitting
            ? withOpacity(colors.primary, 'opaque')
            : colors.primary,
        }}
        onPress={form.handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <Text className="font-semibold text-base" style={{ color: colors.primaryForeground }}>
            {submitLabel}
          </Text>
        )}
      </TouchableOpacity>

      {/* Bottom padding for keyboard */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

export default RentalPropertyForm;
