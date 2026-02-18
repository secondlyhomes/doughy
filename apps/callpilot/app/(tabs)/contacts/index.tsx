/**
 * Contacts Home Screen
 *
 * headerShown: false — no React Navigation header.
 * SearchBar floats over the list (position absolute) so content
 * scrolls behind it and the GlassView translucency is visible.
 */

import { useState, useMemo } from 'react'
import { View, SectionList, RefreshControl, Alert, ScrollView, TouchableOpacity, Text as RNText } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ImpactFeedbackStyle } from 'expo-haptics'
import { triggerImpact } from '@/utils/haptics'
import { useTheme } from '@/theme'
import { Text, EmptyState } from '@/components'
import { SearchBar } from '@/components/SearchBar'
import { SkeletonContactCard, SkeletonContactRow } from '@/components/SkeletonLoader'
import { ContactCard } from '@/components/contacts/ContactCard'
import { ContactListItem } from '@/components/contacts/ContactListItem'
import { useContacts } from '@/hooks'
import type { Contact, ContactTemperature } from '@/types'
import type { TemperatureFilter, ModuleFilter, ContactTypeFilter } from '@/hooks/useContacts'

/** Height of the search bar area (bar + vertical padding) */
const SEARCH_BAR_HEIGHT = 56
/** Extra height when filter rows are expanded */
const FILTER_ROWS_HEIGHT = 40

interface FilterDef<T extends string> {
  key: T
  label: string
}

interface FilterGroup {
  label: string
  filters: FilterDef<string>[]
  activeFilter: string
  onFilterChange: (key: string) => void
}

const MODULE_FILTERS: FilterDef<ModuleFilter>[] = [
  { key: 'all', label: 'All' },
  { key: 'investor', label: '\uD83D\uDCB0 Investor' },
  { key: 'landlord', label: '\uD83C\uDFE0 Landlord' },
]

const TEMP_FILTERS: FilterDef<TemperatureFilter>[] = [
  { key: 'all', label: 'All' },
  { key: 'hot', label: '\uD83D\uDD25 Hot' },
  { key: 'warm', label: '\uD83D\uDFE1 Warm' },
  { key: 'cold', label: '\uD83E\uDD76 Cold' },
]

const LANDLORD_TYPE_FILTERS: FilterDef<ContactTypeFilter>[] = [
  { key: 'all', label: 'All' },
  { key: 'tenant', label: 'Tenants' },
  { key: 'guest', label: 'Guests' },
  { key: 'applicant', label: 'Leads' },
  { key: 'contractor', label: 'Contractors' },
  { key: 'vendor', label: 'Vendors' },
]

const SECTION_TITLES: Record<ContactTemperature, string> = {
  hot: 'Hot Leads',
  warm: 'Warm Leads',
  cold: 'Cold Leads',
}

interface SectionData {
  title: string
  temperature: ContactTemperature
  data: Contact[]
}

