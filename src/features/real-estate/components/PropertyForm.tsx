/**
 * PropertyForm Component
 *
 * Form for creating and editing property information.
 * Uses controlled inputs with React Native components.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ChevronDown, Save, X } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Property, PropertyType, PropertyConstants } from '../types';
import { PropertyImagePicker } from './PropertyImagePicker';

interface PropertyFormProps {
  initialData?: Partial<Property>;
  onSubmit: (data: Partial<Property>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

interface FormData {
  address: string;
  address_line_2: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  square_feet: string;
  lot_size: string;
  year_built: string;
  arv: string;
  purchase_price: string;
  notes: string;
  images: string[];
}

const initialFormData: FormData = {
  address: '',
  address_line_2: '',
  city: '',
  state: '',
  zip: '',
  county: '',
  propertyType: 'single_family',
  bedrooms: '',
  bathrooms: '',
  square_feet: '',
  lot_size: '',
  year_built: '',
  arv: '',
  purchase_price: '',
  notes: '',
  images: [],
};

export function PropertyForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Save Property',
}: PropertyFormProps) {
  const colors = useThemeColors();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showPropertyTypePicker, setShowPropertyTypePicker] = useState(false);

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      setFormData({
        address: initialData.address || initialData.address_line_1 || '',
        address_line_2: initialData.address_line_2 || '',
        city: initialData.city || '',
        state: initialData.state || '',
        zip: initialData.zip || '',
        county: initialData.county || '',
        propertyType: initialData.propertyType || initialData.property_type || 'single_family',
        bedrooms: initialData.bedrooms?.toString() || '',
        bathrooms: initialData.bathrooms?.toString() || '',
        square_feet: (initialData.square_feet || initialData.sqft)?.toString() || '',
        lot_size: (initialData.lot_size || initialData.lotSize)?.toString() || '',
        year_built: (initialData.year_built || initialData.yearBuilt)?.toString() || '',
        arv: initialData.arv?.toString() || '',
        purchase_price: initialData.purchase_price?.toString() || '',
        notes: initialData.notes || '',
        images: initialData.images?.map(img => img.url) || [],
      });
    }
  }, [initialData]);

  const updateField = useCallback((field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.zip.trim()) {
      newErrors.zip = 'ZIP code is required';
    }

    // Validate numeric fields
    if (formData.bedrooms && isNaN(Number(formData.bedrooms))) {
      newErrors.bedrooms = 'Must be a number';
    }
    if (formData.bathrooms && isNaN(Number(formData.bathrooms))) {
      newErrors.bathrooms = 'Must be a number';
    }
    if (formData.square_feet && isNaN(Number(formData.square_feet))) {
      newErrors.square_feet = 'Must be a number';
    }
    if (formData.year_built) {
      const year = Number(formData.year_built);
      if (isNaN(year) || year < 1800 || year > new Date().getFullYear() + 5) {
        newErrors.year_built = 'Invalid year';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting.');
      return;
    }

    const propertyData: Partial<Property> = {
      address: formData.address.trim(),
      address_line_2: formData.address_line_2.trim() || undefined,
      city: formData.city.trim(),
      state: formData.state.trim(),
      zip: formData.zip.trim(),
      county: formData.county.trim() || undefined,
      propertyType: formData.propertyType,
      bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
      square_feet: formData.square_feet ? Number(formData.square_feet) : undefined,
      lot_size: formData.lot_size ? Number(formData.lot_size) : undefined,
      year_built: formData.year_built ? Number(formData.year_built) : undefined,
      arv: formData.arv ? Number(formData.arv) : undefined,
      purchase_price: formData.purchase_price ? Number(formData.purchase_price) : undefined,
      notes: formData.notes.trim() || undefined,
    };

    await onSubmit(propertyData);
  }, [formData, validateForm, onSubmit]);

  const renderInput = (
    label: string,
    field: keyof FormData,
    options: {
      placeholder?: string;
      keyboardType?: 'default' | 'numeric' | 'decimal-pad';
      multiline?: boolean;
      numberOfLines?: number;
      maxLength?: number;
    } = {}
  ) => (
    <View className="mb-4">
      <Text className="text-sm font-medium mb-1" style={{ color: colors.foreground }}>{label}</Text>
      <TextInput
        value={formData[field] as string}
        onChangeText={(value) => updateField(field, value)}
        placeholder={options.placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={options.keyboardType || 'default'}
        multiline={options.multiline}
        numberOfLines={options.numberOfLines}
        maxLength={options.maxLength}
        className={`rounded-lg px-4 py-3 ${
          options.multiline ? 'min-h-[100]' : ''
        } ${errors[field] ? 'border' : ''}`}
        style={{
          backgroundColor: colors.muted,
          color: colors.foreground,
          ...(errors[field] ? { borderColor: colors.destructive, borderWidth: 1 } : {}),
        }}
        editable={!isLoading}
      />
      {errors[field] && (
        <Text className="text-xs mt-1" style={{ color: colors.destructive }}>{errors[field]}</Text>
      )}
    </View>
  );

  const getPropertyTypeLabel = (type: string): string => {
    const option = PropertyConstants.TYPE_OPTIONS.find(opt => opt.value === type);
    return option?.label || type;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Property Images */}
        <View className="mb-6">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Photos</Text>
          <PropertyImagePicker
            images={formData.images}
            onChange={(images) => updateField('images', images)}
            maxImages={10}
            disabled={isLoading}
          />
        </View>

        {/* Address Section */}
        <Text className="text-lg font-semibold mb-3" style={{ color: colors.foreground }}>Address</Text>
        {renderInput('Street Address *', 'address', { placeholder: '123 Main Street' })}
        {renderInput('Unit/Apt (optional)', 'address_line_2', { placeholder: 'Apt 4B' })}

        <View className="flex-row gap-3">
          <View className="flex-1">
            {renderInput('City *', 'city', { placeholder: 'City' })}
          </View>
          <View className="w-20">
            {renderInput('State *', 'state', { placeholder: 'CA', maxLength: 2 })}
          </View>
          <View className="w-24">
            {renderInput('ZIP *', 'zip', { placeholder: '12345', keyboardType: 'numeric' })}
          </View>
        </View>

        {renderInput('County (optional)', 'county', { placeholder: 'County' })}

        {/* Property Details Section */}
        <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.foreground }}>Property Details</Text>

        {/* Property Type Picker */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-1" style={{ color: colors.foreground }}>Property Type</Text>
          <TouchableOpacity
            onPress={() => setShowPropertyTypePicker(!showPropertyTypePicker)}
            className="rounded-lg px-4 py-3 flex-row justify-between items-center"
            style={{ backgroundColor: colors.muted }}
            disabled={isLoading}
          >
            <Text style={{ color: colors.foreground }}>
              {getPropertyTypeLabel(formData.propertyType)}
            </Text>
            <ChevronDown size={20} color={colors.mutedForeground} />
          </TouchableOpacity>

          {showPropertyTypePicker && (
            <View className="rounded-lg mt-2 max-h-60 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <ScrollView nestedScrollEnabled>
                {PropertyConstants.TYPE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      updateField('propertyType', option.value);
                      setShowPropertyTypePicker(false);
                    }}
                    className="px-4 py-3 border-b"
                    style={{
                      borderColor: colors.border,
                      backgroundColor: formData.propertyType === option.value ? colors.primary + '1A' : undefined,
                    }}
                  >
                    <Text
                      style={{
                        color: formData.propertyType === option.value ? colors.primary : colors.foreground,
                        fontWeight: formData.propertyType === option.value ? '500' : 'normal',
                      }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            {renderInput('Bedrooms', 'bedrooms', { keyboardType: 'numeric', placeholder: '3' })}
          </View>
          <View className="flex-1">
            {renderInput('Bathrooms', 'bathrooms', { keyboardType: 'decimal-pad', placeholder: '2' })}
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            {renderInput('Square Feet', 'square_feet', { keyboardType: 'numeric', placeholder: '1500' })}
          </View>
          <View className="flex-1">
            {renderInput('Lot Size (sqft)', 'lot_size', { keyboardType: 'numeric', placeholder: '5000' })}
          </View>
        </View>

        {renderInput('Year Built', 'year_built', { keyboardType: 'numeric', placeholder: '1990' })}

        {/* Financial Section */}
        <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.foreground }}>Financial</Text>

        <View className="flex-row gap-3">
          <View className="flex-1">
            {renderInput('Property Value (ARV)', 'arv', { keyboardType: 'numeric', placeholder: '350000' })}
          </View>
          <View className="flex-1">
            {renderInput('Purchase Price', 'purchase_price', { keyboardType: 'numeric', placeholder: '300000' })}
          </View>
        </View>

        {/* Notes Section */}
        <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.foreground }}>Notes</Text>
        {renderInput('Notes', 'notes', {
          multiline: true,
          numberOfLines: 4,
          placeholder: 'Add any additional notes about this property...',
        })}
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View className="flex-row gap-3 p-4 border-t" style={{ backgroundColor: colors.background, borderColor: colors.border }}>
        <TouchableOpacity
          onPress={onCancel}
          disabled={isLoading}
          className="flex-1 py-3 rounded-xl flex-row items-center justify-center"
          style={{ backgroundColor: colors.muted }}
        >
          <X size={20} color={colors.foreground} />
          <Text className="font-semibold ml-2" style={{ color: colors.foreground }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          className="flex-1 py-3 rounded-xl flex-row items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Save size={20} color={colors.primaryForeground} />
              <Text className="font-semibold ml-2" style={{ color: colors.primaryForeground }}>{submitLabel}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
