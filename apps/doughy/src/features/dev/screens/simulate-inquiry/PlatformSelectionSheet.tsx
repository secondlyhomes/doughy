// src/features/dev/screens/simulate-inquiry/PlatformSelectionSheet.tsx
// Bottom sheet for selecting a platform with preset values

import React from 'react';
import { View } from 'react-native';

import { BottomSheet } from '@/components/ui';
import { SPACING } from '@/constants/design-tokens';

import { PLATFORM_CONFIGS } from './constants';
import { PresetButton } from './PresetButton';
import type { Platform } from './types';

interface PlatformSelectionSheetProps {
  visible: boolean;
  selectedPlatform: Platform;
  onClose: () => void;
  onSelect: (platform: Platform) => void;
}

export function PlatformSelectionSheet({
  visible,
  selectedPlatform,
  onClose,
  onSelect,
}: PlatformSelectionSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Select Platform"
    >
      <View style={{ paddingBottom: SPACING.xl }}>
        {PLATFORM_CONFIGS.map((config) => (
          <PresetButton
            key={config.id}
            config={config}
            isSelected={selectedPlatform === config.id}
            onPress={() => onSelect(config.id)}
          />
        ))}
      </View>
    </BottomSheet>
  );
}
