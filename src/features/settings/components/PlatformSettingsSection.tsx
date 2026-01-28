// src/features/settings/components/PlatformSettingsSection.tsx
// Full settings section for platform management
// Shows enabled platforms with toggle switches and current active platform

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { TrendingUp, Home, Check, ChevronRight, AlertCircle } from 'lucide-react-native';
import { usePlatform, Platform } from '@/contexts/PlatformContext';
import { useThemeColors } from '@/context/ThemeContext';
import { Switch } from '@/components/ui/Switch';
import { PlatformSwitcher } from '@/components/ui/PlatformSwitcher';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES, FONT_SIZES } from '@/constants/design-tokens';

// ============================================
// Types
// ============================================

export interface PlatformSettingsSectionProps {
  /** Optional className for container */
  className?: string;
}

interface PlatformConfig {
  id: Platform;
  label: string;
  description: string;
  icon: (color: string) => React.ReactNode;
  color: string;
}

// ============================================
// Platform Configurations
// ============================================

const platformConfigs: PlatformConfig[] = [
  {
    id: 'investor',
    label: 'Real Estate Investor',
    description: 'Track deals, analyze properties, and manage your investment portfolio',
    icon: (color: string) => <TrendingUp size={ICON_SIZES.xl} color={color} />,
    color: '#3b82f6', // blue-500
  },
  {
    id: 'landlord',
    label: 'Landlord',
    description: 'Manage rental properties, tenants, and maintenance requests',
    icon: (color: string) => <Home size={ICON_SIZES.xl} color={color} />,
    color: '#22c55e', // green-500
  },
];

// ============================================
// PlatformSettingsSection Component
// ============================================

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
        {platformConfigs.map((config, index) => {
          const isEnabled = enabledPlatforms.includes(config.id);
          const isActive = activePlatform === config.id;
          const isOnlyPlatform = enabledPlatforms.length === 1 && isEnabled;
          const isCurrentlyToggling = isToggling === config.id;

          return (
            <View
              key={config.id}
              style={[
                styles.platformRow,
                index < platformConfigs.length - 1 && {
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
                onCheckedChange={(checked) => handleTogglePlatform(config.id, checked)}
                disabled={isOnlyPlatform || isCurrentlyToggling}
              />
            </View>
          );
        })}
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

      {/* Section Header: Active Platform */}
      {hasMultiplePlatforms && (
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

            {platformConfigs
              .filter((config) => enabledPlatforms.includes(config.id))
              .map((config, index, arr) => {
                const isActive = activePlatform === config.id;

                return (
                  <TouchableOpacity
                    key={config.id}
                    style={[
                      styles.selectableRow,
                      index < arr.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      },
                    ]}
                    onPress={() => handleSelectPlatform(config.id)}
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
      )}
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  loadingContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
  },
  dismissText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformInfo: {
    flex: 1,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  platformLabel: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  activeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  activeBadgeText: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: '600',
  },
  platformDescription: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  warningText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
  },
  switcherContainer: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  switcherLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  divider: {
    height: 1,
  },
  selectableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  smallIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectableLabel: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
  },
  helpText: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
});

export default PlatformSettingsSection;
