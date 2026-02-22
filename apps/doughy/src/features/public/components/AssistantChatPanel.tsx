// src/features/public/components/AssistantChatPanel.tsx
// Expanded chat panel with header, message list, and input for SimpleAssistant
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { X, Send, ChevronDown } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getShadowStyle } from '@/lib/design-utils';
import { useKeyboardAvoidance } from '@/hooks';
import { BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { Message } from './simple-assistant-types';
import { MessageBubble } from './MessageBubble';

interface AssistantChatPanelProps {
  messages: Message[];
  inputValue: string;
  isLoading: boolean;
  panelWidth: number;
  scrollViewRef: React.RefObject<ScrollView | null>;
  onInputChange: (text: string) => void;
  onSendMessage: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

export function AssistantChatPanel({
  messages,
  inputValue,
  isLoading,
  panelWidth,
  scrollViewRef,
  onInputChange,
  onSendMessage,
  onMinimize,
  onClose,
}: AssistantChatPanelProps) {
  const colors = useThemeColors();
  const keyboardProps = useKeyboardAvoidance({});

  return (
    <KeyboardAvoidingView
      behavior={keyboardProps.behavior}
      keyboardVerticalOffset={keyboardProps.keyboardVerticalOffset}
      style={{ marginBottom: 8 }}
    >
      <View
        style={{
          width: panelWidth,
          maxHeight: 500,
          backgroundColor: colors.background,
          borderRadius: BORDER_RADIUS.lg,
          borderWidth: 1,
          borderColor: colors.border,
          ...getShadowStyle(colors, { size: 'lg' }),
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <Text
            style={{
              fontWeight: '600',
              fontSize: 16,
              color: colors.foreground,
            }}
          >
            Doughy Assistant
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={onMinimize}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronDown size={ICON_SIZES.lg} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={ICON_SIZES.lg} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, maxHeight: 350 }}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={keyboardProps.keyboardShouldPersistTaps}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} colors={colors} />
          ))}
        </ScrollView>

        {/* Input */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <TextInput
            value={inputValue}
            onChangeText={onInputChange}
            onSubmitEditing={onSendMessage}
            placeholder="Type your message..."
            placeholderTextColor={colors.mutedForeground}
            editable={!isLoading}
            style={{
              flex: 1,
              backgroundColor: colors.muted,
              borderRadius: BORDER_RADIUS.md,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: colors.foreground,
            }}
          />
          <TouchableOpacity
            onPress={onSendMessage}
            disabled={!inputValue.trim() || isLoading}
            style={{
              width: 40,
              height: 40,
              borderRadius: BORDER_RADIUS.md,
              backgroundColor: inputValue.trim() && !isLoading ? colors.primary : colors.muted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send
              size={ICON_SIZES.ml}
              color={inputValue.trim() && !isLoading ? colors.primaryForeground : colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