export default function ContactsScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const {
    filteredContacts,
    setSearchQuery,
    filterTemperature,
    setFilterTemperature,
    filterModule,
    setFilterModule,
    filterContactType,
    setFilterContactType,
    refresh,
    isLoading,
    error,
  } = useContacts()

  const [searchQuery, setLocalSearchQuery] = useState('')
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  function handleSearchChange(text: string) {
    setLocalSearchQuery(text)
    setSearchQuery(text)
  }

  const filterGroups: FilterGroup[] = useMemo(() => {
    const groups: FilterGroup[] = [
      {
        label: 'Module',
        filters: MODULE_FILTERS,
        activeFilter: filterModule,
        onFilterChange: setFilterModule as (key: string) => void,
      },
    ]

    if (filterModule === 'investor' || filterModule === 'all') {
      groups.push({
        label: 'Temperature',
        filters: TEMP_FILTERS,
        activeFilter: filterTemperature,
        onFilterChange: setFilterTemperature as (key: string) => void,
      })
    }

    if (filterModule === 'landlord') {
      groups.push({
        label: 'Type',
        filters: LANDLORD_TYPE_FILTERS,
        activeFilter: filterContactType,
        onFilterChange: setFilterContactType as (key: string) => void,
      })
    }

    return groups
  }, [filterModule, filterTemperature, filterContactType, setFilterModule, setFilterTemperature, setFilterContactType])

  const hasActiveFilters = filterGroups.some(
    (g) => g.activeFilter !== g.filters[0]?.key,
  )

  const sections: SectionData[] = useMemo(() => {
    const groups: Record<ContactTemperature, Contact[]> = { hot: [], warm: [], cold: [] }
    for (const c of filteredContacts) {
      groups[c.temperature].push(c)
    }
    return (['hot', 'warm', 'cold'] as ContactTemperature[])
      .filter((temp) => groups[temp].length > 0)
      .map((temp) => ({
        title: SECTION_TITLES[temp],
        temperature: temp,
        data: groups[temp],
      }))
  }, [filteredContacts])

  function handleContactPress(contact: Contact) {
    router.push(`/contact/${contact.id}`)
  }

  function handleCall(contact: Contact) {
    if (!contact.phone) {
      Alert.alert('No Phone Number', `${contact.firstName} ${contact.lastName} has no phone number on file.`)
      return
    }
    router.push({ pathname: '/pre-call/[contactId]', params: { contactId: contact.id } })
  }

  function handleMessage(contact: Contact) {
    router.push({ pathname: '/messages/[contactId]', params: { contactId: contact.id } })
  }

  function handleFilterToggle() {
    triggerImpact(ImpactFeedbackStyle.Light)
    setFiltersExpanded((prev) => !prev)
  }

  // Top padding: safe area inset + search bar height so content starts below the bar
  const listTopPadding = insets.top + SEARCH_BAR_HEIGHT + (filtersExpanded ? filterGroups.length * FILTER_ROWS_HEIGHT : 0)

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ paddingTop: insets.top + SEARCH_BAR_HEIGHT, flex: 1 }}>
          <EmptyState
            title="Couldn't load contacts"
            description="There was a problem loading your contacts. Please try again."
            icon="alert-circle"
            actionLabel="Retry"
            onAction={refresh}
          />
        </View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* List fills the entire screen; top padding offsets for the floating search bar */}
      {isLoading ? (
        <View style={{ flex: 1, paddingTop: listTopPadding }}>
          <SkeletonContactCard />
          <SkeletonContactCard />
          <SkeletonContactCard />
          <SkeletonContactRow />
          <SkeletonContactRow />
        </View>
      ) : filteredContacts.length === 0 ? (
        <View style={{ flex: 1, paddingTop: listTopPadding }}>
          <EmptyState
            title="No contacts"
            description={
              filterModule === 'all'
                ? 'Connect your CRM to see your leads here.'
                : `No ${filterModule} contacts match your filters.`
            }
            icon="people"
            actionLabel="Go to Settings"
            onAction={() => router.push('/(tabs)/settings')}
          />
        </View>
      ) : (
        <SectionList
          style={{ flex: 1 }}
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <View style={{
              paddingHorizontal: theme.tokens.spacing[4],
              paddingTop: theme.tokens.spacing[3],
              paddingBottom: theme.tokens.spacing[1],
            }}>
              <Text variant="caption" weight="semibold" color={theme.colors.text.tertiary} style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item, section }) => {
            if (section.temperature === 'cold') {
              return <ContactListItem contact={item} onPress={handleContactPress} />
            }
            return (
              <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginBottom: theme.tokens.spacing[2] }}>
                <ContactCard
                  contact={item}
                  onPress={handleContactPress}
                  onCall={handleCall}
                  onMessage={handleMessage}
                />
              </View>
            )
          }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={theme.colors.primary[500]}
            />
          }
          contentContainerStyle={{
            paddingTop: listTopPadding,
            paddingBottom: theme.tokens.spacing[4],
          }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* Search bar floats over the list so content scrolls behind the glass */}
      <View
        style={{
          position: 'absolute',
          top: insets.top,
          left: 0,
          right: 0,
          zIndex: 1,
          paddingHorizontal: theme.tokens.spacing[4],
          paddingVertical: theme.tokens.spacing[2],
        }}
      >
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Search contacts..."
          onFilter={handleFilterToggle}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Filter pill rows — rendered below the SearchBar when expanded */}
        {filtersExpanded && filterGroups.map((group) => (
          <FilterPillRow
            key={group.label}
            label={group.label}
            filters={group.filters}
            activeFilter={group.activeFilter}
            onFilterChange={group.onFilterChange}
          />
        ))}
      </View>
    </View>
  )
}

/** Horizontal scrollable row of filter pills */
function FilterPillRow({
  filters,
  activeFilter,
  onFilterChange,
  label,
}: {
  filters: FilterDef<string>[]
  activeFilter: string
  onFilterChange: (key: string) => void
  label?: string
}) {
  const { theme, isDark } = useTheme()

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 6, paddingHorizontal: 2 }}
      style={{ marginTop: theme.tokens.spacing[2] }}
    >
      {label && (
        <View style={{ justifyContent: 'center', marginRight: 2 }}>
          <RNText style={{
            fontSize: theme.tokens.fontSize['2xs'],
            fontWeight: '600',
            color: theme.colors.text.tertiary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            {label}
          </RNText>
        </View>
      )}
      {filters.map(({ key, label: pillLabel }) => {
        const isActive = activeFilter === key
        return (
          <TouchableOpacity
            key={key}
            onPress={() => {
              triggerImpact(ImpactFeedbackStyle.Light)
              onFilterChange(key)
            }}
            accessibilityLabel={`Filter: ${pillLabel}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 9999,
              backgroundColor: isActive
                ? theme.colors.primary[500]
                : isDark ? theme.colors.neutral[700] : theme.colors.neutral[200],
            }}
          >
            <RNText style={{
              fontSize: theme.tokens.fontSize.xs,
              fontWeight: isActive ? '600' : '400',
              color: isActive
                ? theme.tokens.colors.white
                : theme.colors.text.secondary,
            }}>
              {pillLabel}
            </RNText>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}
