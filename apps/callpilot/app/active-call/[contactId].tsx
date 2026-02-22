/**
 * Active Call Screen — Unified Stream
 *
 * Single stream where transcript lines and AI suggestions flow together
 * chronologically. Suggestions appear inline after the transcript lines
 * that triggered them. Filter bar toggles what's visible.
 */

import { useState, useEffect } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { triggerNotification } from '@/utils/haptics'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { useContacts } from '@/hooks'
import { useCallStream } from '@/hooks/useCallStream'
import {
  CompactCallHeader,
  CallControlBar,
  StreamFilterBar,
  UnifiedCallStream,
  MinimalCallView,
} from '@/components/coaching'
import { setMockCallResult } from '@/services/mockCallStore'

export default function ActiveCallScreen() {
  const { contactId } = useLocalSearchParams<{ contactId: string }>()
  const { theme } = useTheme()
  const router = useRouter()
  const { getContact } = useContacts()

  const {
    stream,
    filteredStream,
    filter,
    setFilter,
    isSimulating,
    dismissSuggestion,
    extractedData,
    counts,
  } = useCallStream(true, 3000)

  const [duration, setDuration] = useState(0)

  const contact = getContact(contactId ?? '')
  const displayName = contact
    ? `${contact.firstName} ${contact.lastName}`
    : 'Unknown Contact'
  const displayCompany = contact?.company ?? ''

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(d => d + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  function handleEndCall(): void {
    triggerNotification(Haptics.NotificationFeedbackType.Success)

    const mockCallId = `mock-call-${contactId}`
    // Build transcript from FULL stream (not filtered) for summary screen
    const transcript = stream
      .filter((i): i is import('@/types/callStream').TranscriptStreamItem => i.type === 'transcript')
      .map(i => ({
        id: i.id,
        speaker: i.speaker,
        text: i.text,
        timestamp: i.timestamp,
      }))

    setMockCallResult(mockCallId, {
      contactId: contactId ?? '',
      contactName: displayName,
      duration,
      transcript,
      extractedData,
    })

    router.replace({
      pathname: '/call-summary/[callId]',
      params: { callId: mockCallId, contactId: contactId ?? '' },
    })
  }

  const emptyMessage =
    filter === 'suggestions'
      ? 'AI coaching will appear as the conversation progresses'
      : 'Waiting for conversation...'

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.neutral[900] }}
    >
      <View
        style={{
          paddingHorizontal: theme.tokens.spacing[4],
          paddingTop: theme.tokens.spacing[2],
        }}
      >
        <CompactCallHeader
          contactName={displayName}
          company={displayCompany}
          duration={duration}
          isConnected
        />
      </View>

      <StreamFilterBar
        filter={filter}
        onFilterChange={setFilter}
        activeSuggestionCount={counts.active}
      />

      {filter === 'minimal' ? (
        <MinimalCallView
          duration={duration}
          activeSuggestionCount={counts.active}
          onShowSuggestions={() => setFilter('all')}
        />
      ) : (
        <UnifiedCallStream
          items={filteredStream}
          onDismissSuggestion={dismissSuggestion}
          emptyMessage={emptyMessage}
        />
      )}

      {/* Recording indicator */}
      {filter !== 'minimal' && isSimulating && (
        <View
          style={{
            alignItems: 'center',
            paddingBottom: theme.tokens.spacing[1],
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.tokens.spacing[2],
              paddingVertical: theme.tokens.spacing[1],
              paddingHorizontal: theme.tokens.spacing[3],
              borderRadius: theme.tokens.borderRadius.full,
              backgroundColor: theme.colors.neutral[800],
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.colors.success[500],
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.colors.primary[400],
                }}
              />
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.colors.neutral[600],
                }}
              />
            </View>
          </View>
        </View>
      )}

      <CallControlBar onEndCall={handleEndCall} />
    </SafeAreaView>
  )
}
