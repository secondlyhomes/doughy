import { useState, useEffect, useCallback, useRef } from 'react'
import { ScrollView, View, Alert, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { triggerImpact } from '@/utils/haptics'
import { ImpactFeedbackStyle } from 'expo-haptics'
import { useTheme } from '@/theme'
import { callpilotColors } from '@/theme/callpilotColors'
import { Text, Button, Card, SectionHeader, StatusBadge, EmptyState, GlassView } from '@/components'
import { ActionItemCard, SentimentBadge, CrmPushCard } from '@/components/summaries'
import { useMemos } from '@/hooks'
import { getSuggestedUpdates, approveUpdates } from '@/services/callsService'
import type { SuggestedUpdate } from '@/services/callsService'
import { isMockMode } from '@/services/supabaseClient'
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

  // CRM push state
  const [extractionGroups, setExtractionGroups] = useState<ExtractionGroup[]>([])
  const [rawUpdates, setRawUpdates] = useState<SuggestedUpdate[]>([])
  const rawUpdatesRef = useRef(rawUpdates)
  rawUpdatesRef.current = rawUpdates
  const [crmLoading, setCrmLoading] = useState(!isMockMode)
  const [crmSynced, setCrmSynced] = useState(summary.crmSynced)
  const [crmError, setCrmError] = useState<string | null>(null)

  useEffect(() => {
    if (!callId || isMockMode) {
      setCrmLoading(false)
      return
    }
    let cancelled = false
    async function load() {
      try {
        const updates = await getSuggestedUpdates(callId!)
        if (cancelled) return
        setRawUpdates(updates)
        // Group updates by target_table for display
        const groupMap = new Map<string, { fields: ExtractionField[]; table: string }>()
        for (const u of updates) {
          const key = u.target_table || 'Other'
          if (!groupMap.has(key)) groupMap.set(key, { fields: [], table: key })
          groupMap.get(key)!.fields.push({
            field: u.field_name,
            value: u.suggested_value,
            confidence: (u.confidence === 'high' || u.confidence === 'medium' || u.confidence === 'low')
              ? u.confidence
              : 'medium',
            sourceQuote: u.source_quote || '',
            targetTable: u.target_table,
            targetColumn: u.field_name,
            targetPath: null,
            currentValue: u.current_value ?? null,
            action: (u.current_value !== null && u.current_value !== undefined) ? 'overwrite' : 'fill_empty',
          })
        }
        const groups: ExtractionGroup[] = Array.from(groupMap.entries()).map(([table, data]) => ({
          label: table.includes('properties') ? 'Property' : table.includes('leads') ? (summary?.contactName ?? 'Contact') : table,
          icon: table.includes('properties') ? '\uD83C\uDFE0' : '\uD83D\uDC64',
          entityId: null,
          fields: data.fields,
        }))
        setExtractionGroups(groups)
      } catch (err) {
        console.error('[CallSummary] getSuggestedUpdates failed:', err)
        if (!cancelled) setCrmError(err instanceof Error ? err.message : 'Failed to load CRM suggestions')
      } finally {
        if (!cancelled) setCrmLoading(false)
      }
    }
    load().catch(() => {})
    return () => { cancelled = true }
  }, [callId, summary?.contactName])

  const handleApproveField = useCallback(async (field: ExtractionField) => {
    if (!callId) return
    const update = rawUpdatesRef.current.find((u) => u.field_name === field.field)
    if (!update) return
    try {
      await approveUpdates(callId, [update.id])
      triggerImpact(ImpactFeedbackStyle.Medium)
      setRawUpdates((prev) => prev.filter((u) => u.id !== update.id))
      setExtractionGroups((prev) =>
        prev.map((g) => ({ ...g, fields: g.fields.filter((f) => f.field !== field.field) }))
          .filter((g) => g.fields.length > 0)
      )
    } catch (err) {
      Alert.alert('Push Failed', err instanceof Error ? err.message : 'Could not push to CRM.')
    }
  }, [callId])

  const handleSkipField = useCallback((_field: ExtractionField) => {
    setExtractionGroups((prev) =>
      prev.map((g) => ({ ...g, fields: g.fields.filter((f) => f.field !== _field.field) }))
        .filter((g) => g.fields.length > 0)
    )
  }, [])

  const handleApproveAllEmpty = useCallback(async () => {
    if (!callId) return
    const pendingIds = rawUpdatesRef.current.filter((u) => u.status !== 'approved').map((u) => u.id)
    if (pendingIds.length === 0) return
    try {
      await approveUpdates(callId, pendingIds)
      triggerImpact(ImpactFeedbackStyle.Heavy)
      setCrmSynced(true)
      setExtractionGroups([])
      setRawUpdates([])
    } catch (err) {
      Alert.alert('Push Failed', err instanceof Error ? err.message : 'Could not push to CRM.')
    }
  }, [callId])

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
        {!crmSynced && crmLoading && (
          <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[5], alignItems: 'center' }}>
            <ActivityIndicator size="small" color={theme.colors.primary[500]} />
          </View>
        )}
        {!crmSynced && !crmLoading && crmError && (
          <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[5] }}>
            <Card variant="filled" padding="md">
              <Text variant="bodySmall" color={theme.colors.text.secondary}>
                Could not load CRM suggestions. They may become available when you revisit this summary.
              </Text>
            </Card>
          </View>
        )}
        {!crmSynced && !crmLoading && extractionGroups.length > 0 && (
          <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[5] }}>
            <CrmPushCard
              groups={extractionGroups}
              onApproveField={handleApproveField}
              onSkipField={handleSkipField}
              onApproveAllEmpty={handleApproveAllEmpty}
            />
          </View>
        )}

        {crmSynced && (
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
