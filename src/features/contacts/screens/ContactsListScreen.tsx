// src/features/contacts/screens/ContactsListScreen.tsx
// List screen for landlord platform contacts with search, filters, and FAB
// Displays contacts from crm_contacts filtered by landlord-relevant types

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import {
  SearchBar,
  ListEmptyState,
  TAB_BAR_SAFE_PADDING,
  BottomSheet,
  BottomSheetSection,
  Button,
  SimpleFAB,
  FormField,
  SPACING,
} from '@/components/ui';
import { LeadCardSkeleton, SkeletonList } from '@/components/ui/CardSkeletons';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Users, Search, Check } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { useDebounce } from '@/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Contact,
  ContactFilters,
  CrmContactType,
  CrmContactStatus,
  CrmContactSource,
  getContactDisplayName,
} from '../types';
import { useContacts, useCreateContact } from '../hooks/useContacts';
import { ContactCard } from '../components/ContactCard';

// ============================================
// Spacing Constants
// ============================================

const SEARCH_BAR_CONTAINER_HEIGHT =
  SPACING.sm +  // pt-2 (8px top padding)
  40 +          // SearchBar size="md" estimated height
  SPACING.xs;   // pb-1 (4px bottom padding)

const SEARCH_BAR_TO_CONTENT_GAP = SPACING.lg; // 16px comfortable gap

// ============================================
// Filter Configuration
// ============================================

const defaultFilters: ContactFilters = {
  contact_type: 'all',
  status: 'all',
  source: 'all',
  sortBy: 'created_at',
  sortOrder: 'desc',
};

// Quick filter tabs for contact types
const CONTACT_TYPE_FILTERS: { key: CrmContactType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'lead', label: 'Leads' },
  { key: 'guest', label: 'Guests' },
  { key: 'tenant', label: 'Tenants' },
  { key: 'vendor', label: 'Vendors' },
];

