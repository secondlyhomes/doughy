// src/features/real-estate/components/AddCompSheet.tsx
// Bottom sheet for adding a new comparable property

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, MapPin, Home, DollarSign, Calendar, Info } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { BottomSheet } from '@/components/ui/BottomSheet';
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
  const [formData, setFormData] = useState<FormData>(() => buildFormDataFromComp(editComp));

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form data when editComp changes
  useEffect(() => {
    setFormData(buildFormDataFromComp(editComp));
    setErrors({});
  }, [editComp]);

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    setErrors(prev => {
      if (prev[field]) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return prev;
    });
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.sold_price.trim()) {
      newErrors.sold_price = 'Sale price is required';
    } else if (isNaN(Number(formData.sold_price))) {
      newErrors.sold_price = 'Invalid price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    const compData: Partial<PropertyComp> = {
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      zip: formData.zip.trim(),
      bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
      square_feet: formData.square_feet ? Number(formData.square_feet) : undefined,
      year_built: formData.year_built ? Number(formData.year_built) : undefined,
      sold_price: Number(formData.sold_price),
      sold_date: formData.sold_date || undefined,
      distance: formData.distance ? Number(formData.distance) : undefined,
    };

    await onSubmit(compData);
    setFormData(initialFormData);
  }, [formData, validate, onSubmit]);

  const handleClose = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
    onClose();
  }, [onClose]);

  const renderInput = (
    label: string,
    field: keyof FormData,
    options: {
      placeholder?: string;
      keyboardType?: 'default' | 'numeric' | 'decimal-pad';
      prefix?: string;
    } = {}
  ) => (
    <View className="mb-4">
      <Text className="text-sm font-medium text-foreground mb-1.5">{label}</Text>
      <View className="flex-row items-center bg-muted rounded-lg px-3">
        {options.prefix && (
          <Text className="text-muted-foreground mr-1">{options.prefix}</Text>
        )}
        <TextInput
          value={formData[field]}
          onChangeText={(value) => updateField(field, value)}
          placeholder={options.placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={options.keyboardType || 'default'}
          className="flex-1 py-3 text-foreground"
        />
      </View>
      {errors[field] && (
        <Text className="text-xs text-destructive mt-1">{errors[field]}</Text>
      )}
    </View>
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      snapPoints={['90%']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <View>
            <Text className="text-lg font-semibold text-foreground">
              {editComp ? 'Edit Comparable' : 'Add Comparable'}
            </Text>
            <Text className="text-xs text-muted-foreground">
              Enter property details
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            className="p-2 bg-muted rounded-full"
          >
            <X size={20} className="text-foreground" />
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Address Section */}
          <View className="bg-card rounded-xl p-4 border border-border mb-4">
            <View className="flex-row items-center mb-4">
              <MapPin size={18} className="text-primary" />
              <Text className="text-base font-semibold text-foreground ml-2">Address</Text>
            </View>

            {renderInput('Street Address *', 'address', { placeholder: '123 Main St' })}

            <View className="flex-row gap-3">
              <View className="flex-1">
                {renderInput('City *', 'city', { placeholder: 'City' })}
              </View>
              <View className="w-20">
                {renderInput('State *', 'state', { placeholder: 'CA' })}
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                {renderInput('ZIP', 'zip', { placeholder: '90210' })}
              </View>
              <View className="flex-1">
                {renderInput('Distance (mi)', 'distance', {
                  placeholder: '0.5',
                  keyboardType: 'decimal-pad',
                })}
              </View>
            </View>
          </View>

          {/* Sale Info Section */}
          <View className="bg-card rounded-xl p-4 border border-border mb-4">
            <View className="flex-row items-center mb-4">
              <DollarSign size={18} className="text-primary" />
              <Text className="text-base font-semibold text-foreground ml-2">Sale Information</Text>
            </View>

            {renderInput('Sale Price *', 'sold_price', {
              placeholder: '350000',
              keyboardType: 'numeric',
              prefix: '$',
            })}

            {renderInput('Sale Date', 'sold_date', {
              placeholder: 'YYYY-MM-DD',
            })}
          </View>

          {/* Property Details Section */}
          <View className="bg-card rounded-xl p-4 border border-border mb-4">
            <View className="flex-row items-center mb-4">
              <Home size={18} className="text-primary" />
              <Text className="text-base font-semibold text-foreground ml-2">Property Details</Text>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                {renderInput('Bedrooms', 'bedrooms', {
                  placeholder: '3',
                  keyboardType: 'numeric',
                })}
              </View>
              <View className="flex-1">
                {renderInput('Bathrooms', 'bathrooms', {
                  placeholder: '2',
                  keyboardType: 'decimal-pad',
                })}
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                {renderInput('Square Feet', 'square_feet', {
                  placeholder: '1500',
                  keyboardType: 'numeric',
                })}
              </View>
              <View className="flex-1">
                {renderInput('Year Built', 'year_built', {
                  placeholder: '1990',
                  keyboardType: 'numeric',
                })}
              </View>
            </View>
          </View>

          {/* Info Note */}
          <View className="flex-row bg-primary/5 rounded-xl p-3 border border-primary/10 mb-6">
            <Info size={16} className="text-primary mt-0.5" />
            <Text className="text-xs text-foreground ml-2 flex-1">
              Add recently sold properties similar to your subject property.
              The more comparable properties you add, the more accurate your ARV estimate will be.
            </Text>
          </View>

          <View className="h-4" />
        </ScrollView>

        {/* Submit Button */}
        <View className="p-4 border-t border-border">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className="bg-primary py-3.5 rounded-xl flex-row items-center justify-center"
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text className="text-primary-foreground font-semibold">
                {editComp ? 'Save Changes' : 'Add Comparable'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}
