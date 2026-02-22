// src/features/public/components/SimpleAssistant.tsx
// Floating chat assistant for public marketing pages
import React from 'react';
import { View, Text, TouchableOpacity, Animated, useWindowDimensions } from 'react-native';
import { MessageSquare, ChevronUp } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getShadowStyle } from '@/lib/design-utils';
import { BORDER_RADIUS, ICON_SIZES, SPACING } from '@/constants/design-tokens';
import { useAssistantChat } from './useAssistantChat';
import { AssistantChatPanel } from './AssistantChatPanel';

export function SimpleAssistant() {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const {
    isOpen,
    isMinimized,
    messages,
    inputValue,
    isLoading,
    scrollViewRef,
    scaleAnim,
    setInputValue,
    handleSendMessage,
    toggleOpen,
    toggleMinimize,
  } = useAssistantChat();

  // Chat panel width - responsive
  const panelWidth = Math.min(width - 32, 384);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        zIndex: 50,
        alignItems: 'flex-end',
      }}
    >
      {/* Chat Panel */}
      {isOpen && !isMinimized && (
        <AssistantChatPanel
          messages={messages}
          inputValue={inputValue}
          isLoading={isLoading}
          panelWidth={panelWidth}
          scrollViewRef={scrollViewRef}
          onInputChange={setInputValue}
          onSendMessage={handleSendMessage}
          onMinimize={toggleMinimize}
          onClose={toggleOpen}
        />
      )}

      {/* Minimized State */}
      {isOpen && isMinimized && (
        <TouchableOpacity
          onPress={toggleMinimize}
          style={{
            marginBottom: 8,
            backgroundColor: colors.card,
            borderRadius: BORDER_RADIUS.lg,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING.sm,
            ...getShadowStyle(colors, { size: 'md' }),
          }}
        >
          <MessageSquare size={ICON_SIZES.lg} color={colors.primary} />
          <Text style={{ color: colors.foreground, fontWeight: '500' }}>
            Chat with Doughy
          </Text>
          <ChevronUp size={ICON_SIZES.ml} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}

      {/* Toggle Button */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={toggleOpen}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            ...getShadowStyle(colors, { size: 'lg' }),
          }}
          accessibilityLabel="Chat with assistant"
        >
          {isOpen && isMinimized ? (
            <ChevronUp size={ICON_SIZES.xl} color={colors.primaryForeground} />
          ) : (
            <MessageSquare size={ICON_SIZES.xl} color={colors.primaryForeground} />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
