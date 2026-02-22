/**
 * MessageComposer
 *
 * Inline compose bar matching Doughy's chat input pattern.
 * Rounded input field + circular send button, sits at the bottom
 * of the conversation screen inside KeyboardAvoidingView.
 */

import { useState } from 'react'
import { View, TextInput, TouchableOpacity, Alert, Keyboard } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { triggerImpact } from '@/utils/haptics'
import { ImpactFeedbackStyle } from 'expo-haptics'
import { useTheme } from '@/theme'

export interface MessageComposerProps {
  contactName: string
  bottomInset?: number
  onSend?: (content: string) => void
  isSending?: boolean
}

export function MessageComposer({ contactName, bottomInset = 0, onSend, isSending = false }: MessageComposerProps) {
  const { theme, isDark } = useTheme()
  const [message, setMessage] = useState('')

  const canSend = message.trim().length > 0 && !isSending

  function handleSend() {
    const trimmed = message.trim()
    if (!trimmed || isSending) return

    triggerImpact(ImpactFeedbackStyle.Light)
    Keyboard.dismiss()

    if (onSend) {
      const saved = trimmed
      setMessage('')
      try {
        onSend(saved)
      } catch {
        setMessage(saved)
      }
    } else {
      Alert.alert('Coming Soon', `Messaging ${contactName} is coming soon.`)
    }
  }

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: theme.tokens.spacing[3],
      paddingVertical: theme.tokens.spacing[2],
      paddingBottom: bottomInset + theme.tokens.spacing[2],
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    }}>
      <View style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: isDark ? theme.colors.surfaceSecondary : theme.colors.neutral[100],
        borderRadius: theme.tokens.borderRadius.xl,
        paddingHorizontal: theme.tokens.spacing[3],
        paddingVertical: theme.tokens.spacing[2],
        marginRight: theme.tokens.spacing[2],
      }}>
        <TextInput
          style={{
            flex: 1,
            color: theme.colors.text.primary,
            fontSize: theme.tokens.fontSize.base,
            maxHeight: 100,
            paddingVertical: 0,
          }}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.text.tertiary}
          multiline
          editable={!isSending}
          keyboardAppearance={isDark ? 'dark' : 'light'}
        />
      </View>

      <TouchableOpacity
        onPress={handleSend}
        disabled={!canSend}
        accessibilityLabel="Send message"
        accessibilityRole="button"
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: canSend ? theme.colors.primary[500] : (isDark ? theme.colors.surfaceSecondary : theme.colors.neutral[200]),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons
          name="send"
          size={18}
          color={canSend ? theme.colors.text.inverse : theme.colors.text.tertiary}
        />
      </TouchableOpacity>
    </View>
  )
}
