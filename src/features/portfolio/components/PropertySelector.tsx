// src/features/portfolio/components/PropertySelector.tsx
// Dropdown component for selecting properties to add to portfolio

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  useColorScheme,
} from 'react-native';
import { ChevronDown, Check, Search, Home, MapPin } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/context/ThemeContext';
import { getBackdropColor } from '@/lib/design-utils';
import type { AvailableProperty } from '../hooks/useAvailableProperties';

interface PropertySelectorProps {
  value?: string;
  onValueChange: (propertyId: string) => void;
  properties: AvailableProperty[];
  isLoading?: boolean;
  placeholder?: string;
  error?: string;
  label?: string;
  disabled?: boolean;
}

export function PropertySelector({
  value,
  onValueChange,
  properties,
  isLoading = false,
  placeholder = 'Select a property',
  error,
  label,
  disabled = false,
}: PropertySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const colors = useThemeColors();
  const colorScheme = useColorScheme();

  // Find selected property
  const selectedProperty = useMemo(() => {
    return properties.find(p => p.id === value);
  }, [properties, value]);

  // Filter properties by search query
  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return properties;

    const query = searchQuery.toLowerCase();
    return properties.filter(p => {
      const fullAddress = `${p.address} ${p.city} ${p.state} ${p.zip}`.toLowerCase();
      return fullAddress.includes(query);
    });
  }, [properties, searchQuery]);

  const handleSelect = useCallback((property: AvailableProperty) => {
    onValueChange(property.id);
    setIsOpen(false);
    setSearchQuery('');
  }, [onValueChange]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  // Format display text
  const getDisplayText = () => {
    if (isLoading) return 'Loading properties...';
    if (selectedProperty) {
      return `${selectedProperty.address}, ${selectedProperty.city}`;
    }
    return placeholder;
  };

  // Format price for display
  const formatPrice = (price?: number) => {
    if (!price) return null;
    return `$${price.toLocaleString()}`;
  };

  // Memoized keyExtractor
  const keyExtractor = useCallback((item: AvailableProperty) => item.id, []);

  // Memoized renderItem to prevent unnecessary re-renders
  const renderPropertyItem = useCallback(({ item }: { item: AvailableProperty }) => (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3"
      style={{
        backgroundColor: item.id === value ? `${colors.primary}15` : 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
      onPress={() => handleSelect(item)}
    >
      <View className="mr-3 h-5 w-5 items-center justify-center">
        {item.id === value && (
          <Check size={18} color={colors.primary} />
        )}
      </View>
      <View className="flex-1">
        <Text
          className="text-sm"
          style={{
            color: item.id === value ? colors.primary : colors.foreground,
            fontWeight: item.id === value ? '500' : 'normal',
          }}
          numberOfLines={1}
        >
          {item.address}
        </Text>
        <Text
          className="text-xs mt-0.5"
          style={{ color: colors.mutedForeground }}
        >
          {item.city}, {item.state} {item.zip}
          {item.purchase_price && ` - ${formatPrice(item.purchase_price)}`}
        </Text>
      </View>
    </TouchableOpacity>
  ), [value, colors, handleSelect, formatPrice]);

  return (
    <View className="w-full">
      {label && (
        <Text className="mb-1.5 text-sm font-medium" style={{ color: colors.foreground }}>
          {label}
        </Text>
      )}

      {/* Trigger */}
      <TouchableOpacity
        className={cn(
          'h-12 w-full flex-row items-center justify-between rounded-md px-3',
          disabled && 'opacity-50'
        )}
        style={{
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: error ? colors.destructive : colors.input,
        }}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
      >
        <View className="flex-1 flex-row items-center gap-2">
          <Home size={18} color={colors.mutedForeground} />
          <Text
            className="text-sm flex-1"
            style={{ color: selectedProperty ? colors.foreground : colors.mutedForeground }}
            numberOfLines={1}
          >
            {getDisplayText()}
          </Text>
        </View>
        <ChevronDown size={16} color={colors.mutedForeground} />
      </TouchableOpacity>

      {/* Selected property preview */}
      {selectedProperty && (
        <View
          className="mt-2 p-3 rounded-lg"
          style={{ backgroundColor: `${colors.primary}10`, borderWidth: 1, borderColor: `${colors.primary}30` }}
        >
          <View className="flex-row items-start gap-2">
            <MapPin size={16} color={colors.primary} style={{ marginTop: 2 }} />
            <View className="flex-1">
              <Text className="text-sm font-medium" style={{ color: colors.foreground }}>
                {selectedProperty.address}
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: colors.mutedForeground }}>
                {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip}
              </Text>
              {selectedProperty.purchase_price && (
                <Text className="text-xs mt-1" style={{ color: colors.primary }}>
                  Listed at {formatPrice(selectedProperty.purchase_price)}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {error && (
        <Text className="mt-1 text-sm" style={{ color: colors.destructive }}>{error}</Text>
      )}

      {/* Options Modal */}
      <Modal
        visible={isOpen}
        onRequestClose={handleClose}
        transparent
        animationType="slide"
      >
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: getBackdropColor(colorScheme === 'dark') }}
        >
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={handleClose}
          />

          <View
            className="rounded-t-2xl max-h-[70%]"
            style={{ backgroundColor: colors.card }}
          >
            {/* Header */}
            <View
              className="flex-row items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: colors.border }}
            >
              <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
                Select Property
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Text className="text-base" style={{ color: colors.primary }}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View className="px-4 py-3" style={{ borderBottomWidth: 1, borderColor: colors.border }}>
              <View
                className="flex-row items-center px-3 rounded-lg"
                style={{ backgroundColor: colors.background, height: 40 }}
              >
                <Search size={18} color={colors.mutedForeground} />
                <TextInput
                  className="flex-1 ml-2 text-sm"
                  style={{ color: colors.foreground }}
                  placeholder="Search by address..."
                  placeholderTextColor={colors.mutedForeground}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* List */}
            {filteredProperties.length === 0 ? (
              <View className="py-12 items-center">
                <Home size={32} color={colors.mutedForeground} />
                <Text className="text-sm mt-2" style={{ color: colors.mutedForeground }}>
                  {searchQuery ? 'No properties match your search' : 'No properties available'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredProperties}
                keyExtractor={keyExtractor}
                renderItem={renderPropertyItem}
                style={{ maxHeight: 400 }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
