// src/features/lead-inbox/screens/lead-conversation/ConversationComposer.tsx
// Message input area with send button for lead conversations

import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Send } from 'lucide-react-native';

import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';

interface ConversationComposerProps {
  messageText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
  paddingBottom: number;
}

export function ConversationComposer({
  messageText,
  onChangeText,
  onSend,
  isSending,
  paddingBottom,
}: ConversationComposerProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        paddingBottom: paddingBottom + SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'flex-end',
          backgroundColor: colors.muted,
          borderRadius: BORDER_RADIUS.lg,
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.sm,
          marginRight: SPACING.sm,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            color: colors.foreground,
            fontSize: FONT_SIZES.base,
            maxHeight: 100,
          }}
          value={messageText}
          onChangeText={onChangeText}
          placeholder="Type a message..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          editable={!isSending}
        />
      </View>

      <TouchableOpacity
        onPress={onSend}
        disabled={!messageText.trim() || isSending}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: messageText.trim() ? colors.primary : colors.muted,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {isSending ? (
          <ActivityIndicator size="small" color={colors.primaryForeground} />
        ) : (
          <Send
            size={20}
            color={messageText.trim() ? colors.primaryForeground : colors.mutedForeground}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}
