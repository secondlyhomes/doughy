/**
 * ClawSuggestionCard
 *
 * Shows AI-generated draft replies above the compose bar.
 * The Claw generates drafts → stored in claw.draft_messages →
 * subscribed via Supabase Realtime. For now, renders mock suggestions.
 */

import { View, TouchableOpacity } from 'react-native'
import { triggerImpact, triggerNotification } from '@/utils/haptics'
import * as Haptics from 'expo-haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { Text } from '@/components/Text'
import { GlassView } from '@/components/GlassView'

export interface ClawDraft {
  id: string
  contactId: string
  body: string
  createdAt: string
}

export interface ClawSuggestionCardProps {
  draft: ClawDraft
  onSend: (draft: ClawDraft) => void
  onEdit: (draft: ClawDraft) => void
  onDismiss: (draft: ClawDraft) => void
}

export function ClawSuggestionCard({ draft, onSend, onEdit, onDismiss }: ClawSuggestionCardProps) {
  const { theme } = useTheme()

  function handleSend() {
    triggerNotification(Haptics.NotificationFeedbackType.Success)
    onSend(draft)
  }

  function handleEdit() {
    triggerImpact(Haptics.ImpactFeedbackStyle.Light)
    onEdit(draft)
  }

  function handleDismiss() {
    triggerImpact(Haptics.ImpactFeedbackStyle.Light)
    onDismiss(draft)
  }

  return (
    <View style={{
      paddingHorizontal: theme.tokens.spacing[4],
      paddingBottom: theme.tokens.spacing[2],
    }}>
      <GlassView
        intensity="subtle"
        style={{
          borderRadius: theme.tokens.borderRadius.lg,
          overflow: 'hidden',
        }}
      >
        <View style={{
          flexDirection: 'row',
        }}>
          {/* Left accent strip */}
          <View style={{
            width: 3,
            backgroundColor: theme.colors.primary[500],
          }} />

          {/* Content */}
          <View style={{ flex: 1, padding: theme.tokens.spacing[3] }}>
            {/* Header row: branding + dismiss */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.tokens.spacing[2] }}>
              <Text variant="caption" weight="semibold" color={theme.colors.primary[500]}>
                {'\u2726'} The Claw
              </Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                onPress={handleDismiss}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Dismiss suggestion"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={16} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
            </View>

            {/* Draft text */}
            <Text
              variant="bodySmall"
              color={theme.colors.text.secondary}
              style={{ marginBottom: theme.tokens.spacing[3], fontStyle: 'italic' }}
            >
              {draft.body}
            </Text>

            {/* Actions: Edit (ghost) + Send (primary) */}
            <View style={{ flexDirection: 'row', gap: theme.tokens.spacing[2] }}>
              <TouchableOpacity
                onPress={handleEdit}
                accessibilityLabel="Edit suggested reply"
                accessibilityRole="button"
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  paddingVertical: theme.tokens.spacing[2],
                  borderRadius: theme.tokens.borderRadius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <Ionicons name="create-outline" size={14} color={theme.colors.text.secondary} />
                <Text variant="bodySmall" weight="semibold" color={theme.colors.text.secondary}>
                  Edit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSend}
                accessibilityLabel="Send suggested reply"
                accessibilityRole="button"
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  paddingVertical: theme.tokens.spacing[2],
                  borderRadius: theme.tokens.borderRadius.md,
                  backgroundColor: theme.colors.primary[500],
                }}
              >
                <Ionicons name="arrow-up" size={14} color={theme.tokens.colors.white} />
                <Text variant="bodySmall" weight="semibold" color={theme.tokens.colors.white}>
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </GlassView>
    </View>
  )
}
