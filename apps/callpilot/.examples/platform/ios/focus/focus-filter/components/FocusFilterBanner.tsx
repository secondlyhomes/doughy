/**
 * FocusFilterBanner.tsx
 *
 * Banner component that displays when Focus mode is active
 * Shows current Focus mode and indicates tasks are being filtered
 */

import React from 'react';
import { View, Text } from 'react-native';
import { FocusMode } from '../types';
import { useFocusFilter } from '../hooks/useFocusFilter';
import { focusFilterStyles } from '../styles';

/**
 * Focus Filter Banner Component
 *
 * Displays a banner when Focus mode is active and filtering is enabled.
 * Returns null when no Focus mode is active or filtering is disabled.
 */
export function FocusFilterBanner(): React.ReactElement | null {
  const { currentFocus, getFocusDisplayName, isFiltering } = useFocusFilter();

  if (currentFocus === FocusMode.None || !isFiltering) {
    return null;
  }

  return (
    <View style={focusFilterStyles.bannerContainer}>
      <Text style={focusFilterStyles.bannerText}>
        {getFocusDisplayName()} Focus is active
        <Text style={focusFilterStyles.bannerSubtext}>
          {' '}Some tasks are hidden
        </Text>
      </Text>
    </View>
  );
}
