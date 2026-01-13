// src/features/real-estate/components/PropertyFormStep1.tsx
// Step 1: Address & Property Type

import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronDown, MapPin } from 'lucide-react-native';
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
        <View className="bg-card rounded-xl p-4 border border-border">
          <View className="flex-row items-center mb-4">
            <MapPin size={20} className="text-primary" />
            <Text className="text-lg font-semibold text-foreground ml-2">Property Address</Text>
          </View>

          {/* Toggle for autocomplete */}
          <TouchableOpacity
            onPress={() => setUseAutocomplete(!useAutocomplete)}
            className="flex-row items-center mb-4"
          >
            <View className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${
              useAutocomplete ? 'bg-primary border-primary' : 'border-muted-foreground'
            }`}>
              {useAutocomplete && <Text className="text-white text-xs font-bold">✓</Text>}
            </View>
            <Text className="text-sm text-foreground">Use address autocomplete</Text>
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
                <View className="mt-3 p-3 bg-muted rounded-lg">
                  <Text className="text-sm text-foreground font-medium">{data.address}</Text>
                  <Text className="text-sm text-muted-foreground">
                    {data.city}, {data.state} {data.zip}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <>
              {/* Manual Address Entry */}
              <View className="mb-3">
                <Text className="text-sm font-medium text-foreground mb-1">Street Address *</Text>
                <TextInput
                  value={data.address}
                  onChangeText={(value) => onChange({ address: value })}
                  placeholder="123 Main Street"
                  placeholderTextColor="#9CA3AF"
                  className={`bg-muted rounded-lg px-4 py-3 text-foreground ${
                    errors.address ? 'border border-destructive' : ''
                  }`}
                />
                {errors.address && (
                  <Text className="text-xs text-destructive mt-1">{errors.address}</Text>
                )}
              </View>

              <View className="mb-3">
                <Text className="text-sm font-medium text-foreground mb-1">Unit/Apt (optional)</Text>
                <TextInput
                  value={data.address_line_2}
                  onChangeText={(value) => onChange({ address_line_2: value })}
                  placeholder="Apt 4B"
                  placeholderTextColor="#9CA3AF"
                  className="bg-muted rounded-lg px-4 py-3 text-foreground"
                />
              </View>

              <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground mb-1">City *</Text>
                  <TextInput
                    value={data.city}
                    onChangeText={(value) => onChange({ city: value })}
                    placeholder="City"
                    placeholderTextColor="#9CA3AF"
                    className={`bg-muted rounded-lg px-4 py-3 text-foreground ${
                      errors.city ? 'border border-destructive' : ''
                    }`}
                  />
                  {errors.city && (
                    <Text className="text-xs text-destructive mt-1">{errors.city}</Text>
                  )}
                </View>
                <View className="w-20">
                  <Text className="text-sm font-medium text-foreground mb-1">State *</Text>
                  <TextInput
                    value={data.state}
                    onChangeText={(value) => onChange({ state: value.toUpperCase() })}
                    placeholder="CA"
                    placeholderTextColor="#9CA3AF"
                    maxLength={2}
                    autoCapitalize="characters"
                    className={`bg-muted rounded-lg px-4 py-3 text-foreground ${
                      errors.state ? 'border border-destructive' : ''
                    }`}
                  />
                  {errors.state && (
                    <Text className="text-xs text-destructive mt-1">{errors.state}</Text>
                  )}
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="w-28">
                  <Text className="text-sm font-medium text-foreground mb-1">ZIP *</Text>
                  <TextInput
                    value={data.zip}
                    onChangeText={(value) => onChange({ zip: value })}
                    placeholder="12345"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    maxLength={10}
                    className={`bg-muted rounded-lg px-4 py-3 text-foreground ${
                      errors.zip ? 'border border-destructive' : ''
                    }`}
                  />
                  {errors.zip && (
                    <Text className="text-xs text-destructive mt-1">{errors.zip}</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground mb-1">County</Text>
                  <TextInput
                    value={data.county}
                    onChangeText={(value) => onChange({ county: value })}
                    placeholder="County (optional)"
                    placeholderTextColor="#9CA3AF"
                    className="bg-muted rounded-lg px-4 py-3 text-foreground"
                  />
                </View>
              </View>
            </>
          )}
        </View>

        {/* Property Type Section */}
        <View className="bg-card rounded-xl p-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">Property Type</Text>

          <TouchableOpacity
            onPress={() => setShowPropertyTypePicker(!showPropertyTypePicker)}
            className="bg-muted rounded-lg px-4 py-3 flex-row justify-between items-center"
          >
            <Text className="text-foreground">{getPropertyTypeLabel(data.propertyType)}</Text>
            <ChevronDown size={20} className="text-muted-foreground" />
          </TouchableOpacity>

          {showPropertyTypePicker && (
            <View className="bg-background border border-border rounded-lg mt-2 max-h-60">
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {PropertyConstants.TYPE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      onChange({ propertyType: option.value });
                      setShowPropertyTypePicker(false);
                    }}
                    className={`px-4 py-3 border-b border-border ${
                      data.propertyType === option.value ? 'bg-primary/10' : ''
                    }`}
                  >
                    <Text
                      className={`${
                        data.propertyType === option.value
                          ? 'text-primary font-medium'
                          : 'text-foreground'
                      }`}
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
