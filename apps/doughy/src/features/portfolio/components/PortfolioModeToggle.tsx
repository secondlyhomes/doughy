// src/features/portfolio/components/PortfolioModeToggle.tsx
// Mode toggle buttons (Existing / New Property) for AddToPortfolioSheet

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Plus, Building } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FocusedSheetSection } from '@/components/ui';
import type { PortfolioModeToggleProps } from './add-to-portfolio-types';

export function PortfolioModeToggle({ mode, onSetMode }: PortfolioModeToggleProps) {
  const colors = useThemeColors();

  return (
    <FocusedSheetSection title="Property Source">
      <View className="flex-row gap-2">
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-3 rounded-lg border gap-2"
          style={{
            backgroundColor: mode === 'existing' ? colors.primary : colors.muted,
            borderColor: mode === 'existing' ? colors.primary : colors.border,
          }}
          onPress={() => onSetMode('existing')}
        >
          <Building
            size={18}
            color={mode === 'existing' ? colors.primaryForeground : colors.foreground}
          />
          <Text
            className="text-sm font-medium"
            style={{
              color: mode === 'existing' ? colors.primaryForeground : colors.foreground,
            }}
          >
            Existing
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-3 rounded-lg border gap-2"
          style={{
            backgroundColor: mode === 'new' ? colors.primary : colors.muted,
            borderColor: mode === 'new' ? colors.primary : colors.border,
          }}
          onPress={() => onSetMode('new')}
        >
          <Plus
            size={18}
            color={mode === 'new' ? colors.primaryForeground : colors.foreground}
          />
          <Text
            className="text-sm font-medium"
            style={{
              color: mode === 'new' ? colors.primaryForeground : colors.foreground,
            }}
          >
            New Property
          </Text>
        </TouchableOpacity>
      </View>
    </FocusedSheetSection>
  );
}
