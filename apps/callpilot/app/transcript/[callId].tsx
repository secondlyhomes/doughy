/**
 * Transcript Viewer Screen
 *
 * Full scrollable call transcript with speaker labels.
 * Accessed from Contact Detail → Call History → tap call → View Transcript.
 */

import { useMemo } from 'react'
import { View, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { Text, EmptyState } from '@/components'
import type { TranscriptLine } from '@/types'

// Mock transcript — in production, loaded from callpilot.calls.full_transcript
const MOCK_TRANSCRIPT: TranscriptLine[] = [
  { speaker: 'user', text: "Hey Mike, it's Dino from Secondly Homes. Thanks for taking my call.", timestamp: 0 },
  { speaker: 'lead', text: "Hey Dino, thanks for calling back. I've been meaning to reach out.", timestamp: 5 },
  { speaker: 'user', text: "Of course. So tell me about the property on Oak St — you mentioned your parents left it to you?", timestamp: 12 },
  { speaker: 'lead', text: "Yeah, my parents passed about a year ago and I inherited it. It's been sitting empty for about 6 months now. I live down in Texas so I can't really manage it.", timestamp: 18 },
  { speaker: 'user', text: "I'm sorry to hear about your parents. That's a tough situation. So the property's been vacant — any maintenance issues you're aware of?", timestamp: 32 },
  { speaker: 'lead', text: "The roof needs work, probably about fifteen grand in repairs. And the kitchen is pretty dated. Otherwise it's in okay shape.", timestamp: 40 },
  { speaker: 'user', text: "Got it. And do you have a mortgage on it or is it free and clear?", timestamp: 52 },
  { speaker: 'lead', text: "Yeah the mortgage is about 140 thousand. Monthly payment is around eleven hundred.", timestamp: 58 },
  { speaker: 'user', text: "Okay, and what are you hoping to get for it?", timestamp: 65 },
  { speaker: 'lead', text: "Honestly I just want to be done with it. Zillow says it's worth like 220 but I know it needs work. I'd take 180 probably.", timestamp: 70 },
  { speaker: 'user', text: "I appreciate you being upfront. Let me run some numbers. With the repairs and holding costs, I could probably do $175k cash and close in about 3 weeks. How does that sound?", timestamp: 82 },
  { speaker: 'lead', text: "That's close. Let me talk to my sister first — she's on the deed too. Can you send me the comps you mentioned?", timestamp: 95 },
  { speaker: 'user', text: "Absolutely, I'll send those over today. And I can wait about 60 days but not much longer on this one. Take your time with your sister though.", timestamp: 105 },
  { speaker: 'lead', text: "Sounds good. I'll get back to you by Thursday.", timestamp: 115 },
  { speaker: 'user', text: "Perfect. Talk soon Mike. Take care.", timestamp: 120 },
]

const SPEAKER_LABELS: Record<string, string> = {
  user: 'You',
  lead: 'Lead',
  ai_bland: 'AI Call',
}

export default function TranscriptScreen() {
  const { callId } = useLocalSearchParams<{ callId: string }>()
  const { theme } = useTheme()
  const router = useRouter()

  // In production, fetch from callpilot.transcript_chunks or callpilot.calls.full_transcript
  const transcript = MOCK_TRANSCRIPT

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

      {transcript.length === 0 ? (
        <EmptyState
          icon="document-text"
          title="No Transcript"
          description="Transcript will be available after the call is processed."
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
