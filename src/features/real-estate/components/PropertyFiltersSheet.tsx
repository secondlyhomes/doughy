// src/features/real-estate/components/PropertyFiltersSheet.tsx
// Bottom sheet for filtering properties

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { BottomSheet, BottomSheetSection } from '@/components/ui/BottomSheet';
import { useThemeColors } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { PropertyStatus, PropertyType, PropertyConstants } from '../types';
import { PropertyFilters, DEFAULT_FILTERS } from '../hooks/usePropertyFilters';

interface PropertyFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: PropertyFilters;
  onApply: (filters: PropertyFilters) => void;
  onReset: () => void;
}

export function PropertyFiltersSheet({
  visible,
  onClose,
  filters,
  onApply,
  onReset,
}: PropertyFiltersSheetProps) {
  const colors = useThemeColors();
  // Local state for editing filters before applying
  const [localFilters, setLocalFilters] = useState<PropertyFilters>(filters);

  // Sync local filters when prop changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const toggleStatus = useCallback((status: PropertyStatus) => {
    setLocalFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status],
    }));
  }, []);

  const togglePropertyType = useCallback((type: PropertyType) => {
    setLocalFilters(prev => ({
      ...prev,
      propertyType: prev.propertyType.includes(type)
        ? prev.propertyType.filter(t => t !== type)
        : [...prev.propertyType, type],
    }));
  }, []);

  const handleApply = useCallback(() => {
    onApply(localFilters);
    onClose();
  }, [localFilters, onApply, onClose]);

  const handleReset = useCallback(() => {
    setLocalFilters(DEFAULT_FILTERS);
    onReset();
  }, [onReset]);

  const handleClose = useCallback(() => {
    setLocalFilters(filters);
    onClose();
  }, [filters, onClose]);

  // Common property types to show (most used)
  const commonPropertyTypes = [
    PropertyType.SINGLE_FAMILY,
    PropertyType.MULTI_FAMILY,
    PropertyType.CONDO,
    PropertyType.TOWNHOUSE,
    PropertyType.DUPLEX,
    PropertyType.LAND,
  ];

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title="Filters"
    >
      {/* Status Filter */}
      <BottomSheetSection title="Status">
        <View className="flex-row flex-wrap gap-2">
          {PropertyConstants.STATUS_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              onPress={() => toggleStatus(option.value as PropertyStatus)}
              className={`px-4 py-2 rounded-full border ${
                localFilters.status.includes(option.value as PropertyStatus)
                  ? 'bg-primary border-primary'
                  : 'bg-muted border-border'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  localFilters.status.includes(option.value as PropertyStatus)
                    ? 'text-primary-foreground'
                    : 'text-foreground'
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetSection>

      {/* Property Type Filter */}
      <BottomSheetSection title="Property Type">
        <View className="flex-row flex-wrap gap-2">
          {commonPropertyTypes.map(type => {
            const option = PropertyConstants.TYPE_OPTIONS.find(o => o.value === type);
            if (!option) return null;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => togglePropertyType(type)}
                className={`px-4 py-2 rounded-full border ${
                  localFilters.propertyType.includes(type)
                    ? 'bg-primary border-primary'
                    : 'bg-muted border-border'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    localFilters.propertyType.includes(type)
                      ? 'text-primary-foreground'
                      : 'text-foreground'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetSection>

      {/* Price Range */}
      <BottomSheetSection title="Purchase Price">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="text-xs text-muted-foreground mb-1">Min</Text>
            <TextInput
              value={localFilters.priceMin?.toString() || ''}
              onChangeText={text => {
                const value = text ? parseInt(text.replace(/[^0-9]/g, ''), 10) : null;
                setLocalFilters(prev => ({ ...prev, priceMin: value }));
              }}
              placeholder="$0"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              className="bg-muted rounded-lg px-4 py-3 text-foreground"
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted-foreground mb-1">Max</Text>
            <TextInput
              value={localFilters.priceMax?.toString() || ''}
              onChangeText={text => {
                const value = text ? parseInt(text.replace(/[^0-9]/g, ''), 10) : null;
                setLocalFilters(prev => ({ ...prev, priceMax: value }));
              }}
              placeholder="No max"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              className="bg-muted rounded-lg px-4 py-3 text-foreground"
            />
          </View>
        </View>
      </BottomSheetSection>

      {/* ARV Range */}
      <BottomSheetSection title="ARV (After Repair Value)">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="text-xs text-muted-foreground mb-1">Min</Text>
            <TextInput
              value={localFilters.arvMin?.toString() || ''}
              onChangeText={text => {
                const value = text ? parseInt(text.replace(/[^0-9]/g, ''), 10) : null;
                setLocalFilters(prev => ({ ...prev, arvMin: value }));
              }}
              placeholder="$0"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              className="bg-muted rounded-lg px-4 py-3 text-foreground"
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted-foreground mb-1">Max</Text>
            <TextInput
              value={localFilters.arvMax?.toString() || ''}
              onChangeText={text => {
                const value = text ? parseInt(text.replace(/[^0-9]/g, ''), 10) : null;
                setLocalFilters(prev => ({ ...prev, arvMax: value }));
              }}
              placeholder="No max"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              className="bg-muted rounded-lg px-4 py-3 text-foreground"
            />
          </View>
        </View>
      </BottomSheetSection>

      {/* Bedrooms */}
      <BottomSheetSection title="Bedrooms">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="text-xs text-muted-foreground mb-1">Min</Text>
            <TextInput
              value={localFilters.bedroomsMin?.toString() || ''}
              onChangeText={text => {
                const value = text ? parseInt(text.replace(/[^0-9]/g, ''), 10) : null;
                setLocalFilters(prev => ({ ...prev, bedroomsMin: value }));
              }}
              placeholder="Any"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              className="bg-muted rounded-lg px-4 py-3 text-foreground"
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted-foreground mb-1">Max</Text>
            <TextInput
              value={localFilters.bedroomsMax?.toString() || ''}
              onChangeText={text => {
                const value = text ? parseInt(text.replace(/[^0-9]/g, ''), 10) : null;
                setLocalFilters(prev => ({ ...prev, bedroomsMax: value }));
              }}
              placeholder="Any"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              className="bg-muted rounded-lg px-4 py-3 text-foreground"
            />
          </View>
        </View>
      </BottomSheetSection>

      {/* Location */}
      <BottomSheetSection title="Location">
        <View className="gap-3">
          <View>
            <Text className="text-xs text-muted-foreground mb-1">City</Text>
            <TextInput
              value={localFilters.city}
              onChangeText={text => setLocalFilters(prev => ({ ...prev, city: text }))}
              placeholder="Any city"
              placeholderTextColor={colors.mutedForeground}
              className="bg-muted rounded-lg px-4 py-3 text-foreground"
            />
          </View>
          <View>
            <Text className="text-xs text-muted-foreground mb-1">State</Text>
            <TextInput
              value={localFilters.state}
              onChangeText={text => setLocalFilters(prev => ({ ...prev, state: text }))}
              placeholder="Any state"
              placeholderTextColor={colors.mutedForeground}
              maxLength={2}
              autoCapitalize="characters"
              className="bg-muted rounded-lg px-4 py-3 text-foreground"
            />
          </View>
        </View>
      </BottomSheetSection>

      {/* Action Buttons */}
      <View className="flex-row gap-3 pt-4 pb-6">
        <Button
          variant="outline"
          onPress={handleReset}
          className="flex-1"
        >
          Reset
        </Button>
        <Button
          onPress={handleApply}
          className="flex-1"
        >
          Apply Filters
        </Button>
      </View>
    </BottomSheet>
  );
}
