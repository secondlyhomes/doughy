// src/components/ThemedView.tsx
// Themed container components that respond to dark mode
import React from 'react';
import { View, ViewProps, Text, TextProps, ScrollView, ScrollViewProps } from 'react-native';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import { useThemeColors } from '@/contexts/ThemeContext';

type BackgroundVariant = 'background' | 'card' | 'muted' | 'secondary' | 'popover' | 'destructive' | 'primary';

interface ThemedViewProps extends ViewProps {
  variant?: BackgroundVariant;
}

interface ThemedSafeAreaViewProps extends SafeAreaViewProps {
  variant?: BackgroundVariant;
}

interface ThemedScrollViewProps extends ScrollViewProps {
  variant?: BackgroundVariant;
}

interface ThemedTextProps extends TextProps {
  variant?: 'foreground' | 'muted' | 'primary' | 'destructive' | 'card' | 'secondary';
}

function useBackgroundColor(variant: BackgroundVariant) {
  const colors = useThemeColors();

  const colorMap: Record<BackgroundVariant, string> = {
    background: colors.background,
    card: colors.card,
    muted: colors.muted,
    secondary: colors.secondary,
    popover: colors.popover,
    destructive: colors.destructive,
    primary: colors.primary,
  };

  return colorMap[variant];
}

function useTextColor(variant: ThemedTextProps['variant']) {
  const colors = useThemeColors();

  const colorMap = {
    foreground: colors.foreground,
    muted: colors.mutedForeground,
    primary: colors.primary,
    destructive: colors.destructive,
    card: colors.cardForeground,
    secondary: colors.secondaryForeground,
  };

  return colorMap[variant || 'foreground'];
}

export function ThemedView({ variant = 'background', style, ...props }: ThemedViewProps) {
  const backgroundColor = useBackgroundColor(variant);
  return <View style={[{ backgroundColor }, style]} {...props} />;
}

export function ThemedSafeAreaView({ variant = 'background', style, ...props }: ThemedSafeAreaViewProps) {
  const backgroundColor = useBackgroundColor(variant);
  return <SafeAreaView style={[{ backgroundColor }, style]} {...props} />;
}

export function ThemedScrollView({ variant = 'background', style, ...props }: ThemedScrollViewProps) {
  const backgroundColor = useBackgroundColor(variant);
  return <ScrollView style={[{ backgroundColor }, style]} {...props} />;
}

export function ThemedText({ variant = 'foreground', style, ...props }: ThemedTextProps) {
  const color = useTextColor(variant);
  return <Text style={[{ color }, style]} {...props} />;
}

// Convenience component for cards
export function ThemedCard({ style, ...props }: ViewProps) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 16, // rounded-xl equivalent
          padding: 16,
        },
        style,
      ]}
      {...props}
    />
  );
}

// Modal/Sheet background component
export function ThemedModalContent({ style, ...props }: ViewProps) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderTopLeftRadius: 24, // rounded-t-3xl equivalent
          borderTopRightRadius: 24,
        },
        style,
      ]}
      {...props}
    />
  );
}
