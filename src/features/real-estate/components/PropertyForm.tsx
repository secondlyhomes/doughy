/**
 * PropertyForm Component
 *
 * Form for creating and editing property information.
 * Refactored to use FormField + useForm (Phase 2 Migration)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ChevronDown, Save, X, MapPin, Home, DollarSign, FileText } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { FormField, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useForm } from '@/hooks/useForm';
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

  // Use the new useForm hook for state management and validation
  const { values, errors, updateField, handleSubmit, setValues } = useForm<FormData>({
    initialValues: initialFormData,
    validate: (vals) => {
      const errs: Partial<Record<keyof FormData, string>> = {};

      if (!vals.address.trim()) errs.address = 'Address is required';
      if (!vals.city.trim()) errs.city = 'City is required';
      if (!vals.state.trim()) errs.state = 'State is required';
      if (!vals.zip.trim()) errs.zip = 'ZIP code is required';

      // Validate numeric fields
      if (vals.bedrooms && isNaN(Number(vals.bedrooms))) {
        errs.bedrooms = 'Must be a number';
      }
      if (vals.bathrooms && isNaN(Number(vals.bathrooms))) {
        errs.bathrooms = 'Must be a number';
      }
      if (vals.square_feet && isNaN(Number(vals.square_feet))) {
        errs.square_feet = 'Must be a number';
      }
      if (vals.year_built) {
        const year = Number(vals.year_built);
        if (isNaN(year) || year < 1800 || year > new Date().getFullYear() + 5) {
          errs.year_built = 'Invalid year';
        }
      }

      return errs;
    },
    onSubmit: async (vals) => {
      const propertyData: Partial<Property> = {
        address: vals.address.trim(),
        address_line_2: vals.address_line_2.trim() || undefined,
        city: vals.city.trim(),
        state: vals.state.trim(),
        zip: vals.zip.trim(),
        county: vals.county.trim() || undefined,
        propertyType: vals.propertyType,
        bedrooms: vals.bedrooms ? Number(vals.bedrooms) : undefined,
        bathrooms: vals.bathrooms ? Number(vals.bathrooms) : undefined,
        square_feet: vals.square_feet ? Number(vals.square_feet) : undefined,
        lot_size: vals.lot_size ? Number(vals.lot_size) : undefined,
        year_built: vals.year_built ? Number(vals.year_built) : undefined,
        arv: vals.arv ? Number(vals.arv) : undefined,
        purchase_price: vals.purchase_price ? Number(vals.purchase_price) : undefined,
        notes: vals.notes.trim() || undefined,
      };

      await onSubmit(propertyData);
    },
  });

  const [showPropertyTypePicker, setShowPropertyTypePicker] = useState(false);

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      setValues({
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
  }, [initialData, setValues]);

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
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SAFE_PADDING }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Property Images */}
        <View className="mb-6">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Photos</Text>
          <PropertyImagePicker
            images={values.images}
            onChange={(images) => updateField('images', images)}
            maxImages={10}
            disabled={isLoading}
          />
        </View>

        {/* Address Section */}
        <Text className="text-lg font-semibold mb-3" style={{ color: colors.foreground }}>Address</Text>
        <FormField
          label="Street Address"
          value={values.address}
          onChangeText={(text) => updateField('address', text)}
          error={errors.address}
          placeholder="123 Main Street"
          required
          icon={MapPin}
          editable={!isLoading}
        />
        <FormField
          label="Unit/Apt"
          value={values.address_line_2}
          onChangeText={(text) => updateField('address_line_2', text)}
          placeholder="Apt 4B"
          helperText="Optional"
          editable={!isLoading}
        />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField
              label="City"
              value={values.city}
              onChangeText={(text) => updateField('city', text)}
              error={errors.city}
              placeholder="City"
              required
              editable={!isLoading}
            />
          </View>
          <View className="w-20">
            <FormField
              label="State"
              value={values.state}
              onChangeText={(text) => updateField('state', text)}
              error={errors.state}
              placeholder="CA"
              maxLength={2}
              required
              editable={!isLoading}
            />
          </View>
          <View className="w-24">
            <FormField
              label="ZIP"
              value={values.zip}
              onChangeText={(text) => updateField('zip', text)}
              error={errors.zip}
              placeholder="12345"
              keyboardType="numeric"
              required
              editable={!isLoading}
            />
          </View>
        </View>

        <FormField
          label="County"
          value={values.county}
          onChangeText={(text) => updateField('county', text)}
          placeholder="County"
          helperText="Optional"
          editable={!isLoading}
        />

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
              {getPropertyTypeLabel(values.propertyType)}
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
                      backgroundColor: values.propertyType === option.value ? colors.primary + '1A' : undefined,
                    }}
                  >
                    <Text
                      style={{
                        color: values.propertyType === option.value ? colors.primary : colors.foreground,
                        fontWeight: values.propertyType === option.value ? '500' : 'normal',
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
            <FormField
              label="Bedrooms"
              value={values.bedrooms}
              onChangeText={(text) => updateField('bedrooms', text)}
              error={errors.bedrooms}
              placeholder="3"
              keyboardType="numeric"
              icon={Home}
              editable={!isLoading}
            />
          </View>
          <View className="flex-1">
            <FormField
              label="Bathrooms"
              value={values.bathrooms}
              onChangeText={(text) => updateField('bathrooms', text)}
              error={errors.bathrooms}
              placeholder="2"
              keyboardType="decimal-pad"
              icon={Home}
              editable={!isLoading}
            />
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField
              label="Square Feet"
              value={values.square_feet}
              onChangeText={(text) => updateField('square_feet', text)}
              error={errors.square_feet}
              placeholder="1500"
              keyboardType="numeric"
              editable={!isLoading}
            />
          </View>
          <View className="flex-1">
            <FormField
              label="Lot Size (sqft)"
              value={values.lot_size}
              onChangeText={(text) => updateField('lot_size', text)}
              placeholder="5000"
              keyboardType="numeric"
              editable={!isLoading}
            />
          </View>
        </View>

        <FormField
          label="Year Built"
          value={values.year_built}
          onChangeText={(text) => updateField('year_built', text)}
          error={errors.year_built}
          placeholder="1990"
          keyboardType="numeric"
          editable={!isLoading}
        />

        {/* Financial Section */}
        <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.foreground }}>Financial</Text>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField
              label="Property Value (ARV)"
              value={values.arv}
              onChangeText={(text) => updateField('arv', text)}
              placeholder="350000"
              keyboardType="numeric"
              icon={DollarSign}
              editable={!isLoading}
            />
          </View>
          <View className="flex-1">
            <FormField
              label="Purchase Price"
              value={values.purchase_price}
              onChangeText={(text) => updateField('purchase_price', text)}
              placeholder="300000"
              keyboardType="numeric"
              icon={DollarSign}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Notes Section */}
        <Text className="text-lg font-semibold mb-3 mt-4" style={{ color: colors.foreground }}>Notes</Text>
        <FormField
          label="Notes"
          value={values.notes}
          onChangeText={(text) => updateField('notes', text)}
          placeholder="Add any additional notes about this property..."
          multiline
          numberOfLines={4}
          icon={FileText}
          editable={!isLoading}
        />
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
