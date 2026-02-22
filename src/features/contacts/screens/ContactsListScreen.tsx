// src/features/contacts/screens/ContactsListScreen.tsx
// List screen for landlord platform contacts with search, filters, and FAB
// Displays contacts from crm_contacts filtered by landlord-relevant types

import React, { useState, useCallback, useMemo } from 'react';
import { View, FlatList, RefreshControl, Alert } from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import {
  SearchBar,
  ListEmptyState,
  TAB_BAR_SAFE_PADDING,
  SimpleFAB,
  SPACING,
} from '@/components/ui';
import { LeadCardSkeleton, SkeletonList } from '@/components/ui/CardSkeletons';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Users, Search } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useDebounce } from '@/hooks';

import {
  Contact,
  ContactFilters,
  CrmContactType,
  getContactDisplayName,
} from '../types';
import { useContacts, useCreateContact } from '../hooks/useContacts';
import { ContactCard } from '../components/ContactCard';
import {
  ContactsFiltersSheet,
  AddContactSheet,
  DEFAULT_FILTERS,
} from './contacts-list';

export function ContactsListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeTypeFilter, setActiveTypeFilter] = useState<CrmContactType | 'all'>('all');
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<ContactFilters>(DEFAULT_FILTERS);

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

    let filtered = contacts.filter((contact) => {
      const displayName = getContactDisplayName(contact).toLowerCase();
      const matchesSearch =
        !query ||
        displayName.includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone?.includes(query) ||
        contact.company?.toLowerCase().includes(query);

      const matchesTypeFilter =
        activeTypeFilter === 'all' ||
        (contact.contact_types || []).includes(activeTypeFilter);

      const matchesStatus =
        advancedFilters.status === 'all' || contact.status === advancedFilters.status;

      const matchesSource =
        advancedFilters.source === 'all' || contact.source === advancedFilters.source;

      return matchesSearch && matchesTypeFilter && matchesStatus && matchesSource;
    });

    const { sortBy, sortOrder } = advancedFilters;
    return [...filtered].sort((a, b) => {
      if (sortBy === 'created_at') {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      } else if (sortBy === 'name') {
        const aName = getContactDisplayName(a);
        const bName = getContactDisplayName(b);
        const comparison = aName.localeCompare(bName);
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      return 0;
    });
  }, [contacts, debouncedSearchQuery, activeTypeFilter, advancedFilters]);

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
    setAdvancedFilters(DEFAULT_FILTERS);
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
        contact_types: ['lead'],
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
      <ContactCard contact={item} onPress={() => handleContactPress(item)} />
    ),
    [handleContactPress]
  );

  const keyExtractor = useCallback((item: Contact) => item.id, []);
  const ItemSeparator = useCallback(() => <View style={{ height: SPACING.md }} />, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <View style={{ flex: 1 }}>
          {/* Search Bar — floats above content with glass blur */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: SPACING.md, paddingTop: SPACING.sm }}>
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

          {/* Contacts List */}
          {isLoading && !contacts?.length ? (
            <View style={{ paddingHorizontal: SPACING.md, paddingTop: 64 + SPACING.md }}>
              <SkeletonList count={5} component={LeadCardSkeleton} />
            </View>
          ) : (
            <FlatList
              data={filteredContacts}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: SPACING.md,
                paddingTop: 64 + SPACING.md,
                paddingBottom: TAB_BAR_SAFE_PADDING,
              }}
            contentInsetAdjustmentBehavior="automatic"
            ItemSeparatorComponent={ItemSeparator}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={colors.info} />
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
                  onPress: searchQuery ? () => setSearchQuery('') : () => setShowAddContactSheet(true),
                }}
              />
            }
          />
        )}
        </View>

        {/* Floating Action Button */}
        <SimpleFAB onPress={() => setShowAddContactSheet(true)} accessibilityLabel="Add new contact" />

        {/* Filters Sheet */}
        <ContactsFiltersSheet
          visible={showFiltersSheet}
          onClose={() => setShowFiltersSheet(false)}
          activeTypeFilter={activeTypeFilter}
          advancedFilters={advancedFilters}
          onTypeFilterChange={setActiveTypeFilter}
          onAdvancedFiltersChange={setAdvancedFilters}
          onClearAll={handleClearAllFilters}
        />

        {/* Add Contact Sheet */}
        <AddContactSheet
          visible={showAddContactSheet}
          onClose={() => setShowAddContactSheet(false)}
          firstName={newContactFirstName}
          lastName={newContactLastName}
          phone={newContactPhone}
          email={newContactEmail}
          onFirstNameChange={setNewContactFirstName}
          onLastNameChange={setNewContactLastName}
          onPhoneChange={setNewContactPhone}
          onEmailChange={setNewContactEmail}
          onSubmit={handleQuickAddContact}
          isSubmitting={createContact.isPending}
        />
      </ThemedSafeAreaView>
    </GestureHandlerRootView>
  );
}

export default ContactsListScreen;
