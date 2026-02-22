// src/features/settings/components/PlatformToggleRow.tsx
// A single platform row with toggle switch, icon, label, and active badge

import React from 'react';
import { View, Text } from 'react-native';
import { Platform } from '@/contexts/PlatformContext';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Switch } from '@/components/ui/Switch';
import { withOpacity } from '@/lib/design-utils';
import { PlatformConfig } from './platform-settings-types';
import { styles } from './platform-settings-styles';

interface PlatformToggleRowProps {
  config: PlatformConfig;
  isEnabled: boolean;
  isActive: boolean;
  isOnlyPlatform: boolean;
  isCurrentlyToggling: boolean;
  showDivider: boolean;
  onToggle: (platform: Platform, enabled: boolean) => void;
}

export function PlatformToggleRow({
  config,
  isEnabled,
  isActive,
  isOnlyPlatform,
  isCurrentlyToggling,
  showDivider,
  onToggle,
}: PlatformToggleRowProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.platformRow,
        showDivider && {
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: withOpacity(config.color, 'medium') },
        ]}
      >
        {config.icon(config.color)}
      </View>

      <View style={styles.platformInfo}>
        <View style={styles.platformHeader}>
          <Text style={[styles.platformLabel, { color: colors.foreground }]}>
            {config.label}
          </Text>
          {isActive && (
            <View
              style={[
                styles.activeBadge,
                { backgroundColor: withOpacity(colors.success, 'medium') },
              ]}
            >
              <Text style={[styles.activeBadgeText, { color: colors.success }]}>
                Active
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.platformDescription, { color: colors.mutedForeground }]}>
          {config.description}
        </Text>
      </View>

      <Switch
        checked={isEnabled}
        onCheckedChange={(checked) => onToggle(config.id, checked)}
        disabled={isOnlyPlatform || isCurrentlyToggling}
      />
    </View>
  );
}
