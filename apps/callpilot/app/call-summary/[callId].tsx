/**
 * Call Summary Screen
 *
 * Shows post-call summary with bullet points, action items, key moments,
 * and CRM push cards. For mock calls, generates a summary from the
 * mock transcript and extracted data.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { ScrollView, View, Alert, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { triggerImpact } from '@/utils/haptics'
import { ImpactFeedbackStyle } from 'expo-haptics'
import { useTheme } from '@/theme'
import { callpilotColors } from '@/theme/callpilotColors'
import { Text, Button, Card, SectionHeader, StatusBadge, GlassView } from '@/components'
import { ActionItemCard, SentimentBadge, CrmPushCard } from '@/components/summaries'
import { useMemos } from '@/hooks'
import { getSuggestedUpdates, approveUpdates } from '@/services/callsService'
import type { SuggestedUpdate } from '@/services/callsService'
import { isMockMode } from '@/services/supabaseClient'
import { getMockCallResult, clearMockCallResult } from '@/services/mockCallStore'
import type { ExtractionField, ExtractionGroup, CallSummary } from '@/types'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function generateMockSummary(callId: string, contactId: string, contactName: string, duration: number, extractedData: any): CallSummary {
  const now = new Date().toISOString()
  const followUp = new Date(Date.now() + 3 * 86400000).toISOString()

  return {
    id: `summary-${callId}`,
    callId,
    contactId,
    contactName,
    date: now,
    duration,
    summaryText: `Call with ${contactName} lasted ${formatDuration(duration)}. Discussed the property at ${extractedData.property.address}. ${extractedData.deal.motivation}. Seller is asking $${extractedData.deal.askingPrice.toLocaleString()} and is ${extractedData.deal.sellerFlexibility.toLowerCase()}.`,
    bulletPoints: [
      `Property: ${extractedData.property.bedrooms}BR/${extractedData.property.bathrooms}BA, ${extractedData.property.sqft} sqft, built ${extractedData.property.yearBuilt}`,
      `Condition: ${extractedData.property.condition} — ${extractedData.property.repairs.join(', ')}`,
      `Asking price: $${extractedData.deal.askingPrice.toLocaleString()} (${extractedData.deal.sellerFlexibility})`,
      `Timeline: ${extractedData.deal.timeline}`,
      `Motivation: ${extractedData.deal.motivation}`,
    ],
    sentiment: 'positive',
    actionItems: extractedData.suggestedActions.map((a: any, i: number) => ({
      id: `action-mock-${i}`,
      text: a.action,
      completed: false,
      dueDate: followUp,
    })),
    keyMoments: [
      { id: 'km-mock-1', timestamp: '00:00:30', description: `${contactName} confirmed property ownership`, type: 'commitment' as const },
      { id: 'km-mock-2', timestamp: formatDuration(Math.floor(duration * 0.4)), description: `Shared property details and repair needs`, type: 'interest' as const },
      { id: 'km-mock-3', timestamp: formatDuration(Math.floor(duration * 0.8)), description: `Open to cash offer with quick close`, type: 'commitment' as const },
    ],
    nextStep: `Schedule property walkthrough at ${extractedData.property.address}. Run comps and prepare cash offer.`,
    followUpDate: followUp,
    crmSynced: false,
  }
}

function generateMockExtractionGroups(contactName: string, extractedData: any): ExtractionGroup[] {
  return [
    {
      label: contactName,
      icon: '\uD83D\uDC64',
      entityId: null,
      fields: [
        { field: 'Name', value: extractedData.contact.name, confidence: 'high' as const, sourceQuote: 'Yes, this is John.', targetTable: 'crm.contacts', targetColumn: 'first_name', targetPath: null, currentValue: null, action: 'fill_empty' as const },
        { field: 'Relationship', value: extractedData.contact.relationship, confidence: 'high' as const, sourceQuote: 'I inherited it from my mom', targetTable: 'crm.contacts', targetColumn: 'notes', targetPath: null, currentValue: null, action: 'fill_empty' as const },
        { field: 'Location', value: extractedData.contact.location, confidence: 'medium' as const, sourceQuote: 'I live out of state', targetTable: 'crm.contacts', targetColumn: 'address', targetPath: null, currentValue: null, action: 'fill_empty' as const },
      ],
    },
    {
      label: 'Property',
      icon: '\uD83C\uDFE0',
      entityId: null,
      fields: [
        { field: 'Address', value: extractedData.property.address, confidence: 'high' as const, sourceQuote: 'the property on Oak Street', targetTable: 'investor.properties', targetColumn: 'address', targetPath: null, currentValue: null, action: 'fill_empty' as const },
        { field: 'Bedrooms', value: String(extractedData.property.bedrooms), confidence: 'high' as const, sourceQuote: "it's a 3 bed, 2 bath", targetTable: 'investor.properties', targetColumn: 'bedrooms', targetPath: null, currentValue: null, action: 'fill_empty' as const },
        { field: 'Sqft', value: String(extractedData.property.sqft), confidence: 'high' as const, sourceQuote: 'About 1,500 square feet', targetTable: 'investor.properties', targetColumn: 'sqft', targetPath: null, currentValue: null, action: 'fill_empty' as const },
        { field: 'Year Built', value: String(extractedData.property.yearBuilt), confidence: 'high' as const, sourceQuote: 'Built in 1985', targetTable: 'investor.properties', targetColumn: 'year_built', targetPath: null, currentValue: null, action: 'fill_empty' as const },
        { field: 'Repairs Needed', value: extractedData.property.repairs.join('; '), confidence: 'medium' as const, sourceQuote: 'The roof is about 15 years old, kitchen is outdated, foundation issues', targetTable: 'investor.properties', targetColumn: 'notes', targetPath: null, currentValue: null, action: 'fill_empty' as const },
      ],
    },
    {
      label: 'Deal',
      icon: '\uD83D\uDCB0',
      entityId: null,
      fields: [
        { field: 'Asking Price', value: `$${extractedData.deal.askingPrice.toLocaleString()}`, confidence: 'high' as const, sourceQuote: 'I was thinking around 180,000', targetTable: 'investor.deals', targetColumn: 'asking_price', targetPath: null, currentValue: null, action: 'fill_empty' as const },
        { field: 'Motivation', value: extractedData.deal.motivation, confidence: 'high' as const, sourceQuote: 'I inherited it from my mom. I live out of state', targetTable: 'investor.deals', targetColumn: 'notes', targetPath: null, currentValue: null, action: 'fill_empty' as const },
        { field: 'Timeline', value: extractedData.deal.timeline, confidence: 'medium' as const, sourceQuote: 'That sounds perfect actually', targetTable: 'investor.deals', targetColumn: 'timeline', targetPath: null, currentValue: null, action: 'fill_empty' as const },
      ],
    },
  ]
}

export default function CallSummaryScreen() {
  const { callId } = useLocalSearchParams<{ callId: string }>()
  const { theme } = useTheme()
  const router = useRouter()
  const { getSummaryForCall, loadSummaryForCall, isLoading: memosLoading } = useMemos()

  // ALL hooks must be declared before any conditional returns
  const cachedSummary = getSummaryForCall(callId ?? '')
  const [asyncSummary, setAsyncSummary] = useState<CallSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(!cachedSummary && !!callId)
  const [extractionGroups, setExtractionGroups] = useState<ExtractionGroup[]>([])
  const [rawUpdates, setRawUpdates] = useState<SuggestedUpdate[]>([])
  const rawUpdatesRef = useRef(rawUpdates)
  rawUpdatesRef.current = rawUpdates
  const [crmLoading, setCrmLoading] = useState(false)
  const [crmSynced, setCrmSynced] = useState(false)
  const [crmError, setCrmError] = useState<string | null>(null)

  // Check for mock call result
  const mockResult = useMemo(() => {
    if (!callId) return undefined
    return getMockCallResult(callId)
  }, [callId])

  // Generate mock summary if we have a mock call result
  const mockSummary = useMemo(() => {
    if (!mockResult) return undefined
    return generateMockSummary(
      callId ?? '',
      mockResult.contactId,
      mockResult.contactName,
      mockResult.duration,
      mockResult.extractedData,
    )
  }, [callId, mockResult])

  // Load async summary if needed
  useEffect(() => {
    if (cachedSummary || mockSummary || !callId) {
      setSummaryLoading(false)
      return
    }
    let cancelled = false
    async function load() {
      try {
        const result = await loadSummaryForCall(callId!)
        if (!cancelled) setAsyncSummary(result || null)
      } catch (err) {
        if (__DEV__) console.warn('[CallSummary] async load failed:', err)
      } finally {
        if (!cancelled) setSummaryLoading(false)
      }
    }
    load().catch(() => {})
    return () => { cancelled = true }
  }, [callId, cachedSummary, mockSummary, loadSummaryForCall])

  // Set up mock extraction groups
  useEffect(() => {
    if (mockResult && !crmSynced) {
      const groups = generateMockExtractionGroups(
        mockResult.contactName,
        mockResult.extractedData,
      )
      setExtractionGroups(groups)
    }
  }, [mockResult, crmSynced])

  // Load real CRM suggestions (non-mock mode)
  useEffect(() => {
    if (!callId || isMockMode || mockResult) {
      return
    }
    setCrmLoading(true)
    let cancelled = false
    async function load() {
      try {
        const updates = await getSuggestedUpdates(callId!)
        if (cancelled) return
        setRawUpdates(updates)
        const groupMap = new Map<string, { fields: ExtractionField[]; table: string }>()
        for (const u of updates) {
          const key = u.target_table || 'Other'
          if (!groupMap.has(key)) groupMap.set(key, { fields: [], table: key })
          groupMap.get(key)!.fields.push({
            field: u.field_name,
            value: u.suggested_value,
            confidence: (u.confidence === 'high' || u.confidence === 'medium' || u.confidence === 'low')
              ? u.confidence : 'medium',
            sourceQuote: u.source_quote || '',
            targetTable: u.target_table,
            targetColumn: u.field_name,
            targetPath: null,
            currentValue: u.current_value ?? null,
            action: (u.current_value !== null && u.current_value !== undefined) ? 'overwrite' : 'fill_empty',
          })
        }
        const groups: ExtractionGroup[] = Array.from(groupMap.entries()).map(([table, data]) => ({
          label: table.includes('properties') ? 'Property' : table.includes('leads') ? 'Contact' : table,
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
  }, [callId, mockResult])

  const summary = cachedSummary || mockSummary || asyncSummary

  // Sync crmSynced from summary
  useEffect(() => {
    if (summary?.crmSynced) setCrmSynced(true)
  }, [summary?.crmSynced])

  const handleApproveField = useCallback(async (field: ExtractionField) => {
    if (mockResult) {
      // Mock mode: just remove the field from the UI
      triggerImpact(ImpactFeedbackStyle.Medium)
      setExtractionGroups((prev) =>
        prev.map((g) => ({ ...g, fields: g.fields.filter((f) => f.field !== field.field) }))
          .filter((g) => g.fields.length > 0)
      )
      return
    }
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
  }, [callId, mockResult])

  const handleSkipField = useCallback((_field: ExtractionField) => {
    setExtractionGroups((prev) =>
      prev.map((g) => ({ ...g, fields: g.fields.filter((f) => f.field !== _field.field) }))
        .filter((g) => g.fields.length > 0)
    )
  }, [])

  const handleApproveAllEmpty = useCallback(async () => {
    if (mockResult) {
      // Mock mode: mark all as synced
      triggerImpact(ImpactFeedbackStyle.Heavy)
      setCrmSynced(true)
      setExtractionGroups([])
      clearMockCallResult(callId ?? '')
      return
    }
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
  }, [callId, mockResult])

  const handleDone = useCallback(() => {
    if (mockResult) clearMockCallResult(callId ?? '')
    router.dismissAll()
  }, [router, callId, mockResult])

  // --- Render ---

  if (summaryLoading || memosLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], paddingTop: theme.tokens.spacing[2] }}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Back" accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center' }}>
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

  if (!summary) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], paddingTop: theme.tokens.spacing[2] }}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Back" accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-back" size={28} color={theme.colors.primary[500]} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: theme.tokens.spacing[6] }}>
          <Text variant="h3" style={{ textAlign: 'center' }}>No Summary Available</Text>
          <Text variant="body" color={theme.colors.text.secondary} style={{ textAlign: 'center', marginTop: theme.tokens.spacing[2] }}>
            Summary will be available after the call is processed.
          </Text>
          <View style={{ width: '100%', marginTop: theme.tokens.spacing[6] }}>
            <Button title="Done" onPress={handleDone} size="lg" />
          </View>
        </View>
      </SafeAreaView>
    )
  }

  const formattedDate = new Date(summary.date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.tokens.spacing[8] }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], paddingTop: theme.tokens.spacing[2] }}>
          <TouchableOpacity onPress={handleDone} accessibilityLabel="Done" accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-back" size={28} color={theme.colors.primary[500]} />
          </TouchableOpacity>
        </View>

        {/* Header */}
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

        {/* Push to Doughy — Extraction Approval */}
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
            <SectionHeader title="Push to Doughy" style={{ paddingHorizontal: 0 }} />
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
            <Card variant="filled" padding="md" style={{ alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success[500]} />
              <Text variant="body" weight="semibold" color={theme.colors.success[600]} style={{ marginTop: theme.tokens.spacing[1] }}>
                Pushed to Doughy
              </Text>
            </Card>
          </View>
        )}

        {/* Done Button */}
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[6] }}>
          <Button title="Done" onPress={handleDone} size="lg" />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
