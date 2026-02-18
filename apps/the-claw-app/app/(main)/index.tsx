/**
 * Control Panel Screen
 *
 * THE single-screen control panel. ScrollView with compact pinned header.
 * Sections: Queue -> Connections -> Activity -> Cost.
 * Overlays: TrustLevelPicker, AutonomousConsentModal, SearchFilterSheet.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { ScrollView, View, Alert, AppState } from 'react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '@/theme'
import { useConnectionContext } from '@/contexts/ConnectionContext'
import { useTrustLevel } from '@/hooks/useTrustLevel'
import { useConnections } from '@/hooks/useConnections'
import { useQueue } from '@/hooks/useQueue'
import { useActivity } from '@/hooks/useActivity'
import { useCost } from '@/hooks/useCost'
import { useSearch } from '@/hooks/useSearch'
import { useConsentStore } from '@/stores/useConsentStore'
import { PinnedHeader } from '@/components/control-panel/PinnedHeader'
import { SearchBar } from '@/components/search/SearchBar'
import { SearchFilterSheet } from '@/components/search/SearchFilterSheet'
import { QueueSection } from '@/components/queue/QueueSection'
import { ConnectionsSection } from '@/components/connections/ConnectionsSection'
import { ActivitySection } from '@/components/activity/ActivitySection'
import { CostCard } from '@/components/cost/CostCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { TrustLevelPicker } from '@/components/trust/TrustLevelPicker'
import { AutonomousConsentModal } from '@/components/control/AutonomousConsentModal'
import type { TrustLevel, SearchFilters } from '@/types'

export default function ControlPanelScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const { adapter } = useConnectionContext()

  // Hooks
  const { trustLevel, countdownSeconds, headerMode, setLevel, saveError, clearSaveError } = useTrustLevel()
  const { connections, loading: connectionsLoading, loadConnections } = useConnections()
  const { countdownItems, pendingItems, cancel, approve, deny, loadQueue } = useQueue()
  const { entries, loadActivity, undoEntry } = useActivity()
  const { summary, loading: costLoading, error: costError } = useCost()
  const { grantConsent } = useConsentStore()

  // Search
  const {
    query, setQuery,
    filters, setFilters, resetFilter, resetAll,
    activeFilterLabels, hasActiveSearch, totalResults,
    filteredQueue, filteredActivity, filteredConnections, filteredCost,
    filterSheetVisible, setFilterSheetVisible,
  } = useSearch()

  // Header height for scroll top padding, search bar height for scroll bottom padding
  const [headerHeight, setHeaderHeight] = useState(92)
  const [searchBarHeight, setSearchBarHeight] = useState(60)

  // UI state
  const [trustPickerVisible, setTrustPickerVisible] = useState(false)
  const [consentVisible, setConsentVisible] = useState(false)
  const [killSwitchActive, setKillSwitchActive] = useState(false)
  const [killSwitchDegraded, setKillSwitchDegraded] = useState(false)

  const refreshAll = useCallback(() => {
    loadConnections()
    loadQueue()
    loadActivity()
    if (adapter) {
      adapter.getKillSwitchStatus()
        .then(status => {
          setKillSwitchActive(status.active)
          setKillSwitchDegraded(false)
        })
        .catch(() => {
          setKillSwitchDegraded(true)
        })
    }
  }, [loadConnections, loadQueue, loadActivity, adapter])

  // Load data on mount
  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  // Refresh data when app comes back to foreground
  const appStateRef = useRef(AppState.currentState)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        refreshAll()
      }
      appStateRef.current = nextState
    })
    return () => subscription.remove()
  }, [refreshAll])

  // Trust level selection
  const handleSelectTrustLevel = useCallback((level: TrustLevel) => {
    if (level === 'autonomous') {
      setConsentVisible(true)
      return
    }
    setLevel(level)
    setTrustPickerVisible(false)
  }, [setLevel])

  const handleConsentAccepted = useCallback(() => {
    grantConsent('1.0.0', '1.0.0')
    setLevel('autonomous')
    setConsentVisible(false)
    setTrustPickerVisible(false)
  }, [grantConsent, setLevel])

  // Kill switch
  const handleKillSwitch = useCallback(async () => {
    if (!adapter) {
      Alert.alert('Kill Switch Error', 'Not connected to the server. Cannot toggle kill switch.')
      return
    }
    const wasActive = killSwitchActive
    const prevLevel = trustLevel
    try {
      if (wasActive) {
        setKillSwitchActive(false)
        await adapter.deactivateKillSwitch()
      } else {
        setKillSwitchActive(true)
        setLevel('locked')
        await adapter.activateKillSwitch('Manual kill from control panel')
      }
    } catch (err) {
      setKillSwitchActive(wasActive)
      if (!wasActive) setLevel(prevLevel)
      Alert.alert('Kill Switch Error', err instanceof Error ? err.message : 'Failed to toggle kill switch')
    }
  }, [killSwitchActive, trustLevel, setLevel, adapter])

  // Navigation
  const handleConnectionPress = useCallback((id: string) => {
    router.push({ pathname: '/(main)/connection-detail', params: { connectionId: id } })
  }, [router])

  const handleActivityPress = useCallback((id: string) => {
    router.push({ pathname: '/(main)/activity-detail', params: { entryId: id } })
  }, [router])

  const handleOverridesPress = useCallback(() => {
    setTrustPickerVisible(false)
    router.push('/(main)/per-action-overrides')
  }, [router])

  const handleSettingsPress = useCallback(() => {
    router.push('/(main)/settings')
  }, [router])

  // Search
  const handleRemoveFilter = useCallback((key: keyof SearchFilters) => {
    resetFilter(key)
  }, [resetFilter])

  const handleFilterApply = useCallback((draft: Partial<SearchFilters>) => {
    setFilters(draft)
  }, [setFilters])

  // Show alert when trust level save fails and reverts
  useEffect(() => {
    if (saveError) {
      Alert.alert('Save Failed', saveError)
      clearSaveError()
    }
  }, [saveError, clearSaveError])

  const effectiveTrustLevel = killSwitchActive ? 'locked' as TrustLevel : trustLevel

  // During search: split filtered data for conditional rendering
  const hasQueueResults = filteredQueue.length > 0
  const filteredCountdownItems = filteredQueue.filter(i => i.status === 'countdown')
  const filteredPendingItems = filteredQueue.filter(i => i.status === 'pending')
  const hasActivityResults = filteredActivity.length > 0
  const hasConnectionResults = filteredConnections.length > 0
  const hasCostResults = filteredCost !== null

  const showEmptySearch = hasActiveSearch && totalResults === 0

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <PinnedHeader
        trustLevel={effectiveTrustLevel}
        killSwitchActive={killSwitchActive}
        killSwitchDegraded={killSwitchDegraded}
        headerMode={headerMode}
        onTrustBarPress={() => setTrustPickerVisible(true)}
        onKillSwitchPress={handleKillSwitch}
        onSettingsPress={handleSettingsPress}
        onHeightChange={setHeaderHeight}
      />

      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + theme.tokens.spacing[2],
          paddingBottom: searchBarHeight + theme.tokens.spacing[2],
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {showEmptySearch ? (
          <EmptyState
            iconName="search-outline"
            title="No results"
            description="Try a different search term or adjust your filters."
          />
        ) : (
          <>
            {(!hasActiveSearch || hasQueueResults) && (
              <QueueSection
                trustLevel={effectiveTrustLevel}
                countdownItems={hasActiveSearch ? filteredCountdownItems : countdownItems}
                pendingItems={hasActiveSearch ? filteredPendingItems : pendingItems}
                countdownSeconds={countdownSeconds}
                onCancel={cancel}
                onApprove={approve}
                onDeny={deny}
              />
            )}

            {(!hasActiveSearch || hasConnectionResults) && (
              <ConnectionsSection
                connections={hasActiveSearch ? filteredConnections : connections}
                onConnectionPress={handleConnectionPress}
                loading={connectionsLoading}
              />
            )}

            {(!hasActiveSearch || hasActivityResults) && (
              <ActivitySection
                entries={hasActiveSearch ? filteredActivity : entries}
                onEntryPress={handleActivityPress}
                onUndo={undoEntry}
              />
            )}

            {(!hasActiveSearch || hasCostResults) && (
              <CostCard
                summary={hasActiveSearch ? filteredCost : summary}
                loading={costLoading}
                error={costError}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom search pill */}
      <SearchBar
        query={query}
        onQueryChange={setQuery}
        activeFilterLabels={activeFilterLabels}
        onRemoveFilter={handleRemoveFilter}
        hasActiveFilters={activeFilterLabels.length > 0}
        onFilterPress={() => setFilterSheetVisible(true)}
        onHeightChange={setSearchBarHeight}
      />

      {/* Overlays */}
      <TrustLevelPicker
        visible={trustPickerVisible}
        currentLevel={effectiveTrustLevel}
        onSelect={handleSelectTrustLevel}
        onOverridesPress={handleOverridesPress}
        onClose={() => setTrustPickerVisible(false)}
      />

      <AutonomousConsentModal
        visible={consentVisible}
        onAccept={handleConsentAccepted}
        onCancel={() => setConsentVisible(false)}
      />

      <SearchFilterSheet
        visible={filterSheetVisible}
        filters={filters}
        onApply={handleFilterApply}
        onClear={resetAll}
        onClose={() => setFilterSheetVisible(false)}
      />
    </View>
  )
}
