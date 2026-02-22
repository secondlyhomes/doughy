/**
 * SearchFilterSheet Component
 *
 * Bottom sheet with action type / date range / service chip rows.
 * Draft state pattern — selections apply on close.
 * Follows TrustLevelPicker modal+animated pattern.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { View, Animated, TouchableOpacity, Modal, ScrollView, useWindowDimensions } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { ChipSection } from './ChipSection'
import type { SearchFilters, SearchActionType, SearchDateRange, SearchService } from '@/types/search'

export interface SearchFilterSheetProps {
  visible: boolean
  filters: SearchFilters
  onApply: (filters: Partial<SearchFilters>) => void
  onClear: () => void
  onClose: () => void
}

const ACTION_TYPE_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  { value: 'messages' as const, label: 'Messages' },
  { value: 'ai-calls' as const, label: 'AI Calls' },
  { value: 'updates' as const, label: 'Updates' },
  { value: 'briefings' as const, label: 'Briefings' },
]

const DATE_RANGE_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  { value: 'today' as const, label: 'Today' },
  { value: 'this-week' as const, label: 'This Week' },
  { value: 'this-month' as const, label: 'This Month' },
]

const SERVICE_OPTIONS = [
  { value: 'all' as const, label: 'All' },
  { value: 'bland' as const, label: 'Bland' },
  { value: 'twilio' as const, label: 'Twilio' },
  { value: 'claude' as const, label: 'Claude' },
]

export function SearchFilterSheet({
  visible,
  filters,
  onApply,
  onClear,
  onClose,
}: SearchFilterSheetProps) {
  const { theme } = useTheme()
  const { height: screenHeight } = useWindowDimensions()
  const slideAnim = useRef(new Animated.Value(screenHeight)).current
  const backdropAnim = useRef(new Animated.Value(0)).current

  // Draft state — applies on close
  const [draft, setDraft] = useState<SearchFilters>({ ...filters })

  useEffect(() => {
    if (visible) {
      setDraft({ ...filters })
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, ...theme.tokens.springs.snappy, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: screenHeight, duration: 250, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start()
    }
  }, [visible, filters])

  const handleClose = useCallback(() => {
    onApply(draft)
    onClose()
  }, [draft, onApply, onClose])

  const handleClear = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    onClear()
    onClose()
  }, [onClear, onClose])

  if (!visible) return null

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <Animated.View
        style={{
          ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: backdropAnim,
        }}
      >
        <TouchableOpacity style={{ flex: 1 }} onPress={handleClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: theme.colors.background,
          borderTopLeftRadius: theme.tokens.borderRadius['2xl'],
          borderTopRightRadius: theme.tokens.borderRadius['2xl'],
          transform: [{ translateY: slideAnim }],
          maxHeight: screenHeight * 0.6,
        }}
      >
        <View style={{ alignItems: 'center', paddingTop: theme.tokens.spacing[3] }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.colors.neutral[300] }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: theme.tokens.spacing[4], paddingBottom: theme.tokens.spacing[10] }}>
          <Text variant="h3" weight="bold" style={{ marginBottom: theme.tokens.spacing[4] }}>
            Filters
          </Text>

          <ChipSection<SearchActionType>
            label="Action Type"
            options={ACTION_TYPE_OPTIONS}
            selected={draft.actionType}
            onSelect={(value) => setDraft((d) => ({ ...d, actionType: value }))}
          />

          <ChipSection<SearchDateRange>
            label="Date Range"
            options={DATE_RANGE_OPTIONS}
            selected={draft.dateRange}
            onSelect={(value) => setDraft((d) => ({ ...d, dateRange: value }))}
          />

          <ChipSection<SearchService>
            label="Service"
            options={SERVICE_OPTIONS}
            selected={draft.service}
            onSelect={(value) => setDraft((d) => ({ ...d, service: value }))}
          />

          <TouchableOpacity
            onPress={handleClear}
            style={{
              marginTop: theme.tokens.spacing[4],
              alignSelf: 'center',
              paddingVertical: theme.tokens.spacing[3],
              paddingHorizontal: theme.tokens.spacing[6],
            }}
          >
            <Text variant="body" color={theme.colors.error[500]} weight="medium">
              Clear All
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </Modal>
  )
}
