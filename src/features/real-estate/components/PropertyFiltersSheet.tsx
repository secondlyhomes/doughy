// src/features/real-estate/components/PropertyFiltersSheet.tsx
// Bottom sheet for filtering properties

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { BottomSheet, BottomSheetSection } from '@/components/ui/BottomSheet';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { List, Grid, Check } from 'lucide-react-native';
import { PropertyStatus, PropertyType, PropertyConstants } from '../types';
import { PropertyFilters, DEFAULT_FILTERS, SortOption, SORT_OPTIONS } from '../hooks/usePropertyFilters';

interface PropertyFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: PropertyFilters;
  onApply: (filters: PropertyFilters) => void;
  onReset: () => void;
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
}

export function PropertyFiltersSheet({
  visible,
  onClose,
  filters,
  onApply,
  onReset,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
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
      title="Filters & View Options"
    >
      {/* View Mode */}
      <BottomSheetSection title="View Mode">
        <View className="flex-row rounded-xl" style={{ backgroundColor: colors.muted }}>
          <TouchableOpacity
            onPress={() => onViewModeChange('list')}
            className="flex-1 flex-row items-center justify-center px-4 py-3 rounded-xl"
            style={viewMode === 'list' ? { backgroundColor: colors.primary } : undefined}
          >
            <List size={18} color={viewMode === 'list' ? colors.primaryForeground : colors.mutedForeground} />
            <Text
              className="ml-2 font-medium"
              style={{ color: viewMode === 'list' ? colors.primaryForeground : colors.mutedForeground }}
            >
              List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onViewModeChange('grid')}
            className="flex-1 flex-row items-center justify-center px-4 py-3 rounded-xl"
            style={viewMode === 'grid' ? { backgroundColor: colors.primary } : undefined}
          >
            <Grid size={18} color={viewMode === 'grid' ? colors.primaryForeground : colors.mutedForeground} />
            <Text
              className="ml-2 font-medium"
              style={{ color: viewMode === 'grid' ? colors.primaryForeground : colors.mutedForeground }}
            >
              Grid
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetSection>

      {/* Sort By */}
      <BottomSheetSection title="Sort By">
        <View className="gap-2">
          {SORT_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              onPress={() => onSortChange(option.value)}
              className="flex-row items-center justify-between py-3 px-4 rounded-lg"
              style={{
                backgroundColor: sortBy === option.value ? withOpacity(colors.primary, 'muted') : colors.muted
              }}
            >
              <Text
                className="text-base"
                style={{
                  color: sortBy === option.value ? colors.primary : colors.foreground,
                  fontWeight: sortBy === option.value ? '600' : '400'
                }}
              >
                {option.label}
              </Text>
              {sortBy === option.value && (
                <Check size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetSection>

      {/* Status Filter */}
      <BottomSheetSection title="Status">
        <View className="flex-row flex-wrap gap-2">
          {PropertyConstants.STATUS_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              onPress={() => toggleStatus(option.value as PropertyStatus)}
              className="px-4 py-2 rounded-full border"
              style={{
                backgroundColor: localFilters.status.includes(option.value as PropertyStatus)
                  ? colors.primary
                  : colors.muted,
                borderColor: localFilters.status.includes(option.value as PropertyStatus)
                  ? colors.primary
                  : colors.border,
              }}
            >
              <Text
                className="text-sm font-medium"
                style={{
                  color: localFilters.status.includes(option.value as PropertyStatus)
                    ? colors.primaryForeground
                    : colors.foreground,
                }}
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
                className="px-4 py-2 rounded-full border"
                style={{
                  backgroundColor: localFilters.propertyType.includes(type)
                    ? colors.primary
                    : colors.muted,
                  borderColor: localFilters.propertyType.includes(type)
                    ? colors.primary
                    : colors.border,
                }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{
                    color: localFilters.propertyType.includes(type)
                      ? colors.primaryForeground
                      : colors.foreground,
                  }}
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
