// src/features/real-estate/components/PropertyFormStep2.tsx
// Step 2: Property Details (beds, baths, sqft, etc.)

import React from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
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
  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-4">
        {/* Bedrooms & Bathrooms */}
        <View className="bg-card rounded-xl p-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">Rooms</Text>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <Bed size={18} className="text-primary" />
                <Text className="text-sm font-medium text-foreground ml-2">Bedrooms</Text>
              </View>
              <TextInput
                value={data.bedrooms}
                onChangeText={(value) => onChange({ bedrooms: value.replace(/[^0-9]/g, '') })}
                placeholder="3"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                className={`bg-muted rounded-lg px-4 py-3 text-foreground text-center text-lg ${
                  errors.bedrooms ? 'border border-destructive' : ''
                }`}
              />
              {errors.bedrooms && (
                <Text className="text-xs text-destructive mt-1 text-center">{errors.bedrooms}</Text>
              )}
            </View>

            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <Bath size={18} className="text-primary" />
                <Text className="text-sm font-medium text-foreground ml-2">Bathrooms</Text>
              </View>
              <TextInput
                value={data.bathrooms}
                onChangeText={(value) => onChange({ bathrooms: value.replace(/[^0-9.]/g, '') })}
                placeholder="2"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
                className={`bg-muted rounded-lg px-4 py-3 text-foreground text-center text-lg ${
                  errors.bathrooms ? 'border border-destructive' : ''
                }`}
              />
              {errors.bathrooms && (
                <Text className="text-xs text-destructive mt-1 text-center">{errors.bathrooms}</Text>
              )}
            </View>
          </View>

          {/* Quick select buttons */}
          <View className="mt-4">
            <Text className="text-xs text-muted-foreground mb-2">Quick select bedrooms:</Text>
            <View className="flex-row gap-2">
              {['1', '2', '3', '4', '5', '6+'].map((num) => (
                <TouchableOpacityBed
                  key={num}
                  value={num}
                  selected={data.bedrooms === num.replace('+', '')}
                  onPress={() => onChange({ bedrooms: num.replace('+', '') })}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Size */}
        <View className="bg-card rounded-xl p-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">Size</Text>

          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <Square size={18} className="text-primary" />
                <Text className="text-sm font-medium text-foreground ml-2">Square Feet</Text>
              </View>
              <TextInput
                value={data.square_feet}
                onChangeText={(value) => onChange({ square_feet: value.replace(/[^0-9]/g, '') })}
                placeholder="1,500"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                className={`bg-muted rounded-lg px-4 py-3 text-foreground ${
                  errors.square_feet ? 'border border-destructive' : ''
                }`}
              />
              {errors.square_feet && (
                <Text className="text-xs text-destructive mt-1">{errors.square_feet}</Text>
              )}
            </View>

            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <Ruler size={18} className="text-primary" />
                <Text className="text-sm font-medium text-foreground ml-2">Lot Size (sqft)</Text>
              </View>
              <TextInput
                value={data.lot_size}
                onChangeText={(value) => onChange({ lot_size: value.replace(/[^0-9]/g, '') })}
                placeholder="5,000"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                className={`bg-muted rounded-lg px-4 py-3 text-foreground ${
                  errors.lot_size ? 'border border-destructive' : ''
                }`}
              />
              {errors.lot_size && (
                <Text className="text-xs text-destructive mt-1">{errors.lot_size}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Year Built */}
        <View className="bg-card rounded-xl p-4 border border-border">
          <View className="flex-row items-center mb-4">
            <Calendar size={18} className="text-primary" />
            <Text className="text-lg font-semibold text-foreground ml-2">Year Built</Text>
          </View>

          <TextInput
            value={data.year_built}
            onChangeText={(value) => onChange({ year_built: value.replace(/[^0-9]/g, '') })}
            placeholder="1990"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            maxLength={4}
            className={`bg-muted rounded-lg px-4 py-3 text-foreground ${
              errors.year_built ? 'border border-destructive' : ''
            }`}
          />
          {errors.year_built && (
            <Text className="text-xs text-destructive mt-1">{errors.year_built}</Text>
          )}

          {/* Decade quick select */}
          <View className="mt-4">
            <Text className="text-xs text-muted-foreground mb-2">Quick select decade:</Text>
            <View className="flex-row flex-wrap gap-2">
              {['1970s', '1980s', '1990s', '2000s', '2010s', '2020s'].map((decade) => {
                const year = decade.replace('s', '');
                return (
                  <TouchableOpacityChip
                    key={decade}
                    label={decade}
                    selected={data.year_built?.startsWith(year.substring(0, 3))}
                    onPress={() => onChange({ year_built: year })}
                  />
                );
              })}
            </View>
          </View>
        </View>

        {/* Info note */}
        <View className="bg-muted rounded-xl p-4">
          <Text className="text-sm text-muted-foreground">
            All fields are optional but help with accurate property analysis and valuation.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// Quick select button component
import { TouchableOpacity } from 'react-native';

function TouchableOpacityBed({
  value,
  selected,
  onPress,
}: {
  value: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-1 py-2 rounded-lg items-center ${
        selected ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          selected ? 'text-primary-foreground' : 'text-foreground'
        }`}
      >
        {value}
      </Text>
    </TouchableOpacity>
  );
}

function TouchableOpacityChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-3 py-1.5 rounded-full ${
        selected ? 'bg-primary' : 'bg-background border border-border'
      }`}
    >
      <Text
        className={`text-sm ${
          selected ? 'text-primary-foreground font-medium' : 'text-foreground'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
