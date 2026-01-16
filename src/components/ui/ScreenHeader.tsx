// src/components/ui/ScreenHeader.tsx
// Reusable screen header component for consistent layout across screens

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import { GlassView } from './GlassView';
import { GlassButton } from './GlassButton';

export interface ScreenHeaderProps {
  /** Main title text */
  title: string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Show back button (auto-navigates back) */
  backButton?: boolean;
  /** Custom back handler (overrides default router.back) */
  onBack?: () => void;
  /** Right-side action element(s) */
  rightAction?: React.ReactNode;
  /** Optional className for container */
  className?: string;
  /** Use border bottom separator */
  bordered?: boolean;
  /** Enable liquid glass effect */
  glass?: boolean;
  /** Glass blur effect type (iOS 26+). Default: 'regular' */
  glassEffect?: 'clear' | 'regular';
  /** Blur intensity for fallback (0-100). Default: 40 */
  glassIntensity?: number;
  /** Position mode for overlay headers. Default: 'relative' */
  position?: 'relative' | 'absolute';
  /** Custom style */
  style?: ViewStyle;
}

export function ScreenHeader({
  title,
  subtitle,
  backButton = false,
  onBack,
  rightAction,
  className,
  bordered = false,
  glass = false,
  glassEffect = 'regular',
  glassIntensity = 40,
  position = 'relative',
  style,
}: ScreenHeaderProps) {
  const colors = useThemeColors();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const containerStyle: ViewStyle[] = [
    bordered ? { borderBottomWidth: 1, borderBottomColor: colors.border } : {},
    position === 'absolute' ? styles.absolute : {},
    style || {},
  ];

  const headerContent = (
    <View
      className={cn(
        'px-4 pt-4 pb-2 flex-row items-center justify-between',
        className
      )}
      style={!glass ? [{ backgroundColor: colors.card }, ...containerStyle] : containerStyle}
    >
      <View className="flex-row items-center flex-1">
        {backButton && (
          <GlassButton
            icon={<ArrowLeft size={24} color={colors.foreground} />}
            onPress={handleBack}
            size={40}
            effect="clear"
            containerStyle={{ marginRight: 12 }}
            accessibilityLabel="Go back"
          />
        )}
        <View className="flex-1">
          <Text className="text-2xl font-bold" style={{ color: colors.foreground }}>{title}</Text>
          {subtitle && (
            <Text style={{ color: colors.mutedForeground }}>{subtitle}</Text>
          )}
        </View>
      </View>
      {rightAction && <View className="ml-3">{rightAction}</View>}
    </View>
  );

  if (glass) {
    return (
      <GlassView
        effect={glassEffect}
        intensity={glassIntensity}
        style={containerStyle}
      >
        {headerContent}
      </GlassView>
    );
  }

  return headerContent;
}

const styles = StyleSheet.create({
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
