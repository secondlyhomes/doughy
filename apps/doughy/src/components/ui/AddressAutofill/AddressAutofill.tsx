// src/components/ui/AddressAutofill/AddressAutofill.tsx
// Unified address autofill component with database + OSM suggestions

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { MapPin, X, ChevronDown, Info } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import {
  ICON_SIZES,
  PRESS_OPACITY,
  FONT_SIZES,
  SPACING,
} from '@/constants/design-tokens';
import { useAddressAutofill } from './hooks/useAddressAutofill';
import { AddressSuggestionItem } from './AddressSuggestionItem';
import type { AddressAutofillProps, AddressValue, AddressSuggestion } from './types';

/**
 * Unified address autofill component.
 *
 * Features:
 * - Combines verified database addresses with OpenStreetMap geocoding
 * - Pick suggestion → verified address with lat/lng, visible to workspace
 * - Ignore suggestions → custom address, private to creator
 * - Seamless UX without warnings
 *
 * @example
 * ```tsx
 * <AddressAutofill
 *   label="Street Address"
 *   value={address}
 *   onChange={setAddress}
 *   onAddressSelected={(addr) => {
 *     if (addr.city) setCity(addr.city);
 *     if (addr.state) setState(addr.state);
 *     if (addr.zip) setZip(addr.zip);
 *   }}
 *   required
 * />
 * ```
 */
export function AddressAutofill({
  value,
  onChange,
  onAddressSelected,
  label,
  placeholder = 'Enter address',
  error,
  disabled = false,
  required = false,
  showInfoIcon = false,
  icon: Icon = MapPin,
  className,
  ...props
}: AddressAutofillProps) {
  const colors = useThemeColors();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Get display value
  const displayValue = typeof value === 'string' ? value : value?.formatted || '';

  // Hook for autofill functionality
  const {
    searchText,
    setSearchText,
    suggestions,
    isLoading,
    isOpen,
    setIsOpen,
    handleSelectSuggestion,
    handleManualEntry,
    reset,
  } = useAddressAutofill();

  // Sync external value to search text when not focused
  useEffect(() => {
    if (!isFocused && displayValue) {
      setSearchText(displayValue);
    }
  }, [displayValue, isFocused, setSearchText]);

  // Handle text input change
  const handleTextChange = useCallback(
    (text: string) => {
      setSearchText(text);
      // Update parent with partial value
      if (onChange) {
        if (typeof value === 'string' || !value) {
          onChange({ formatted: text, isVerified: false, isPublic: false, source: 'manual' });
        } else {
          onChange({ ...value, formatted: text });
        }
      }
    },
    [setSearchText, onChange, value]
  );

  // Handle suggestion selection
  const handleSelect = useCallback(
    async (suggestion: AddressSuggestion) => {
      try {
        const address = await handleSelectSuggestion(suggestion);
        onChange?.(address);
        onAddressSelected?.(address);
        setSearchText(address.formatted);
        Keyboard.dismiss();
      } catch (err) {
        console.error('Error selecting address:', err);
      }
    },
    [handleSelectSuggestion, onChange, onAddressSelected, setSearchText]
  );

  // Handle blur - submit manual entry if no suggestion selected
  const handleBlur = useCallback(async () => {
    setIsFocused(false);

    // Delay to allow suggestion tap to register
    setTimeout(async () => {
      if (isOpen) {
        setIsOpen(false);
      }

      // If user typed something but didn't select a suggestion
      if (searchText && searchText !== displayValue) {
        try {
          const address = await handleManualEntry(searchText);
          onChange?.(address);
        } catch (err) {
          // Keep the text as-is if save fails
          console.warn('Failed to save manual address:', err);
        }
      }
    }, 200);
  }, [searchText, displayValue, isOpen, setIsOpen, handleManualEntry, onChange]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  }, [suggestions.length, setIsOpen]);

  // Clear input
  const handleClear = useCallback(() => {
    reset();
    onChange?.(undefined);
    inputRef.current?.focus();
  }, [reset, onChange]);

  // Get status indicator text
  const getStatusText = () => {
    if (typeof value !== 'object' || !value) return null;
    if (value.isVerified) {
      return { text: 'Verified address', color: colors.success || '#22c55e' };
    }
    if (!value.isPublic) {
      return { text: 'Custom address', color: colors.mutedForeground };
    }
    return null;
  };

  const statusInfo = getStatusText();

  return (
    <View className={cn('w-full mb-4', className)} {...props}>
      {/* Label */}
      {label && (
        <View className="flex-row items-center mb-1.5 gap-1">
          <Text
            className="text-sm font-medium"
            style={{ color: colors.foreground }}
          >
            {label}
            {required && (
              <Text style={{ color: colors.destructive }}> *</Text>
            )}
          </Text>
          {showInfoIcon && (
            <TouchableOpacity activeOpacity={PRESS_OPACITY.DEFAULT}>
              <Info size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Input container */}
      <View className="relative">
        {/* Input field */}
        <View
          className="flex-row items-center rounded-lg px-3"
          style={{
            backgroundColor: colors.muted,
            borderWidth: 1,
            borderColor: error
              ? colors.destructive
              : isFocused
              ? colors.primary
              : colors.border,
            minHeight: 44,
          }}
        >
          <Icon size={ICON_SIZES.md} color={colors.mutedForeground} />

          <TextInput
            ref={inputRef}
            value={searchText}
            onChangeText={handleTextChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor={colors.mutedForeground}
            editable={!disabled}
            autoCapitalize="words"
            autoCorrect={false}
            className="flex-1 px-2 py-2.5"
            style={{
              color: colors.foreground,
              fontSize: FONT_SIZES.base,
            }}
          />

          {/* Loading indicator */}
          {isLoading && (
            <ActivityIndicator
              size="small"
              color={colors.mutedForeground}
              style={{ marginRight: SPACING.sm }}
            />
          )}

          {/* Dropdown toggle / Clear button */}
          {searchText && !isLoading ? (
            <TouchableOpacity
              onPress={handleClear}
              activeOpacity={PRESS_OPACITY.DEFAULT}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={ICON_SIZES.sm} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : suggestions.length > 0 ? (
            <TouchableOpacity
              onPress={() => setIsOpen(!isOpen)}
              activeOpacity={PRESS_OPACITY.DEFAULT}
            >
              <ChevronDown size={ICON_SIZES.md} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Dropdown */}
        {isOpen && suggestions.length > 0 && (
          <View
            className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-50"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              maxHeight: 240,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {suggestions.map((suggestion, index) => (
                <AddressSuggestionItem
                  key={suggestion.id}
                  suggestion={suggestion}
                  onPress={handleSelect}
                  isLast={index === suggestions.length - 1}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Error message */}
      {error && (
        <Text
          className="text-xs mt-1"
          style={{ color: colors.destructive }}
        >
          {error}
        </Text>
      )}

      {/* Status indicator */}
      {!error && statusInfo && (
        <Text
          className="text-xs mt-1"
          style={{ color: statusInfo.color }}
        >
          {statusInfo.text}
        </Text>
      )}
    </View>
  );
}

export default AddressAutofill;
