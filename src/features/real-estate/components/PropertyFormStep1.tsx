// src/features/real-estate/components/PropertyFormStep1.tsx
// Step 1: Address & Property Type
// Uses useThemeColors() for reliable dark mode support

import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronDown, MapPin } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { PropertyConstants } from '../types';
import { AddressAutocomplete, AddressResult } from './AddressAutocomplete';

export interface Step1Data {
  address: string;
  address_line_2: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  propertyType: string;
  latitude?: number;
  longitude?: number;
}

interface PropertyFormStep1Props {
  data: Step1Data;
  onChange: (data: Partial<Step1Data>) => void;
  errors: Partial<Record<keyof Step1Data, string>>;
}

export function PropertyFormStep1({ data, onChange, errors }: PropertyFormStep1Props) {
  const colors = useThemeColors();
  const [showPropertyTypePicker, setShowPropertyTypePicker] = useState(false);
  const [useAutocomplete, setUseAutocomplete] = useState(true);

  const handleAddressSelect = useCallback((result: AddressResult) => {
    onChange({
      address: result.address,
      city: result.city,
      state: result.state,
      zip: result.zip,
      latitude: result.lat,
      longitude: result.lon,
    });
  }, [onChange]);

  const getPropertyTypeLabel = (type: string): string => {
    const option = PropertyConstants.TYPE_OPTIONS.find(opt => opt.value === type);
    return option?.label || type;
  };

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-4">
        {/* Address Section */}
        <View
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <View className="flex-row items-center mb-4">
            <MapPin size={20} color={colors.primary} />
            <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>Property Address</Text>
          </View>

          {/* Toggle for autocomplete */}
          <TouchableOpacity
            onPress={() => setUseAutocomplete(!useAutocomplete)}
            className="flex-row items-center mb-4"
          >
            <View
              className="w-5 h-5 rounded mr-2 items-center justify-center"
              style={{
                backgroundColor: useAutocomplete ? colors.primary : 'transparent',
                borderWidth: 2,
                borderColor: useAutocomplete ? colors.primary : colors.mutedForeground,
              }}
            >
              {useAutocomplete && <Text className="text-xs font-bold" style={{ color: colors.primaryForeground }}>✓</Text>}
            </View>
            <Text className="text-sm" style={{ color: colors.foreground }}>Use address autocomplete</Text>
          </TouchableOpacity>

          {useAutocomplete ? (
            <View className="mb-4">
              <AddressAutocomplete
                value={data.address || ''}
                onChange={(value) => onChange({ address: value })}
                onAddressSelected={handleAddressSelect}
                placeholder="Start typing an address..."
              />
              {data.address && (
                <View
                  className="mt-3 p-3 rounded-lg"
                  style={{ backgroundColor: colors.muted }}
                >
                  <Text className="text-sm font-medium" style={{ color: colors.foreground }}>{data.address}</Text>
                  <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                    {data.city}, {data.state} {data.zip}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <>
              {/* Manual Address Entry */}
              <View className="mb-3">
                <Text className="text-sm font-medium mb-1" style={{ color: colors.foreground }}>Street Address *</Text>
                <TextInput
                  value={data.address}
                  onChangeText={(value) => onChange({ address: value })}
                  placeholder="123 Main Street"
                  placeholderTextColor={colors.mutedForeground}
                  className="rounded-lg px-4 py-3"
                  style={{
                    backgroundColor: colors.muted,
                    color: colors.foreground,
                    borderWidth: errors.address ? 1 : 0,
                    borderColor: errors.address ? colors.destructive : undefined,
                  }}
                />
                {errors.address && (
                  <Text className="text-xs mt-1" style={{ color: colors.destructive }}>{errors.address}</Text>
                )}
              </View>

              <View className="mb-3">
                <Text className="text-sm font-medium mb-1" style={{ color: colors.foreground }}>Unit/Apt (optional)</Text>
                <TextInput
                  value={data.address_line_2}
                  onChangeText={(value) => onChange({ address_line_2: value })}
                  placeholder="Apt 4B"
                  placeholderTextColor={colors.mutedForeground}
                  className="rounded-lg px-4 py-3"
                  style={{ backgroundColor: colors.muted, color: colors.foreground }}
                />
              </View>

              <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                  <Text className="text-sm font-medium mb-1" style={{ color: colors.foreground }}>City *</Text>
                  <TextInput
                    value={data.city}
                    onChangeText={(value) => onChange({ city: value })}
                    placeholder="City"
                    placeholderTextColor={colors.mutedForeground}
                    className="rounded-lg px-4 py-3"
                    style={{
                      backgroundColor: colors.muted,
                      color: colors.foreground,
                      borderWidth: errors.city ? 1 : 0,
                      borderColor: errors.city ? colors.destructive : undefined,
                    }}
                  />
                  {errors.city && (
                    <Text className="text-xs mt-1" style={{ color: colors.destructive }}>{errors.city}</Text>
                  )}
                </View>
                <View className="w-20">
                  <Text className="text-sm font-medium mb-1" style={{ color: colors.foreground }}>State *</Text>
                  <TextInput
                    value={data.state}
                    onChangeText={(value) => onChange({ state: value.toUpperCase() })}
                    placeholder="CA"
                    placeholderTextColor={colors.mutedForeground}
                    maxLength={2}
                    autoCapitalize="characters"
                    className="rounded-lg px-4 py-3"
                    style={{
                      backgroundColor: colors.muted,
                      color: colors.foreground,
                      borderWidth: errors.state ? 1 : 0,
                      borderColor: errors.state ? colors.destructive : undefined,
                    }}
                  />
                  {errors.state && (
                    <Text className="text-xs mt-1" style={{ color: colors.destructive }}>{errors.state}</Text>
                  )}
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="w-28">
                  <Text className="text-sm font-medium mb-1" style={{ color: colors.foreground }}>ZIP *</Text>
                  <TextInput
                    value={data.zip}
                    onChangeText={(value) => onChange({ zip: value })}
                    placeholder="12345"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numeric"
                    maxLength={10}
                    className="rounded-lg px-4 py-3"
                    style={{
                      backgroundColor: colors.muted,
                      color: colors.foreground,
                      borderWidth: errors.zip ? 1 : 0,
                      borderColor: errors.zip ? colors.destructive : undefined,
                    }}
                  />
                  {errors.zip && (
                    <Text className="text-xs mt-1" style={{ color: colors.destructive }}>{errors.zip}</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium mb-1" style={{ color: colors.foreground }}>County</Text>
                  <TextInput
                    value={data.county}
                    onChangeText={(value) => onChange({ county: value })}
                    placeholder="County (optional)"
                    placeholderTextColor={colors.mutedForeground}
                    className="rounded-lg px-4 py-3"
                    style={{ backgroundColor: colors.muted, color: colors.foreground }}
                  />
                </View>
              </View>
            </>
          )}
        </View>

        {/* Property Type Section */}
        <View
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <Text className="text-lg font-semibold mb-4" style={{ color: colors.foreground }}>Property Type</Text>

          <TouchableOpacity
            onPress={() => setShowPropertyTypePicker(!showPropertyTypePicker)}
            className="rounded-lg px-4 py-3 flex-row justify-between items-center"
            style={{ backgroundColor: colors.muted }}
          >
            <Text style={{ color: colors.foreground }}>{getPropertyTypeLabel(data.propertyType)}</Text>
            <ChevronDown size={20} color={colors.mutedForeground} />
          </TouchableOpacity>

          {showPropertyTypePicker && (
            <View
              className="rounded-lg mt-2 max-h-60"
              style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
            >
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {PropertyConstants.TYPE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      onChange({ propertyType: option.value });
                      setShowPropertyTypePicker(false);
                    }}
                    className="px-4 py-3"
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      backgroundColor: data.propertyType === option.value ? `${colors.primary}15` : undefined,
                    }}
                  >
                    <Text
                      style={{
                        color: data.propertyType === option.value ? colors.primary : colors.foreground,
                        fontWeight: data.propertyType === option.value ? '500' : '400',
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
      </View>
    </ScrollView>
  );
}
