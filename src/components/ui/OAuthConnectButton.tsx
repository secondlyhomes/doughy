// src/components/ui/OAuthConnectButton.tsx
// Reusable OAuth connection button for any integration (Smart Home, Banking, Calendar, etc.)

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Check, ExternalLink } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  PRESS_OPACITY,
} from '@/constants/design-tokens';

export interface OAuthConnectButtonProps {
  /** Provider identifier (e.g., 'schlage', 'plaid', 'google') */
  provider: string;
  /** Icon to display */
  icon: LucideIcon;
  /** Button label text */
  label: string;
  /** Callback when button is pressed */
  onPress: () => void;
  /** Whether the provider is already connected */
  connected?: boolean;
  /** Whether the OAuth flow is in progress */
  loading?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost';
  /** Custom connected label (default: "Connected") */
  connectedLabel?: string;
  /** Show external link icon to indicate leaving app */
  showExternalIcon?: boolean;
}

export function OAuthConnectButton({
  provider,
  icon: Icon,
  label,
  onPress,
  connected = false,
  loading = false,
  disabled = false,
  size = 'md',
  variant = 'default',
  connectedLabel = 'Connected',
  showExternalIcon = true,
}: OAuthConnectButtonProps) {
  const colors = useThemeColors();

  const isDisabled = disabled || loading;

  // Size configurations
  const sizeConfig = {
    sm: { padding: SPACING.sm, fontSize: FONT_SIZES.sm, iconSize: 16 },
    md: { padding: SPACING.md, fontSize: FONT_SIZES.base, iconSize: 18 },
    lg: { padding: SPACING.lg, fontSize: FONT_SIZES.lg, iconSize: 20 },
  }[size];

  // Variant colors
  const getVariantStyles = () => {
    if (connected) {
      return {
        backgroundColor: withOpacity(colors.success, 'light'),
        borderColor: colors.success,
        textColor: colors.success,
      };
    }

    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.primary,
          textColor: colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: colors.primary,
        };
      default:
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          textColor: colors.primaryForeground,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={PRESS_OPACITY.DEFAULT}
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          paddingVertical: sizeConfig.padding,
          paddingHorizontal: sizeConfig.padding * 1.5,
          opacity: isDisabled ? 0.5 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={connected ? `${provider} ${connectedLabel}` : label}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.textColor} />
      ) : connected ? (
        <Check size={sizeConfig.iconSize} color={variantStyles.textColor} />
      ) : (
        <Icon size={sizeConfig.iconSize} color={variantStyles.textColor} />
      )}

      <Text
        style={[
          styles.label,
          {
            color: variantStyles.textColor,
            fontSize: sizeConfig.fontSize,
            marginLeft: SPACING.sm,
          },
        ]}
      >
        {connected ? connectedLabel : label}
      </Text>

      {!connected && showExternalIcon && !loading && (
        <ExternalLink
          size={sizeConfig.iconSize - 4}
          color={variantStyles.textColor}
          style={{ marginLeft: SPACING.xs, opacity: 0.7 }}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  label: {
    fontWeight: '600',
  },
});
