/**
 * Call Summary Screen
 *
 * Shows post-call summary with bullet points, action items, key moments,
 * and CRM push cards. For mock calls, generates a summary from the
 * mock transcript and extracted data.
 */

import { ScrollView, View, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { Button } from '@/components'
import { useCallSummary } from './useCallSummary'
import {
  SummaryLoading,
  SummaryEmpty,
  SummaryHeader,
  SummaryBullets,
  ActionItemsSection,
  KeyMomentsSection,
  NextStepsSection,
  CrmPushSection,
} from './CallSummarySections'

export default function CallSummaryScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const {
    summary,
    summaryLoading,
    memosLoading,
    extractionGroups,
    crmLoading,
    crmSynced,
    crmError,
    handleApproveField,
    handleSkipField,
    handleApproveAllEmpty,
    handleDone,
  } = useCallSummary()

  if (summaryLoading || memosLoading) {
    return <SummaryLoading onBack={() => router.back()} />
  }

  if (!summary) {
    return <SummaryEmpty onBack={() => router.back()} onDone={handleDone} />
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.tokens.spacing[8] }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], paddingTop: theme.tokens.spacing[2] }}>
          <TouchableOpacity onPress={handleDone} accessibilityLabel="Done" accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-back" size={28} color={theme.colors.primary[500]} />
          </TouchableOpacity>
        </View>

        <SummaryHeader summary={summary} />
        <SummaryBullets bulletPoints={summary.bulletPoints} />
        <ActionItemsSection actionItems={summary.actionItems} />
        <KeyMomentsSection keyMoments={summary.keyMoments} />
        <NextStepsSection nextStep={summary.nextStep} followUpDate={summary.followUpDate} />

        <CrmPushSection
          crmSynced={crmSynced}
          crmLoading={crmLoading}
          crmError={crmError}
          extractionGroups={extractionGroups}
          onApproveField={handleApproveField}
          onSkipField={handleSkipField}
          onApproveAllEmpty={handleApproveAllEmpty}
        />

        {/* Done Button */}
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[6] }}>
          <Button title="Done" onPress={handleDone} size="lg" />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
