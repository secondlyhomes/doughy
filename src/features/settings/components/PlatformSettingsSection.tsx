// src/features/settings/components/PlatformSettingsSection.tsx
// Full settings section for platform management
// Shows enabled platforms with toggle switches and current active platform

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { usePlatform, Platform } from '@/contexts/PlatformContext';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ICON_SIZES } from '@/constants/design-tokens';
import { PlatformSettingsSectionProps, platformConfigs } from './platform-settings-types';
import { styles } from './platform-settings-styles';
import { PlatformToggleRow } from './PlatformToggleRow';
import { ActivePlatformSection } from './ActivePlatformSection';

export type { PlatformSettingsSectionProps } from './platform-settings-types';

export function PlatformSettingsSection({ className }: PlatformSettingsSectionProps) {
  const colors = useThemeColors();
  const {
    enabledPlatforms,
    activePlatform,
    enablePlatform,
    disablePlatform,
    switchPlatform,
    isLoading,
    error,
    clearError,
  } = usePlatform();

  const [isToggling, setIsToggling] = useState<Platform | null>(null);

  // Handle toggling a platform on/off
  const handleTogglePlatform = useCallback(
    async (platform: Platform, enabled: boolean) => {
      // Check if trying to disable the only enabled platform
      if (!enabled && enabledPlatforms.length === 1) {
        Alert.alert(
          'Cannot Disable Platform',
          'You must have at least one platform enabled. Enable another platform first before disabling this one.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      setIsToggling(platform);

      try {
        if (enabled) {
          await enablePlatform(platform);
        } else {
          await disablePlatform(platform);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update platform setting';
        console.error('Error toggling platform:', err);
        Alert.alert('Error', message);
      } finally {
        setIsToggling(null);
      }
    },
    [enabledPlatforms, enablePlatform, disablePlatform]
  );

  // Handle selecting active platform
  const handleSelectPlatform = useCallback(
    async (platform: Platform) => {
      if (platform !== activePlatform && enabledPlatforms.includes(platform)) {
        await switchPlatform(platform);
      }
    },
    [activePlatform, enabledPlatforms, switchPlatform]
  );

  // Check if multiple platforms are enabled
  const hasMultiplePlatforms = enabledPlatforms.length > 1;

  // Dismiss error
  const handleDismissError = useCallback(() => {
    clearError();
  }, [clearError]);

  if (isLoading) {
    return (
      <View className={className} style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Loading platform settings...
        </Text>
      </View>
    );
  }

  return (
    <View className={className}>
      {/* Error Alert */}
      {error && (
        <View
          style={[
            styles.errorContainer,
            {
              backgroundColor: withOpacity(colors.destructive, 'medium'),
              borderColor: colors.destructive,
            },
          ]}
        >
          <AlertCircle size={ICON_SIZES.md} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          <TouchableOpacity onPress={handleDismissError}>
            <Text style={[styles.dismissText, { color: colors.destructive }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Section Header: Enabled Platforms */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
        ENABLED PLATFORMS
      </Text>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {platformConfigs.map((config, index) => (
          <PlatformToggleRow
            key={config.id}
            config={config}
            isEnabled={enabledPlatforms.includes(config.id)}
            isActive={activePlatform === config.id}
            isOnlyPlatform={enabledPlatforms.length === 1 && enabledPlatforms.includes(config.id)}
            isCurrentlyToggling={isToggling === config.id}
            showDivider={index < platformConfigs.length - 1}
            onToggle={handleTogglePlatform}
          />
        ))}
      </View>

      {/* Warning for single platform */}
      {enabledPlatforms.length === 1 && (
        <View style={[styles.warningContainer, { backgroundColor: withOpacity(colors.warning, 'muted') }]}>
          <AlertCircle size={ICON_SIZES.sm} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.warning }]}>
            Enable another platform to switch between them
          </Text>
        </View>
      )}

      {/* Active Platform Section (only when multiple platforms enabled) */}
      {hasMultiplePlatforms && (
        <ActivePlatformSection
          platformConfigs={platformConfigs}
          enabledPlatforms={enabledPlatforms}
          activePlatform={activePlatform}
          onSelectPlatform={handleSelectPlatform}
        />
      )}
    </View>
  );
}

export default PlatformSettingsSection;
