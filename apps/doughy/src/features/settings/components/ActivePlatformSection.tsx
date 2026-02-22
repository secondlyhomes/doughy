// src/features/settings/components/ActivePlatformSection.tsx
// Shows the active platform switcher and selectable platform list

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, ChevronRight } from 'lucide-react-native';
import { Platform } from '@/contexts/PlatformContext';
import { useThemeColors } from '@/contexts/ThemeContext';
import { PlatformSwitcher } from '@/components/ui/PlatformSwitcher';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, ICON_SIZES } from '@/constants/design-tokens';
import { PlatformConfig } from './platform-settings-types';
import { styles } from './platform-settings-styles';

interface ActivePlatformSectionProps {
  platformConfigs: PlatformConfig[];
  enabledPlatforms: Platform[];
  activePlatform: Platform;
  onSelectPlatform: (platform: Platform) => void;
}

export function ActivePlatformSection({
  platformConfigs,
  enabledPlatforms,
  activePlatform,
  onSelectPlatform,
}: ActivePlatformSectionProps) {
  const colors = useThemeColors();

  const enabledConfigs = platformConfigs.filter((config) =>
    enabledPlatforms.includes(config.id)
  );

  return (
    <>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: SPACING['2xl'] }]}>
        ACTIVE PLATFORM
      </Text>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.switcherContainer}>
          <Text style={[styles.switcherLabel, { color: colors.foreground }]}>
            Switch between platforms
          </Text>
          <PlatformSwitcher mode="full" showLabels />
        </View>

        {/* Platform Selection List */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {enabledConfigs.map((config, index) => {
          const isActive = activePlatform === config.id;

          return (
            <TouchableOpacity
              key={config.id}
              style={[
                styles.selectableRow,
                index < enabledConfigs.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
              onPress={() => onSelectPlatform(config.id)}
              accessibilityLabel={`Select ${config.label} as active platform`}
              accessibilityRole="radio"
              accessibilityState={{ selected: isActive }}
            >
              <View
                style={[
                  styles.smallIconContainer,
                  { backgroundColor: withOpacity(config.color, 'medium') },
                ]}
              >
                {config.icon(config.color)}
              </View>

              <Text style={[styles.selectableLabel, { color: colors.foreground }]}>
                {config.label}
              </Text>

              {isActive ? (
                <Check size={ICON_SIZES.lg} color={colors.success} />
              ) : (
                <ChevronRight size={ICON_SIZES.lg} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
        Your active platform determines which features and data you see throughout the app.
      </Text>
    </>
  );
}