// Status filter options
const STATUS_OPTIONS: { label: string; value: CrmContactStatus | 'all' }[] = [
  { label: 'All Statuses', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Archived', value: 'archived' },
];

// Source filter options
const SOURCE_OPTIONS: { label: string; value: CrmContactSource | 'all' }[] = [
  { label: 'All Sources', value: 'all' },
  { label: 'Furnished Finder', value: 'furnishedfinder' },
  { label: 'Airbnb', value: 'airbnb' },
  { label: 'TurboTenant', value: 'turbotenant' },
  { label: 'Zillow', value: 'zillow' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Direct', value: 'direct' },
  { label: 'Referral', value: 'referral' },
  { label: 'Craigslist', value: 'craigslist' },
  { label: 'Other', value: 'other' },
];

// Sort options
const SORT_OPTIONS: { label: string; value: 'name' | 'created_at' | 'score' }[] = [
  { label: 'Date Added', value: 'created_at' },
  { label: 'Name', value: 'name' },
  { label: 'Score', value: 'score' },
];

// ============================================
// Main Component
// ============================================

export function ContactsListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeTypeFilter, setActiveTypeFilter] = useState<CrmContactType | 'all'>('all');
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<ContactFilters>(defaultFilters);

  // Add Contact Sheet state
  const [showAddContactSheet, setShowAddContactSheet] = useState(false);
  const [newContactFirstName, setNewContactFirstName] = useState('');
  const [newContactLastName, setNewContactLastName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');

  const { contacts, isLoading, refetch } = useContacts();
  const createContact = useCreateContact();

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Filter and sort contacts
  const filteredContacts = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase();

    // Filter contacts
    let filtered = contacts.filter((contact) => {
      // Search filter
      const displayName = getContactDisplayName(contact).toLowerCase();
      const matchesSearch =
        !query ||
        displayName.includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone?.includes(query) ||
        contact.company?.toLowerCase().includes(query);

      // Contact type filter (quick filter tabs)
      const matchesTypeFilter =
        activeTypeFilter === 'all' ||
        (contact.contact_types || []).includes(activeTypeFilter);

      // Advanced status filter
      const matchesStatus =
        advancedFilters.status === 'all' ||
        contact.status === advancedFilters.status;

      // Advanced source filter
      const matchesSource =
        advancedFilters.source === 'all' ||
        contact.source === advancedFilters.source;

      return matchesSearch && matchesTypeFilter && matchesStatus && matchesSource;
    });

    // Sort contacts
    const { sortBy, sortOrder } = advancedFilters;
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'created_at') {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      } else if (sortBy === 'name') {
        const aName = getContactDisplayName(a);
        const bName = getContactDisplayName(b);
        const comparison = aName.localeCompare(bName);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else if (sortBy === 'score') {
        const comparison = (a.score || 0) - (b.score || 0);
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      return 0;
    });

    return sorted;
  }, [contacts, debouncedSearchQuery, activeTypeFilter, advancedFilters]);

  // Count active advanced filters
  const activeFiltersCount = [
    advancedFilters.status !== 'all',
    advancedFilters.source !== 'all',
  ].filter(Boolean).length;

  const hasActiveFilters = activeTypeFilter !== 'all' || activeFiltersCount > 0;

  const handleContactPress = useCallback(
    (contact: Contact) => {
      router.push(`/(tabs)/contacts/${contact.id}`);
    },
    [router]
  );

  const handleClearAllFilters = useCallback(() => {
    setActiveTypeFilter('all');
    setAdvancedFilters(defaultFilters);
    setSearchQuery('');
  }, []);

  const resetAddContactForm = useCallback(() => {
    setNewContactFirstName('');
    setNewContactLastName('');
    setNewContactPhone('');
    setNewContactEmail('');
  }, []);

  const handleQuickAddContact = useCallback(async () => {
    if (!newContactFirstName.trim()) return;

    try {
      await createContact.mutateAsync({
        first_name: newContactFirstName.trim(),
        last_name: newContactLastName.trim() || undefined,
        phone: newContactPhone.trim() || undefined,
        email: newContactEmail.trim() || undefined,
        contact_types: ['lead'], // Default to lead type
      });

      resetAddContactForm();
      setShowAddContactSheet(false);
    } catch (error) {
      console.error('Failed to create contact:', error);
      Alert.alert(
        'Failed to Add Contact',
        'Unable to create the contact. Please check your connection and try again.'
      );
    }
  }, [newContactFirstName, newContactLastName, newContactPhone, newContactEmail, createContact, resetAddContactForm]);

  const renderItem = useCallback(
    ({ item }: { item: Contact }) => (
      <ContactCard
        contact={item}
        onPress={() => handleContactPress(item)}
      />
    ),
    [handleContactPress]
  );

  const keyExtractor = useCallback((item: Contact) => item.id, []);

  const ItemSeparator = useCallback(() => <View style={{ height: SPACING.md }} />, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        {/* Glass Search Bar - positioned absolutely at top */}
        <View className="absolute top-0 left-0 right-0 z-10" style={{ paddingTop: insets.top }}>
          <View className="px-4 pt-2 pb-1">
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search contacts..."
              size="md"
              glass={true}
              onFilter={() => setShowFiltersSheet(true)}
              hasActiveFilters={hasActiveFilters}
            />
          </View>
        </View>

        {/* Contacts List */}
        {isLoading && !contacts?.length ? (
          <View style={{ paddingTop: SEARCH_BAR_CONTAINER_HEIGHT + SEARCH_BAR_TO_CONTENT_GAP, paddingHorizontal: 16 }}>
            <SkeletonList count={5} component={LeadCardSkeleton} />
          </View>
        ) : (
          <FlatList
            data={filteredContacts}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{
              paddingTop: SEARCH_BAR_CONTAINER_HEIGHT + SEARCH_BAR_TO_CONTENT_GAP,
              paddingHorizontal: 16,
              paddingBottom: TAB_BAR_SAFE_PADDING,
            }}
            ItemSeparatorComponent={ItemSeparator}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
                tintColor={colors.info}
              />
            }
            ListEmptyComponent={
              <ListEmptyState
                state={searchQuery ? 'filtered' : 'empty'}
                icon={searchQuery ? Search : Users}
                title={searchQuery ? 'No Results Found' : 'No Contacts Yet'}
                description={
                  searchQuery
                    ? 'No contacts match your search criteria.'
                    : 'Add your first contact to start managing your network.'
                }
                primaryAction={{
                  label: searchQuery ? 'Clear Search' : 'Add First Contact',
                  onPress: searchQuery
                    ? () => setSearchQuery('')
                    : () => setShowAddContactSheet(true),
                }}
              />
            }
          />
        )}

        {/* Floating Action Button */}
        <SimpleFAB
          onPress={() => setShowAddContactSheet(true)}
          accessibilityLabel="Add new contact"
        />

        {/* Filters Sheet */}
        <BottomSheet
          visible={showFiltersSheet}
          onClose={() => setShowFiltersSheet(false)}
          title="Contact Filters"
        >
          {/* Contact Type Quick Filters */}
          <BottomSheetSection title="Contact Type">
            <View className="flex-row flex-wrap gap-2">
              {CONTACT_TYPE_FILTERS.map((filter) => {
                const isActive = activeTypeFilter === filter.key;
                return (
                  <TouchableOpacity
                    key={filter.key}
                    onPress={() => setActiveTypeFilter(filter.key)}
                    className="px-4 py-2 rounded-full border"
                    style={{
                      backgroundColor: isActive ? colors.primary : colors.muted,
                      borderColor: isActive ? colors.primary : colors.border,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${filter.label}${isActive ? ', selected' : ''}`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{ color: isActive ? colors.primaryForeground : colors.foreground }}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetSection>

          {/* Status Filter */}
          <BottomSheetSection title="Status">
            <View className="flex-row flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => {
                const isActive = advancedFilters.status === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() =>
                      setAdvancedFilters((prev) => ({ ...prev, status: option.value }))
                    }
                    className="px-3 py-2 rounded-lg flex-row items-center gap-1"
                    style={{
                      backgroundColor: isActive ? withOpacity(colors.primary, 'muted') : colors.muted,
                      borderWidth: isActive ? 1 : 0,
                      borderColor: isActive ? colors.primary : 'transparent',
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Status: ${option.label}${isActive ? ', selected' : ''}`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      className="text-sm"
                      style={{ color: isActive ? colors.primary : colors.foreground }}
                    >
                      {option.label}
                    </Text>
                    {isActive && <Check size={14} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetSection>

          {/* Source Filter */}
          <BottomSheetSection title="Source">
            <View className="flex-row flex-wrap gap-2">
              {SOURCE_OPTIONS.map((option) => {
                const isActive = advancedFilters.source === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() =>
                      setAdvancedFilters((prev) => ({ ...prev, source: option.value }))
                    }
                    className="px-3 py-2 rounded-lg flex-row items-center gap-1"
                    style={{
                      backgroundColor: isActive ? withOpacity(colors.primary, 'muted') : colors.muted,
                      borderWidth: isActive ? 1 : 0,
                      borderColor: isActive ? colors.primary : 'transparent',
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Source: ${option.label}${isActive ? ', selected' : ''}`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      className="text-sm"
                      style={{ color: isActive ? colors.primary : colors.foreground }}
                    >
                      {option.label}
                    </Text>
                    {isActive && <Check size={14} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetSection>

          {/* Sort By */}
          <BottomSheetSection title="Sort By">
            <View className="flex-row flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => {
                const isActive = advancedFilters.sortBy === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() =>
                      setAdvancedFilters((prev) => ({ ...prev, sortBy: option.value }))
                    }
                    className="px-3 py-2 rounded-lg flex-row items-center gap-1"
                    style={{
                      backgroundColor: isActive ? withOpacity(colors.primary, 'muted') : colors.muted,
                      borderWidth: isActive ? 1 : 0,
                      borderColor: isActive ? colors.primary : 'transparent',
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Sort by ${option.label}${isActive ? ', selected' : ''}`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      className="text-sm"
                      style={{ color: isActive ? colors.primary : colors.foreground }}
                    >
                      {option.label}
                    </Text>
                    {isActive && <Check size={14} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </BottomSheetSection>

          {/* Sort Order */}
          <BottomSheetSection title="Sort Order">
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg items-center"
                style={{
                  backgroundColor:
                    advancedFilters.sortOrder === 'desc' ? colors.primary : colors.muted,
                }}
                onPress={() =>
                  setAdvancedFilters((prev) => ({ ...prev, sortOrder: 'desc' }))
                }
                accessibilityRole="button"
                accessibilityLabel={`Newest first${advancedFilters.sortOrder === 'desc' ? ', selected' : ''}`}
                accessibilityState={{ selected: advancedFilters.sortOrder === 'desc' }}
              >
                <Text
                  className="font-medium"
                  style={{
                    color:
                      advancedFilters.sortOrder === 'desc'
                        ? colors.primaryForeground
                        : colors.foreground,
                  }}
                >
                  Newest First
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg items-center"
                style={{
                  backgroundColor:
                    advancedFilters.sortOrder === 'asc' ? colors.primary : colors.muted,
                }}
                onPress={() =>
                  setAdvancedFilters((prev) => ({ ...prev, sortOrder: 'asc' }))
                }
                accessibilityRole="button"
                accessibilityLabel={`Oldest first${advancedFilters.sortOrder === 'asc' ? ', selected' : ''}`}
                accessibilityState={{ selected: advancedFilters.sortOrder === 'asc' }}
              >
                <Text
                  className="font-medium"
                  style={{
                    color:
                      advancedFilters.sortOrder === 'asc'
                        ? colors.primaryForeground
                        : colors.foreground,
                  }}
                >
                  Oldest First
                </Text>
              </TouchableOpacity>
            </View>
          </BottomSheetSection>

          {/* Action buttons */}
          <View className="flex-row gap-3 pt-4 pb-6">
            <Button variant="outline" onPress={handleClearAllFilters} className="flex-1">
              Clear Filters
            </Button>
            <Button onPress={() => setShowFiltersSheet(false)} className="flex-1">
              Done
            </Button>
          </View>
        </BottomSheet>

        {/* Add Contact Sheet */}
        <BottomSheet
          visible={showAddContactSheet}
          onClose={() => setShowAddContactSheet(false)}
          title="Add Contact"
        >
          <BottomSheetSection>
            <FormField
              label="First Name"
              required
              value={newContactFirstName}
              onChangeText={setNewContactFirstName}
              placeholder="First name"
            />
            <FormField
              label="Last Name"
              value={newContactLastName}
              onChangeText={setNewContactLastName}
              placeholder="Last name"
            />
            <FormField
              label="Phone"
              value={newContactPhone}
              onChangeText={setNewContactPhone}
              placeholder="(555) 123-4567"
              keyboardType="phone-pad"
            />
            <FormField
              label="Email"
              value={newContactEmail}
              onChangeText={setNewContactEmail}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </BottomSheetSection>

          <View className="flex-row gap-3 pt-4 pb-6">
            <Button
              variant="outline"
              onPress={() => setShowAddContactSheet(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onPress={handleQuickAddContact}
              className="flex-1"
              disabled={!newContactFirstName.trim() || createContact.isPending}
            >
              {createContact.isPending ? 'Adding...' : 'Add Contact'}
            </Button>
          </View>
        </BottomSheet>
      </ThemedSafeAreaView>
    </GestureHandlerRootView>
  );
}

export default ContactsListScreen;
