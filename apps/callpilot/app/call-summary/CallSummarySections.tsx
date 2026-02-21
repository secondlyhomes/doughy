/**
 * Call Summary — Section Components
 *
 * Extracted UI sections: loading, empty state, header, summary bullets,
 * action items, key moments, next steps, and CRM push.
 */

import { View, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { callpilotColors } from '@/theme/callpilotColors'
import { Text, Button, Card, SectionHeader, StatusBadge, GlassView } from '@/components'
import { ActionItemCard, SentimentBadge, CrmPushCard } from '@/components/summaries'
import type { ExtractionField, ExtractionGroup, CallSummary } from '@/types'
import { formatDuration } from './call-summary-helpers'

interface SummaryLoadingProps {
  onBack: () => void
}

export function SummaryLoading({ onBack }: SummaryLoadingProps) {
  const { theme } = useTheme()
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ paddingHorizontal: theme.tokens.spacing[4], paddingTop: theme.tokens.spacing[2] }}>
        <TouchableOpacity onPress={onBack} accessibilityLabel="Back" accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary[500]} />
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Text variant="bodySmall" color={theme.colors.text.tertiary} style={{ marginTop: theme.tokens.spacing[2] }}>
          Generating summary...
        </Text>
      </View>
    </SafeAreaView>
  )
}

interface SummaryEmptyProps {
  onBack: () => void
  onDone: () => void
}

export function SummaryEmpty({ onBack, onDone }: SummaryEmptyProps) {
  const { theme } = useTheme()
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ paddingHorizontal: theme.tokens.spacing[4], paddingTop: theme.tokens.spacing[2] }}>
        <TouchableOpacity onPress={onBack} accessibilityLabel="Back" accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary[500]} />
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: theme.tokens.spacing[6] }}>
        <Text variant="h3" style={{ textAlign: 'center' }}>No Summary Available</Text>
        <Text variant="body" color={theme.colors.text.secondary} style={{ textAlign: 'center', marginTop: theme.tokens.spacing[2] }}>
          Summary will be available after the call is processed.
        </Text>
        <View style={{ width: '100%', marginTop: theme.tokens.spacing[6] }}>
          <Button title="Done" onPress={onDone} size="lg" />
        </View>
      </View>
    </SafeAreaView>
  )
}

interface SummaryHeaderProps {
  summary: CallSummary
}

export function SummaryHeader({ summary }: SummaryHeaderProps) {
  const { theme } = useTheme()
  const formattedDate = new Date(summary.date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <View style={{ paddingHorizontal: theme.tokens.spacing[4], paddingTop: theme.tokens.spacing[3] }}>
      <Text variant="h2">{summary.contactName}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[2], marginTop: theme.tokens.spacing[1] }}>
        <Text variant="bodySmall" color={theme.colors.text.secondary}>{formattedDate}</Text>
        <Text variant="bodySmall" color={theme.colors.text.tertiary}>{'\u00B7'}</Text>
        <Text variant="bodySmall" color={theme.colors.text.secondary}>{formatDuration(summary.duration)}</Text>
      </View>
      <View style={{ marginTop: theme.tokens.spacing[2] }}>
        <SentimentBadge sentiment={summary.sentiment} />
      </View>
    </View>
  )
}

interface SummaryBulletsProps {
  bulletPoints: string[]
}

export function SummaryBullets({ bulletPoints }: SummaryBulletsProps) {
  const { theme } = useTheme()
  return (
    <View style={{ marginTop: theme.tokens.spacing[5] }}>
      <SectionHeader title="Summary" />
      <View style={{ paddingHorizontal: theme.tokens.spacing[4] }}>
        <GlassView intensity="subtle" style={{ padding: theme.tokens.spacing[4] }}>
          <View style={{ gap: theme.tokens.spacing[2] }}>
            {bulletPoints.map((point, i) => (
              <View key={i} style={{ flexDirection: 'row' }}>
                <Text variant="body" style={{ marginRight: theme.tokens.spacing[2] }}>{'\u2022'}</Text>
                <Text variant="body" color={theme.colors.text.secondary} style={{ flex: 1 }}>{point}</Text>
              </View>
            ))}
          </View>
        </GlassView>
      </View>
    </View>
  )
}

