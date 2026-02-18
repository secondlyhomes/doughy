/**
 * Transcript Viewer Screen
 *
 * Full scrollable call transcript with speaker labels.
 * Accessed from Contact Detail → Call History → tap call → View Transcript.
 */

import { useState, useEffect, useMemo } from 'react'
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { Text, EmptyState } from '@/components'
import { getTranscript } from '@/services/callsService'
import { isMockMode } from '@/services/supabaseClient'
import type { TranscriptLine } from '@/types'

const SPEAKER_LABELS: Record<string, string> = {
  user: 'You',
  lead: 'Lead',
  ai_bland: 'AI Call',
}

export default function TranscriptScreen() {
  const { callId } = useLocalSearchParams<{ callId: string }>()
  const { theme } = useTheme()
  const router = useRouter()

  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!callId) {
      setIsLoading(false)
      return
    }
    if (isMockMode) {
      setIsLoading(false)
      setError('Transcripts are not available in offline mode.')
      return
    }
    let cancelled = false
    async function load() {
      try {
        const lines = await getTranscript(callId!)
        if (!cancelled) setTranscript(lines)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load transcript')
          if (__DEV__) console.warn('[TranscriptScreen] load failed:', err)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load().catch(() => {})
    return () => { cancelled = true }
  }, [callId])

  const formattedLines = useMemo(() => {
    return transcript.map((line, i) => ({
      ...line,
      key: `${callId}-${i}`,
      label: SPEAKER_LABELS[line.speaker] ?? line.speaker,
    }))
  }, [transcript, callId])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        paddingHorizontal: theme.tokens.spacing[2],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Back"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ paddingHorizontal: theme.tokens.spacing[1] }}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary[500]} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text variant="body" weight="semibold">Call Transcript</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text variant="bodySmall" color={theme.colors.text.tertiary} style={{ marginTop: theme.tokens.spacing[2] }}>
            Loading transcript...
          </Text>
        </View>
      ) : transcript.length === 0 ? (
        <EmptyState
          icon="document-text"
          title={error ? 'Transcript Unavailable' : 'No Transcript'}
          description={error || 'Transcript will be available after the call is processed.'}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: theme.tokens.spacing[4],
            paddingBottom: theme.tokens.spacing[8],
          }}
          showsVerticalScrollIndicator={false}
        >
          {formattedLines.map((line) => {
            const isUser = line.speaker === 'user'
            return (
              <View
                key={line.key}
                style={{ marginBottom: theme.tokens.spacing[3] }}
              >
                <Text
                  variant="caption"
                  weight="semibold"
                  color={isUser ? theme.colors.primary[500] : theme.colors.info[500]}
                  style={{ marginBottom: 2 }}
                >
                  [{line.label}]
                </Text>
                <Text
                  variant="body"
                  color={theme.colors.text.primary}
                  style={{ lineHeight: theme.tokens.fontSize.base * 1.5 }}
                >
                  {line.text}
                </Text>
              </View>
            )
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
