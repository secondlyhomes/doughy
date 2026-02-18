// src/features/voip/components/AISuggestions.tsx
// AI coaching cards during calls - subtle, not overwhelming

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Sparkles, MessageCircle, HelpCircle, Zap, Info, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity, getShadowStyle } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES, ICON_SIZES } from '@/constants/design-tokens';
import type { AISuggestion } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AISuggestionsProps {
  suggestions: AISuggestion[];
  onDismiss: (id: string) => void;
  onUseSuggestion?: (suggestion: AISuggestion) => void;
  hideHeader?: boolean; // Hide header when shown separately
  darkMode?: boolean; // Use dark transparent cards for call screen
}

interface SuggestionCardProps {
  suggestion: AISuggestion;
  onDismiss: () => void;
  onUse?: () => void;
  index: number;
  darkMode?: boolean;
}

function getSuggestionIcon(type: AISuggestion['type']) {
  switch (type) {
    case 'response':
      return MessageCircle;
    case 'question':
      return HelpCircle;
    case 'action':
      return Zap;
    case 'info':
    default:
      return Info;
  }
}

function getSuggestionLabel(type: AISuggestion['type']) {
  switch (type) {
    case 'response':
      return 'Suggested Response';
    case 'question':
      return 'Ask This';
    case 'action':
      return 'Take Action';
    case 'info':
    default:
      return 'Note';
  }
}

function SuggestionCard({ suggestion, onDismiss, onUse, index, darkMode }: SuggestionCardProps) {
  const colors = useThemeColors();
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const IconComponent = getSuggestionIcon(suggestion.type);

  // Dark mode uses semi-transparent cards for call screen
  const cardBackground = darkMode ? 'rgba(255, 255, 255, 0.1)' : colors.card;
  const textColor = darkMode ? '#FFFFFF' : colors.foreground;
  const mutedColor = darkMode ? 'rgba(255, 255, 255, 0.6)' : colors.mutedForeground;

  useEffect(() => {
    // Stagger animation based on index
    const delay = index * 100;

    const animation = Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
    ]);
    animation.start();

    // Cleanup: stop animation if component unmounts before completion
    return () => animation.stop();
  }, [slideAnim, fadeAnim, index]);

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  const handleUse = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUse?.();
    handleDismiss();
  };

  // Color based on confidence
  const accentColor =
    suggestion.confidence >= 0.8
      ? colors.success
      : suggestion.confidence >= 0.6
      ? colors.warning
      : colors.info;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: cardBackground,
          ...(darkMode ? {} : getShadowStyle(colors, { size: 'md' })),
          transform: [{ translateX: slideAnim }],
          opacity: fadeAnim,
          borderWidth: darkMode ? 1 : 0,
          borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
        },
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconBadge, { backgroundColor: withOpacity(accentColor, 'light') }]}>
            <IconComponent size={ICON_SIZES.sm} color={accentColor} />
          </View>
          <Text style={[styles.cardLabel, { color: accentColor }]}>
            {getSuggestionLabel(suggestion.type)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Dismiss suggestion"
        >
          <X size={ICON_SIZES.md} color={mutedColor} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Text style={[styles.cardText, { color: textColor }]} numberOfLines={3}>
        {suggestion.text}
      </Text>

      {/* Context if provided */}
      {suggestion.context && (
        <Text style={[styles.contextText, { color: mutedColor }]} numberOfLines={1}>
          Based on: {suggestion.context}
        </Text>
      )}

      {/* Actions */}
      {suggestion.type === 'response' && onUse && (
        <TouchableOpacity
          onPress={handleUse}
          style={[styles.useButton, { backgroundColor: withOpacity(accentColor, 'light') }]}
        >
          <Text style={[styles.useButtonText, { color: accentColor }]}>Use This</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

export function AISuggestions({ suggestions, onDismiss, onUseSuggestion, hideHeader, darkMode }: AISuggestionsProps) {
  const colors = useThemeColors();

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header - can be hidden when shown separately */}
      {!hideHeader && (
        <View style={styles.header}>
          <Sparkles size={ICON_SIZES.md} color={colors.primary} />
          <Text style={[styles.headerText, { color: darkMode ? '#FFFFFF' : colors.foreground }]}>
            AI Coach
          </Text>
          <View style={[styles.premiumBadge, { backgroundColor: withOpacity(colors.primary, 'light') }]}>
            <Text style={[styles.premiumText, { color: colors.primary }]}>Premium</Text>
          </View>
        </View>
      )}

      {/* Suggestions list */}
      <View style={styles.suggestionsContainer}>
        {suggestions.map((suggestion, index) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onDismiss={() => onDismiss(suggestion.id)}
            onUse={onUseSuggestion ? () => onUseSuggestion(suggestion) : undefined}
            index={index}
            darkMode={darkMode}
          />
        ))}
      </View>
    </View>
  );
}

// Export header separately for use in InCallScreen
export function AISuggestionsHeader() {
  const colors = useThemeColors();

  return (
    <View style={styles.header}>
      <Sparkles size={ICON_SIZES.md} color={colors.primary} />
      <Text style={[styles.headerText, { color: '#FFFFFF' }]}>
        AI Coach
      </Text>
      <View style={[styles.premiumBadge, { backgroundColor: withOpacity(colors.primary, 'medium') }]}>
        <Text style={[styles.premiumText, { color: colors.primary }]}>Premium</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  headerText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    flex: 1,
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '700',
  },
  suggestionsContainer: {
    gap: SPACING.sm,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  iconBadge: {
    width: ICON_SIZES.xl,
    height: ICON_SIZES.xl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  contextText: {
    fontSize: FONT_SIZES.xs,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  useButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  useButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});

export default AISuggestions;
