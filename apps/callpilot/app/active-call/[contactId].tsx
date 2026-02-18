/**
 * Active Call Screen — Coaching Dashboard
 *
 * Shows real-time coaching hints, key facts, and suggestions
 * during an active call. On end call, routes to call-summary
 * if a summary exists, or record-memo as fallback.
 */

import { useState, useEffect } from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { triggerNotification } from '@/utils/haptics'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { GlassView } from '@/components/GlassView'
import { SkeletonBox } from '@/components/SkeletonLoader'
import { useContacts, useCalls, useMemos, useCallCoaching } from '@/hooks'
import {
  CompactCallHeader,
  CoachingTabBar,
  ApproachTab,
  KeyFactsTab,
  SuggestionsTab,
  CallControlBar,
} from '@/components/coaching'
import type { CoachingTab } from '@/components/coaching'

export default function ActiveCallScreen() {
  const { contactId } = useLocalSearchParams<{ contactId: string }>()
  const { theme } = useTheme()
  const router = useRouter()
  const { getContact } = useContacts()
  const { getCallsForContact } = useCalls()
  const { getSummaryForCall } = useMemos()
  const { coaching, isLoading, markSuggestionUsed } = useCallCoaching(contactId ?? '')

  const [duration, setDuration] = useState(0)
  const [activeTab, setActiveTab] = useState<CoachingTab>('approach')

  const contact = getContact(contactId ?? '')
  const contactCalls = getCallsForContact(contactId ?? '')
  const firstCall = contactCalls.length > 0 ? contactCalls[0] : undefined
  const callId = firstCall?.id ?? 'call-1'

  const displayName = contact
    ? `${contact.firstName} ${contact.lastName}`
    : 'Unknown Contact'
  const displayCompany = contact?.company ?? ''

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((d) => d + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  function handleEndCall(): void {
    triggerNotification(Haptics.NotificationFeedbackType.Success)
    const summary = getSummaryForCall(callId)
    if (summary) {
      router.replace({ pathname: '/call-summary/[callId]', params: { callId } })
    } else {
      router.replace({ pathname: '/record-memo/[callId]', params: { callId } })
    }
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.neutral[900] }}
    >
      {/* Compact header */}
      <View style={{ paddingHorizontal: theme.tokens.spacing[4], paddingTop: theme.tokens.spacing[2] }}>
        <CompactCallHeader
          contactName={displayName}
          company={displayCompany}
          duration={duration}
          isConnected
        />
      </View>

      {/* Tab bar */}
      <CoachingTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.tokens.spacing[4],
          paddingBottom: theme.tokens.spacing[8],
        }}
      >
        <GlassView
          intensity="subtle"
          style={{
            padding: theme.tokens.spacing[4],
          }}
        >
          {isLoading || !coaching ? (
            <View style={{ gap: theme.tokens.spacing[3], marginTop: theme.tokens.spacing[4] }}>
              <SkeletonBox width="80%" height={20} />
              <SkeletonBox width="100%" height={60} />
              <SkeletonBox width="60%" height={16} />
              <SkeletonBox width="100%" height={60} />
            </View>
          ) : (
            <>
              {activeTab === 'approach' && <ApproachTab coaching={coaching} />}
              {activeTab === 'facts' && <KeyFactsTab coaching={coaching} />}
              {activeTab === 'suggestions' && (
                <SuggestionsTab
                  suggestions={coaching.suggestions}
                  onMarkUsed={markSuggestionUsed}
                />
              )}
            </>
          )}
        </GlassView>
      </ScrollView>

      {/* Fixed bottom controls */}
      <CallControlBar onEndCall={handleEndCall} />
    </SafeAreaView>
  )
}
