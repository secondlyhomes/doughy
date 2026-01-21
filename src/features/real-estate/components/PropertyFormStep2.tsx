// src/features/real-estate/components/PropertyFormStep2.tsx
// Step 2: Property Details (beds, baths, sqft, etc.)
// Uses useThemeColors() for reliable dark mode support

import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Bed, Bath, Square, Ruler, Calendar } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';

export interface Step2Data {
  bedrooms: string;
  bathrooms: string;
  square_feet: string;
  lot_size: string;
  year_built: string;
}

interface PropertyFormStep2Props {
  data: Step2Data;
  onChange: (data: Partial<Step2Data>) => void;
  errors: Partial<Record<keyof Step2Data, string>>;
}

export function PropertyFormStep2({ data, onChange, errors }: PropertyFormStep2Props) {
  const colors = useThemeColors();

  // Note: This component is rendered inside PropertyFormWizard's ScrollView
  // so we use View instead of ScrollView to avoid nested scrolling issues
  return (
    <View className="flex-1">
      <View className="gap-4">
        {/* Bedrooms & Bathrooms */}
        <View
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <Text className="text-lg font-semibold mb-4" style={{ color: colors.foreground }}>Rooms</Text>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <Bed size={18} color={colors.primary} />
                <Text className="text-sm font-medium ml-2" style={{ color: colors.foreground }}>Bedrooms</Text>
              </View>
              <TextInput
                value={data.bedrooms}
                onChangeText={(value) => onChange({ bedrooms: value.replace(/[^0-9]/g, '') })}
                placeholder="3"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                className="rounded-lg px-4 py-3 text-center text-lg"
                style={{
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderWidth: errors.bedrooms ? 1 : 0,
                  borderColor: errors.bedrooms ? colors.destructive : undefined,
                }}
              />
              {errors.bedrooms && (
                <Text className="text-xs mt-1 text-center" style={{ color: colors.destructive }}>{errors.bedrooms}</Text>
              )}
            </View>

            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <Bath size={18} color={colors.primary} />
                <Text className="text-sm font-medium ml-2" style={{ color: colors.foreground }}>Bathrooms</Text>
              </View>
              <TextInput
                value={data.bathrooms}
                onChangeText={(value) => onChange({ bathrooms: value.replace(/[^0-9.]/g, '') })}
                placeholder="2"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
                className="rounded-lg px-4 py-3 text-center text-lg"
                style={{
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderWidth: errors.bathrooms ? 1 : 0,
                  borderColor: errors.bathrooms ? colors.destructive : undefined,
                }}
              />
              {errors.bathrooms && (
                <Text className="text-xs mt-1 text-center" style={{ color: colors.destructive }}>{errors.bathrooms}</Text>
              )}
            </View>
          </View>

          {/* Quick select buttons */}
          <View className="mt-4">
            <Text className="text-xs mb-2" style={{ color: colors.mutedForeground }}>Quick select bedrooms:</Text>
            <View className="flex-row gap-2">
              {['1', '2', '3', '4', '5', '6+'].map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => onChange({ bedrooms: num.replace('+', '') })}
                  className="flex-1 py-2 rounded-lg items-center"
                  style={{
                    backgroundColor: data.bedrooms === num.replace('+', '') ? colors.primary : colors.muted,
                  }}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{
                      color: data.bedrooms === num.replace('+', '') ? colors.primaryForeground : colors.foreground,
                    }}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Size */}
        <View
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <Text className="text-lg font-semibold mb-4" style={{ color: colors.foreground }}>Size</Text>

          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <Square size={18} color={colors.primary} />
                <Text className="text-sm font-medium ml-2" style={{ color: colors.foreground }}>Square Feet</Text>
              </View>
              <TextInput
                value={data.square_feet}
                onChangeText={(value) => onChange({ square_feet: value.replace(/[^0-9]/g, '') })}
                placeholder="1,500"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                className="rounded-lg px-4 py-3"
                style={{
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderWidth: errors.square_feet ? 1 : 0,
                  borderColor: errors.square_feet ? colors.destructive : undefined,
                }}
              />
              {errors.square_feet && (
                <Text className="text-xs mt-1" style={{ color: colors.destructive }}>{errors.square_feet}</Text>
              )}
            </View>

            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <Ruler size={18} color={colors.primary} />
                <Text className="text-sm font-medium ml-2" style={{ color: colors.foreground }}>Lot Size (sqft)</Text>
              </View>
              <TextInput
                value={data.lot_size}
                onChangeText={(value) => onChange({ lot_size: value.replace(/[^0-9]/g, '') })}
                placeholder="5,000"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                className="rounded-lg px-4 py-3"
                style={{
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderWidth: errors.lot_size ? 1 : 0,
                  borderColor: errors.lot_size ? colors.destructive : undefined,
                }}
              />
              {errors.lot_size && (
                <Text className="text-xs mt-1" style={{ color: colors.destructive }}>{errors.lot_size}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Year Built */}
        <View
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <View className="flex-row items-center mb-4">
            <Calendar size={18} color={colors.primary} />
            <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>Year Built</Text>
          </View>

          <TextInput
            value={data.year_built}
            onChangeText={(value) => onChange({ year_built: value.replace(/[^0-9]/g, '') })}
            placeholder="1990"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            maxLength={4}
            className="rounded-lg px-4 py-3"
            style={{
              backgroundColor: colors.muted,
              color: colors.foreground,
              borderWidth: errors.year_built ? 1 : 0,
              borderColor: errors.year_built ? colors.destructive : undefined,
            }}
          />
          {errors.year_built && (
            <Text className="text-xs mt-1" style={{ color: colors.destructive }}>{errors.year_built}</Text>
          )}

          {/* Decade quick select */}
          <View className="mt-4">
            <Text className="text-xs mb-2" style={{ color: colors.mutedForeground }}>Quick select decade:</Text>
            <View className="flex-row flex-wrap gap-2">
              {['1970s', '1980s', '1990s', '2000s', '2010s', '2020s'].map((decade) => {
                const year = decade.replace('s', '');
                const isSelected = data.year_built?.startsWith(year.substring(0, 3));
                return (
                  <TouchableOpacity
                    key={decade}
                    onPress={() => onChange({ year_built: year })}
                    className="px-3 py-1.5 rounded-full"
                    style={{
                      backgroundColor: isSelected ? colors.primary : colors.background,
                      borderWidth: isSelected ? 0 : 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text
                      className="text-sm"
                      style={{
                        color: isSelected ? colors.primaryForeground : colors.foreground,
                        fontWeight: isSelected ? '500' : '400',
                      }}
                    >
                      {decade}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Info note */}
        <View className="rounded-xl p-4" style={{ backgroundColor: colors.muted }}>
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>
            All fields are optional but help with accurate property analysis and valuation.
          </Text>
        </View>
      </View>
    </View>
  );
}
