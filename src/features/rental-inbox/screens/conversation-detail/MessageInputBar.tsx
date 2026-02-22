// Message input bar with send button

import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Send } from 'lucide-react-native';

import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/design-tokens';
import { styles } from './conversation-detail-styles';

interface MessageInputBarProps {
  inputRef: React.RefObject<TextInput | null>;
  messageText: string;
  setMessageText: (text: string) => void;
  handleSend: () => void;
  isSending: boolean;
  bottomInset: number;
}

export function MessageInputBar({
  inputRef,
  messageText,
  setMessageText,
  handleSend,
  isSending,
  bottomInset,
}: MessageInputBarProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.inputContainer,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          // Use safe area bottom for home indicator, with minimum padding
          paddingBottom: bottomInset > 0 ? bottomInset : SPACING.sm,
        },
      ]}
    >
      <View
        style={[
          styles.inputWrapper,
          { backgroundColor: colors.muted, borderColor: colors.border },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.foreground }]}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          maxLength={2000}
          returnKeyType="default"
          blurOnSubmit={false}
          accessibilityLabel="Message input"
          accessibilityHint="Type your message here"
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!messageText.trim() || isSending}
          style={[
            styles.sendButton,
            {
              backgroundColor:
                messageText.trim() && !isSending
                  ? colors.primary
                  : colors.muted,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !messageText.trim() || isSending }}
        >
          <Send
            size={18}
            color={
              messageText.trim() && !isSending
                ? colors.primaryForeground
                : colors.mutedForeground
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
