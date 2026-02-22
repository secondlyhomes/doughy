// src/features/real-estate/components/AddCompSheet.tsx
// Bottom sheet for adding a new comparable property
// Refactored to use FormField + useForm (Phase 2 Migration)

import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, MapPin, Home, DollarSign, Info } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { BottomSheet, FormField } from '@/components/ui';
import { useForm } from '@/hooks/useForm';
import { PropertyComp } from '../types';

interface AddCompSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<PropertyComp>) => Promise<void>;
  isLoading?: boolean;
  editComp?: PropertyComp | null;
}

interface FormData {
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: string;
  bathrooms: string;
  square_feet: string;
  year_built: string;
  sold_price: string;
  sold_date: string;
  distance: string;
}

const initialFormData: FormData = {
  address: '',
  city: '',
  state: '',
  zip: '',
  bedrooms: '',
  bathrooms: '',
  square_feet: '',
  year_built: '',
  sold_price: '',
  sold_date: '',
  distance: '',
};

const buildFormDataFromComp = (comp: PropertyComp | null | undefined): FormData => {
  if (!comp) return initialFormData;
  return {
    address: comp.address || '',
    city: comp.city || '',
    state: comp.state || '',
    zip: comp.zip || '',
    bedrooms: comp.bedrooms?.toString() || '',
    bathrooms: comp.bathrooms?.toString() || '',
    square_feet: (comp.square_feet || comp.sqft)?.toString() || '',
    year_built: (comp.year_built || comp.yearBuilt)?.toString() || '',
    sold_price: (comp.sold_price || comp.salePrice)?.toString() || '',
    sold_date: comp.sold_date || comp.saleDate || '',
    distance: comp.distance?.toString() || '',
  };
};

export function AddCompSheet({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
  editComp,
}: AddCompSheetProps) {
  const colors = useThemeColors();

  // Use the new useForm hook for state management and validation
  const { values, errors, updateField, handleSubmit, reset, setValues } = useForm({
    initialValues: buildFormDataFromComp(editComp),
    validate: (vals) => {
      const errs: Record<string, string> = {};

      if (!vals.address.trim()) errs.address = 'Address is required';
      if (!vals.city.trim()) errs.city = 'City is required';
      if (!vals.state.trim()) errs.state = 'State is required';
      if (!vals.sold_price.trim()) {
        errs.sold_price = 'Sale price is required';
      } else if (isNaN(Number(vals.sold_price))) {
        errs.sold_price = 'Invalid price';
      }

      return errs;
    },
    onSubmit: async (vals) => {
      const compData: Partial<PropertyComp> = {
        address: vals.address.trim(),
        city: vals.city.trim(),
        state: vals.state.trim(),
        zip: vals.zip.trim(),
        bedrooms: vals.bedrooms ? Number(vals.bedrooms) : undefined,
        bathrooms: vals.bathrooms ? Number(vals.bathrooms) : undefined,
        square_feet: vals.square_feet ? Number(vals.square_feet) : undefined,
        year_built: vals.year_built ? Number(vals.year_built) : undefined,
        sold_price: Number(vals.sold_price),
        sold_date: vals.sold_date || undefined,
        distance: vals.distance ? Number(vals.distance) : undefined,
      };

      await onSubmit(compData);
      reset();
    },
  });

  // Reset form when editComp changes
  useEffect(() => {
    setValues(buildFormDataFromComp(editComp));
  }, [editComp, setValues]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      snapPoints={['90%']}
    >
      {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border }}>
          <View>
            <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
              {editComp ? 'Edit Comparable' : 'Add Comparable'}
            </Text>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              Enter property details
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            className="p-2 rounded-full"
            style={{ backgroundColor: colors.muted }}
          >
            <X size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Address Section */}
          <View className="flex-row items-center mb-3 mt-2">
            <MapPin size={18} color={colors.primary} />
            <Text className="text-sm font-medium ml-2 uppercase tracking-wide" style={{ color: colors.mutedForeground }}>Address</Text>
          </View>

          <FormField
            label="Street Address"
            value={values.address}
            onChangeText={(text) => updateField('address', text)}
            error={errors.address}
            placeholder="123 Main St"
            required
            icon={MapPin}
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
              />
            </View>
            <View className="w-20">
              <FormField
                label="State"
                value={values.state}
                onChangeText={(text) => updateField('state', text)}
                error={errors.state}
                placeholder="CA"
                required
              />
            </View>
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <FormField
                label="ZIP"
                value={values.zip}
                onChangeText={(text) => updateField('zip', text)}
                placeholder="90210"
              />
            </View>
            <View className="flex-1">
              <FormField
                label="Distance (mi)"
                value={values.distance}
                onChangeText={(text) => updateField('distance', text)}
                placeholder="0.5"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Sale Info Section */}
          <View className="flex-row items-center mb-3">
            <DollarSign size={18} color={colors.primary} />
            <Text className="text-sm font-medium ml-2 uppercase tracking-wide" style={{ color: colors.mutedForeground }}>Sale Information</Text>
          </View>

          <FormField
            label="Sale Price"
            value={values.sold_price}
            onChangeText={(text) => updateField('sold_price', text)}
            error={errors.sold_price}
            placeholder="350000"
            keyboardType="numeric"
            prefix="$"
            icon={DollarSign}
            required
          />

          <View className="mb-4">
            <FormField
              label="Sale Date"
              value={values.sold_date}
              onChangeText={(text) => updateField('sold_date', text)}
              placeholder="YYYY-MM-DD"
            />
          </View>

          {/* Property Details Section */}
          <View className="flex-row items-center mb-3">
            <Home size={18} color={colors.primary} />
            <Text className="text-sm font-medium ml-2 uppercase tracking-wide" style={{ color: colors.mutedForeground }}>Property Details</Text>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <FormField
                label="Bedrooms"
                value={values.bedrooms}
                onChangeText={(text) => updateField('bedrooms', text)}
                placeholder="3"
                keyboardType="numeric"
                icon={Home}
              />
            </View>
            <View className="flex-1">
              <FormField
                label="Bathrooms"
                value={values.bathrooms}
                onChangeText={(text) => updateField('bathrooms', text)}
                placeholder="2"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <FormField
                label="Square Feet"
                value={values.square_feet}
                onChangeText={(text) => updateField('square_feet', text)}
                placeholder="1500"
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <FormField
                label="Year Built"
                value={values.year_built}
                onChangeText={(text) => updateField('year_built', text)}
                placeholder="1990"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Info Note */}
          <View className="flex-row rounded-xl p-3 border mb-6" style={{ backgroundColor: withOpacity(colors.primary, 'subtle'), borderColor: withOpacity(colors.primary, 'muted') }}>
            <Info size={16} color={colors.primary} className="mt-0.5" />
            <Text className="text-xs ml-2 flex-1" style={{ color: colors.foreground }}>
              Add recently sold properties similar to your subject property.
              The more comparable properties you add, the more accurate your ARV estimate will be.
            </Text>
          </View>

          <View className="h-4" />
        </ScrollView>

      {/* Submit Button */}
      <View className="p-4 border-t" style={{ borderColor: colors.border }}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          className="py-3.5 rounded-xl flex-row items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text className="font-semibold" style={{ color: colors.primaryForeground }}>
              {editComp ? 'Save Changes' : 'Add Comparable'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}
