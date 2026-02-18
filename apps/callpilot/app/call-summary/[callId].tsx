import { ScrollView, View, Alert, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { callpilotColors } from '@/theme/callpilotColors'
import { Text, Button, Card, SectionHeader, StatusBadge, EmptyState, GlassView } from '@/components'
import { ActionItemCard, SentimentBadge, CrmPushCard } from '@/components/summaries'
import { useMemos } from '@/hooks'
import type { ExtractionField, ExtractionGroup } from '@/types'

export default function CallSummaryScreen() {
  const { callId } = useLocalSearchParams<{ callId: string }>()
  const { theme } = useTheme()
  const router = useRouter()
  const { getSummaryForCall } = useMemos()

  const summary = getSummaryForCall(callId ?? '')

  if (!summary) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], paddingTop: theme.tokens.spacing[2] }}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Back" accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-back" size={28} color={theme.colors.primary[500]} />
          </TouchableOpacity>
        </View>
        <EmptyState
          icon={'\uD83D\uDCDD'}
          title="No Summary Yet"
          description="Record a voice memo after your call to generate an AI summary"
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    )
  }

  const formattedDate = new Date(summary.date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  // Mock extraction data — in production, loaded from claw.transcript_extractions
  const mockExtractionGroups: ExtractionGroup[] = summary ? [
    {
      label: 'Property: 123 Oak St',
      icon: '\uD83C\uDFE0',
      entityId: null,
      fields: [
        { field: 'mortgage_balance', value: 140000, confidence: 'high', sourceQuote: 'Yeah the mortgage is about 140 thousand', targetTable: 'investor.properties', targetColumn: 'mortgage_info', targetPath: 'first_mortgage.balance', currentValue: null, action: 'fill_empty' },
        { field: 'roof_repair_needed', value: 15000, confidence: 'high', sourceQuote: 'Roof needs about fifteen grand in work', targetTable: 'investor.properties', targetColumn: 'repair_estimate', targetPath: null, currentValue: null, action: 'fill_empty' },
        { field: 'timeline', value: '60 days', confidence: 'high', sourceQuote: 'I can wait about 60 days but not much longer', targetTable: 'crm.leads', targetColumn: 'timeline', targetPath: null, currentValue: null, action: 'fill_empty' },
      ],
    },
    {
      label: summary.contactName,
      icon: '\uD83D\uDC64',
      entityId: null,
      fields: [
        { field: 'motivation', value: 'Inherited from parents, property empty 6 months', confidence: 'high', sourceQuote: 'My parents passed and I inherited it, been sitting empty', targetTable: 'crm.leads', targetColumn: 'notes', targetPath: null, currentValue: 'Inherited property', action: 'overwrite' },
        { field: 'location', value: 'Lives in Texas', confidence: 'medium', sourceQuote: 'I am down in Texas', targetTable: 'crm.leads', targetColumn: 'mailing_address', targetPath: null, currentValue: null, action: 'fill_empty' },
      ],
    },
  ] : []

  // TODO: Wire to POST /api/calls/approve-actions
  function handleApproveField(field: ExtractionField) {
    Alert.alert('Coming Soon', `CRM push for "${field.field}" is not yet connected. This will work once the server API is wired.`)
  }

  function handleSkipField(_field: ExtractionField) {
    Alert.alert('Coming Soon', 'Skipping CRM fields is not yet connected.')
  }

  function handleApproveAllEmpty() {
    Alert.alert('Coming Soon', 'Bulk CRM push is not yet connected.')
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.tokens.spacing[8] }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], paddingTop: theme.tokens.spacing[2] }}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Back" accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-back" size={28} color={theme.colors.primary[500]} />
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], paddingTop: theme.tokens.spacing[3] }}>
          <Text variant="h2">{summary.contactName}</Text>
          <Text variant="bodySmall" color={theme.colors.text.secondary}>{formattedDate}</Text>
          <View style={{ marginTop: theme.tokens.spacing[2] }}>
            <SentimentBadge sentiment={summary.sentiment} />
          </View>
        </View>

        {/* Summary Bullets */}
        <View style={{ marginTop: theme.tokens.spacing[5] }}>
          <SectionHeader title="Summary" />
          <View style={{ paddingHorizontal: theme.tokens.spacing[4] }}>
            <GlassView intensity="subtle" style={{ padding: theme.tokens.spacing[4] }}>
              <View style={{ gap: theme.tokens.spacing[2] }}>
                {summary.bulletPoints.map((point, i) => (
                  <View key={i} style={{ flexDirection: 'row' }}>
                    <Text variant="body" style={{ marginRight: theme.tokens.spacing[2] }}>{'\u2022'}</Text>
                    <Text variant="body" color={theme.colors.text.secondary} style={{ flex: 1 }}>{point}</Text>
                  </View>
                ))}
              </View>
            </GlassView>
          </View>
        </View>

        {/* Action Items */}
        <View style={{ marginTop: theme.tokens.spacing[5] }}>
          <SectionHeader title={`Action Items (${summary.actionItems.length})`} />
          <View style={{ paddingHorizontal: theme.tokens.spacing[4] }}>
            {summary.actionItems.map((item) => (
              <ActionItemCard key={item.id} item={item} />
            ))}
          </View>
        </View>

        {/* Key Moments */}
        {summary.keyMoments.length > 0 && (
          <View style={{ marginTop: theme.tokens.spacing[5] }}>
            <SectionHeader title="Key Moments" />
            <View style={{ paddingHorizontal: theme.tokens.spacing[4], gap: theme.tokens.spacing[3] }}>
              {summary.keyMoments.map((moment) => (
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
        )}

        {/* Next Steps */}
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[5] }}>
          <SectionHeader title="Next Steps" style={{ paddingHorizontal: 0 }} />
          <Card variant="filled" padding="md">
            <Text variant="body" color={theme.colors.text.secondary}>{summary.nextStep}</Text>
            <Text variant="caption" color={theme.colors.text.tertiary} style={{ marginTop: theme.tokens.spacing[2] }}>
              Follow up: {new Date(summary.followUpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </Card>
        </View>

        {/* Push to CRM — Extraction Approval */}
        {!summary.crmSynced && mockExtractionGroups.length > 0 && (
          <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[5] }}>
            <CrmPushCard
              groups={mockExtractionGroups}
              onApproveField={handleApproveField}
              onSkipField={handleSkipField}
              onApproveAllEmpty={handleApproveAllEmpty}
            />
          </View>
        )}

        {summary.crmSynced && (
          <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[5] }}>
            <Button
              title="Synced to CRM"
              onPress={() => {}}
              variant="secondary"
              size="lg"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
