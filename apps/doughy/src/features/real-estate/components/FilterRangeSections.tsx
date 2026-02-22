// src/features/real-estate/components/FilterRangeSections.tsx
// Price, ARV, Bedrooms, and Location filter sections for PropertyFiltersSheet

import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { BottomSheetSection } from '@/components/ui/BottomSheet';
import { useThemeColors } from '@/contexts/ThemeContext';
import { PropertyFilters } from '../hooks/usePropertyFilters';

interface FilterRangeSectionsProps {
  localFilters: PropertyFilters;
  setLocalFilters: React.Dispatch<React.SetStateAction<PropertyFilters>>;
}

export function FilterRangeSections({ localFilters, setLocalFilters }: FilterRangeSectionsProps) {
  const colors = useThemeColors();

  return (
    <>
      {/* Price Range */}
      <BottomSheetSection title="Purchase Price">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="text-xs mb-1" style={{ color: colors.mutedForeground }}>Min</Text>
            <TextInput
              value={localFilters.priceMin?.toString() || ''}
              onChangeText={text => {
                const value = text ? parseInt(text.replace(/[^0-9]/g, ''), 10) : null;
                setLocalFilters(prev => ({ ...prev, priceMin: value }));
              }}
              placeholder="$0"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              className="rounded-lg px-4 py-3"
              style={{ backgroundColor: colors.muted, color: colors.foreground }}
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs mb-1" style={{ color: colors.mutedForeground }}>Max</Text>
            <TextInput
              value={localFilters.priceMax?.toString() || ''}
              onChangeText={text => {
                const value = text ? parseInt(text.replace(/[^0-9]/g, ''), 10) : null;
                setLocalFilters(prev => ({ ...prev, priceMax: value }));
              }}
              placeholder="No max"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              className="rounded-lg px-4 py-3"
              style={{ backgroundColor: colors.muted, color: colors.foreground }}
            />
          </View>
        </View>
      </BottomSheetSection>

      {/* ARV Range */}
      <BottomSheetSection title="ARV (After Repair Value)">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="text-xs mb-1" style={{ color: colors.mutedForeground }}>Min</Text>
            <TextInput
              value={localFilters.arvMin?.toString() || ''}
              onChangeText={text => {
                const value = text ? parseInt(text.replace(/[^0-9]/g, ''), 10) : null;
                setLocalFilters(prev => ({ ...prev, arvMin: value }));
              }}
              placeholder="$0"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              className="rounded-lg px-4 py-3"
              style={{ backgroundColor: colors.muted, color: colors.foreground }}
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs mb-1" style={{ color: colors.mutedForeground }}>Max</Text>
            <TextInput
              value={localFilters.arvMax?.toString() || ''}
              onChangeText={text => {
                const value = text ? parseInt(text.replace(/[^0-9]/g, ''), 10) : null;
                setLocalFilters(prev => ({ ...prev, arvMax: value }));
              }}
              placeholder="No max"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              className="rounded-lg px-4 py-3"
              style={{ backgroundColor: colors.muted, color: colors.foreground }}
            />
          </View>
        </View>
      </BottomSheetSection>

      {/* Bedrooms */}
      <BottomSheetSection title="Bedrooms">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="text-xs mb-1" style={{ color: colors.mutedForeground }}>Min</Text>
            <TextInput
              value={localFilters.bedroomsMin?.toString() || ''}
              onChangeText={text => {
                const value = text ? parseInt(text.replace(/[^0-9]/g, ''), 10) : null;
                setLocalFilters(prev => ({ ...prev, bedroomsMin: value }));
              }}
              placeholder="Any"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              className="rounded-lg px-4 py-3"
              style={{ backgroundColor: colors.muted, color: colors.foreground }}
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs mb-1" style={{ color: colors.mutedForeground }}>Max</Text>
            <TextInput
              value={localFilters.bedroomsMax?.toString() || ''}
              onChangeText={text => {
                const value = text ? parseInt(text.replace(/[^0-9]/g, ''), 10) : null;
                setLocalFilters(prev => ({ ...prev, bedroomsMax: value }));
              }}
              placeholder="Any"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              className="rounded-lg px-4 py-3"
              style={{ backgroundColor: colors.muted, color: colors.foreground }}
            />
          </View>
        </View>
      </BottomSheetSection>

      {/* Location */}
      <BottomSheetSection title="Location">
        <View className="gap-3">
          <View>
            <Text className="text-xs mb-1" style={{ color: colors.mutedForeground }}>City</Text>
            <TextInput
              value={localFilters.city}
              onChangeText={text => setLocalFilters(prev => ({ ...prev, city: text }))}
              placeholder="Any city"
              placeholderTextColor={colors.mutedForeground}
              className="rounded-lg px-4 py-3"
              style={{ backgroundColor: colors.muted, color: colors.foreground }}
            />
          </View>
          <View>
            <Text className="text-xs mb-1" style={{ color: colors.mutedForeground }}>State</Text>
            <TextInput
              value={localFilters.state}
              onChangeText={text => setLocalFilters(prev => ({ ...prev, state: text }))}
              placeholder="Any state"
              placeholderTextColor={colors.mutedForeground}
              maxLength={2}
              autoCapitalize="characters"
              className="rounded-lg px-4 py-3"
              style={{ backgroundColor: colors.muted, color: colors.foreground }}
            />
          </View>
        </View>
      </BottomSheetSection>
    </>
  );
}
