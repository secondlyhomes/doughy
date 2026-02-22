// src/components/ui/ConversationHeader.tsx
// Reusable conversation header component matching Lead Conversations UI style
// Features: Simple touchable buttons, centered title with channel/AI info

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft, MoreVertical, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';

export interface ConversationHeaderProps {
  /** Main title text (contact name, screen title, etc.) */
  title: string;

  /** Channel indicator with icon and name */
  channel?: {
    name: string; // "email", "sms", etc.
    icon: React.ComponentType<{ size: number; color: string }>;
  };

  /** Show AI enabled indicator */
  aiEnabled?: boolean;

  /** Custom back handler (overrides default router.back) */
  onBack?: () => void;

  /** Settings/menu button handler - if provided, shows settings button */
  onSettingsPress?: () => void;

  /**
   * Presentation mode controls safe area handling:
   * - 'fullScreenModal': Applies top safe area padding (for headerShown: false)
   * - 'card': No top padding (iOS card presentation)
   * - 'regular': No top padding (standard navigation)
   */
  presentationMode?: 'fullScreenModal' | 'card' | 'regular';
}

export function ConversationHeader({
  title,
  channel,
  aiEnabled = false,
  onBack,
  onSettingsPress,
  presentationMode = 'regular',
}: ConversationHeaderProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Only apply top padding for fullScreenModal since headerShown: false
  const topPadding = presentationMode === 'fullScreenModal' ? insets.top : 0;
  const ChannelIcon = channel?.icon;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: topPadding,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Left: Back button */}
        <TouchableOpacity
          onPress={onBack || (() => router.back())}
          style={styles.iconButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>

        {/* Center: Title area */}
        <View style={styles.titleArea}>
          <Text
            style={[styles.title, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {channel && (
            <View style={styles.subtitleRow}>
              {ChannelIcon && (
                <ChannelIcon size={12} color={colors.mutedForeground} />
              )}
              <Text
                style={[styles.channelText, { color: colors.mutedForeground }]}
              >
                {channel.name.toUpperCase()}
              </Text>
              {aiEnabled && (
                <>
                  <Text style={{ color: colors.mutedForeground }}> | </Text>
                  <Sparkles size={12} color={colors.info} />
                  <Text style={[styles.aiText, { color: colors.info }]}>AI</Text>
                </>
              )}
            </View>
          )}
        </View>

        {/* Right: Settings button or spacer */}
        {onSettingsPress ? (
          <TouchableOpacity
            onPress={onSettingsPress}
            style={styles.iconButton}
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            <MoreVertical size={24} color={colors.foreground} />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // No border - clean look
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    minHeight: 56,
  },
  iconButton: {
    padding: SPACING.sm,
  },
  titleArea: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  channelText: {
    fontSize: FONT_SIZES.xs,
  },
  aiText: {
    fontSize: FONT_SIZES.xs,
  },
  spacer: {
    width: 40,
  },
});

export default ConversationHeader;
