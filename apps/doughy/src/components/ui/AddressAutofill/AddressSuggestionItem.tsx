// src/components/ui/AddressAutofill/AddressSuggestionItem.tsx
// Individual suggestion row in the dropdown

import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Clock, CheckCircle } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import type { AddressSuggestion } from './types';

interface AddressSuggestionItemProps {
  suggestion: AddressSuggestion;
  onPress: (suggestion: AddressSuggestion) => void;
  isLast?: boolean;
}

/**
 * Individual address suggestion item shown in dropdown.
 * Displays primary text (street), secondary text (city, state, zip),
 * and optional badge for verified/recent addresses.
 */
export const AddressSuggestionItem = memo(function AddressSuggestionItem({
  suggestion,
  onPress,
  isLast = false,
}: AddressSuggestionItemProps) {
  const colors = useThemeColors();

  const handlePress = () => {
    onPress(suggestion);
  };

  // Get badge icon and color
  const getBadgeIcon = () => {
    switch (suggestion.badge) {
      case 'recent':
        return <Clock size={12} color={colors.primary} />;
      case 'verified':
        return <CheckCircle size={12} color={colors.success || '#22c55e'} />;
      default:
        return null;
    }
  };

  const badgeIcon = getBadgeIcon();

  return (
    <TouchableOpacity
      className="flex-row items-center gap-3 px-3 py-3"
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
      }}
      onPress={handlePress}
      activeOpacity={PRESS_OPACITY.DEFAULT}
    >
      <MapPin size={ICON_SIZES.md} color={colors.mutedForeground} />

      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text
            className="text-sm font-medium flex-1"
            style={{ color: colors.foreground }}
            numberOfLines={1}
          >
            {suggestion.primaryText}
          </Text>
          {badgeIcon}
        </View>
        <Text
          className="text-xs"
          style={{ color: colors.mutedForeground }}
          numberOfLines={1}
        >
          {suggestion.secondaryText}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

export default AddressSuggestionItem;
