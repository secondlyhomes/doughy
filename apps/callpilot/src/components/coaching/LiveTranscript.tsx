/**
 * LiveTranscript
 *
 * Shows transcript lines appearing in real-time during a call.
 * Each line shows speaker label, timestamp, and text.
 */

import { useRef, useEffect } from 'react'
import { View, ScrollView } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import type { TranscriptLine } from '@/hooks/useMockCallSimulation'

export interface LiveTranscriptProps {
  lines: TranscriptLine[]
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function LiveTranscript({ lines }: LiveTranscriptProps) {
  const { theme } = useTheme()
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    // Auto-scroll to bottom when new lines appear
    if (scrollRef.current && lines.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [lines.length])

  if (lines.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: theme.tokens.spacing[6] }}>
        <Text variant="bodySmall" color={theme.colors.text.tertiary}>
          Waiting for conversation...
        </Text>
      </View>
    )
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: theme.tokens.spacing[3] }}
      showsVerticalScrollIndicator={false}
    >
      {lines.map(line => (
        <View key={line.id} style={{ flexDirection: 'row', gap: theme.tokens.spacing[2] }}>
          {/* Timestamp */}
          <Text
            variant="caption"
            color={theme.colors.text.tertiary}
            style={{ width: 36, flexShrink: 0, paddingTop: 2 }}
          >
            {formatTimestamp(line.timestamp)}
          </Text>

          {/* Speaker + text */}
          <View style={{ flex: 1 }}>
            <Text
              variant="caption"
              weight="semibold"
              color={line.speaker === 'user' ? theme.colors.primary[500] : theme.colors.text.secondary}
            >
              {line.speaker === 'user' ? 'You' : 'Contact'}
            </Text>
            <Text variant="bodySmall" color={theme.colors.text.primary}>
              {line.text}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  )
}