interface ActionItemsSectionProps {
  actionItems: CallSummary['actionItems']
}

export function ActionItemsSection({ actionItems }: ActionItemsSectionProps) {
  const { theme } = useTheme()
  return (
    <View style={{ marginTop: theme.tokens.spacing[5] }}>
      <SectionHeader title={`Action Items (${actionItems.length})`} />
      <View style={{ paddingHorizontal: theme.tokens.spacing[4] }}>
        {actionItems.map((item) => (
          <ActionItemCard key={item.id} item={item} />
        ))}
      </View>
    </View>
  )
}

interface KeyMomentsSectionProps {
  keyMoments: CallSummary['keyMoments']
}

export function KeyMomentsSection({ keyMoments }: KeyMomentsSectionProps) {
  const { theme } = useTheme()
  if (keyMoments.length === 0) return null
  return (
    <View style={{ marginTop: theme.tokens.spacing[5] }}>
      <SectionHeader title="Key Moments" />
      <View style={{ paddingHorizontal: theme.tokens.spacing[4], gap: theme.tokens.spacing[3] }}>
        {keyMoments.map((moment) => (
          <View key={moment.id} style={{ flexDirection: 'row', gap: theme.tokens.spacing[3] }}>
            <Text variant="caption" style={{ fontVariant: ['tabular-nums'], minWidth: 48 }}>
              {moment.timestamp}
            </Text>
            <View style={{ flex: 1 }}>
              <StatusBadge
                label={moment.type}
                color={callpilotColors.moment[moment.type]}
                backgroundColor={callpilotColors.moment[moment.type] + '20'}
                size="sm"
                style={{ marginBottom: theme.tokens.spacing[1] }}
              />
              <Text variant="bodySmall" color={theme.colors.text.secondary}>{moment.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

interface NextStepsSectionProps {
  nextStep: string
  followUpDate: string
}

export function NextStepsSection({ nextStep, followUpDate }: NextStepsSectionProps) {
  const { theme } = useTheme()
  return (
    <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[5] }}>
      <SectionHeader title="Next Steps" style={{ paddingHorizontal: 0 }} />
      <Card variant="filled" padding="md">
        <Text variant="body" color={theme.colors.text.secondary}>{nextStep}</Text>
        <Text variant="caption" color={theme.colors.text.tertiary} style={{ marginTop: theme.tokens.spacing[2] }}>
          Follow up: {new Date(followUpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
      </Card>
    </View>
  )
}

interface CrmPushSectionProps {
  crmSynced: boolean
  crmLoading: boolean
  crmError: string | null
  extractionGroups: ExtractionGroup[]
  onApproveField: (field: ExtractionField) => void
  onSkipField: (field: ExtractionField) => void
  onApproveAllEmpty: () => void
}

export function CrmPushSection({
  crmSynced,
  crmLoading,
  crmError,
  extractionGroups,
  onApproveField,
  onSkipField,
  onApproveAllEmpty,
}: CrmPushSectionProps) {
  const { theme } = useTheme()

  if (crmSynced) {
    return (
      <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[5] }}>
        <Card variant="filled" padding="md" style={{ alignItems: 'center' }}>
          <Ionicons name="checkmark-circle" size={24} color={theme.colors.success[500]} />
          <Text variant="body" weight="semibold" color={theme.colors.success[600]} style={{ marginTop: theme.tokens.spacing[1] }}>
            Pushed to Doughy
          </Text>
        </Card>
      </View>
    )
  }

  return (
    <>
      {crmLoading && (
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[5], alignItems: 'center' }}>
          <ActivityIndicator size="small" color={theme.colors.primary[500]} />
        </View>
      )}
      {!crmLoading && crmError && (
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[5] }}>
          <Card variant="filled" padding="md">
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              Could not load CRM suggestions. They may become available when you revisit this summary.
            </Text>
          </Card>
        </View>
      )}
      {!crmLoading && extractionGroups.length > 0 && (
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[5] }}>
          <SectionHeader title="Push to Doughy" style={{ paddingHorizontal: 0 }} />
          <CrmPushCard
            groups={extractionGroups}
            onApproveField={onApproveField}
            onSkipField={onSkipField}
            onApproveAllEmpty={onApproveAllEmpty}
          />
        </View>
      )}
    </>
  )
}
