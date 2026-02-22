// src/features/deals/screens/cockpit/tabs/DocsTab.tsx
// Documents tab content for the Deal Cockpit

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Folder, ChevronRight } from 'lucide-react-native';
import { ICON_SIZES } from '@/constants/design-tokens';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

interface DocsTabProps {
  onDocsPress: () => void;
}

export function DocsTab({ onDocsPress }: DocsTabProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onDocsPress}
      className="rounded-xl p-4 mb-3"
      style={{ backgroundColor: colors.card }}
    >
      <View className="flex-row items-center">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{
            backgroundColor: withOpacity(colors.primary, 'muted'),
          }}
        >
          <Folder size={ICON_SIZES.lg} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text
            className="text-base font-semibold"
            style={{ color: colors.foreground }}
          >
            Documents
          </Text>
          <Text
            className="text-sm"
            style={{ color: colors.mutedForeground }}
          >
            Contracts, disclosures, and files
          </Text>
        </View>
        <ChevronRight size={ICON_SIZES.lg} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}
