// src/features/pipeline/screens/pipeline/FiltersSheet.tsx
// Filters bottom sheet for pipeline screen

import React from 'react';
import { View } from 'react-native';
import { BottomSheet, BottomSheetSection, Button } from '@/components/ui';

export interface FiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  onClearSearch: () => void;
}

export function FiltersSheet({ visible, onClose, onClearSearch }: FiltersSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Filters"
    >
      <BottomSheetSection title="Search">
        <View className="flex-row gap-3 pt-4 pb-6">
          <Button
            variant="outline"
            onPress={() => {
              onClearSearch();
              onClose();
            }}
            className="flex-1"
          >
            Clear Search
          </Button>
          <Button onPress={onClose} className="flex-1">
            Done
          </Button>
        </View>
      </BottomSheetSection>
    </BottomSheet>
  );
}
