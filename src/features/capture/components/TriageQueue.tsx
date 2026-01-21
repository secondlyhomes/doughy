// src/features/capture/components/TriageQueue.tsx
// Triage queue component - displays pending capture items for review

import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ListEmptyState, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { Inbox, CheckCircle, Search } from 'lucide-react-native';
import { SPACING } from '@/constants/design-tokens';

import { CaptureItem } from '../types';
import { useCaptureItems } from '../hooks/useCaptureItems';
import { CaptureItemCard } from './CaptureItemCard';
import { PushToLeadSheet } from './PushToLeadSheet';

interface TriageQueueProps {
  onItemPress?: (item: CaptureItem) => void;
  showAssigned?: boolean;
  searchQuery?: string;
  /** Filter to show only items assigned to a specific property */
  propertyId?: string;
}

export function TriageQueue({ onItemPress, showAssigned = false, searchQuery, propertyId }: TriageQueueProps) {
  const colors = useThemeColors();
  const [selectedItem, setSelectedItem] = useState<CaptureItem | null>(null);
  const [showPushSheet, setShowPushSheet] = useState(false);

  // Fetch items - pending/ready items for triage, or all including assigned
  const { items, isLoading, refetch } = useCaptureItems();

  // Filter items based on showAssigned prop and propertyId
  const statusFilteredItems = useMemo(() => {
    let filtered = showAssigned
      ? items
      : items.filter(item => item.status === 'pending' || item.status === 'ready' || item.status === 'processing');

    // If propertyId is specified, filter to only show items for that property
    if (propertyId) {
      filtered = filtered.filter(item => item.assigned_property_id === propertyId);
    }

    return filtered;
  }, [items, showAssigned, propertyId]);

  // Filter items based on search query
  const displayItems = useMemo(() => {
    if (!searchQuery?.trim()) return statusFilteredItems;
    const query = searchQuery.toLowerCase();
    return statusFilteredItems.filter(item =>
      item.title?.toLowerCase().includes(query) ||
      item.transcript?.toLowerCase().includes(query) ||
      item.content?.toLowerCase().includes(query) ||
      item.ai_summary?.toLowerCase().includes(query)
    );
  }, [statusFilteredItems, searchQuery]);

  const handleItemPress = useCallback((item: CaptureItem) => {
    if (onItemPress) {
      onItemPress(item);
    }
  }, [onItemPress]);

  const handlePushToLead = useCallback((item: CaptureItem) => {
    setSelectedItem(item);
    setShowPushSheet(true);
  }, []);

  const handlePushComplete = useCallback(() => {
    setShowPushSheet(false);
    setSelectedItem(null);
    refetch();
  }, [refetch]);

  const renderItem = useCallback(({ item }: { item: CaptureItem }) => (
    <CaptureItemCard
      item={item}
      onPress={() => handleItemPress(item)}
      onPushToLead={item.status === 'ready' ? () => handlePushToLead(item) : undefined}
    />
  ), [handleItemPress, handlePushToLead]);

  const keyExtractor = useCallback((item: CaptureItem) => item.id, []);

  const ItemSeparator = useCallback(() => <View style={{ height: SPACING.md }} />, []);

  return (
    <View style={{ flex: 1 }}>
      {/* Header Count */}
      <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
        <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
          {displayItems.length} item{displayItems.length !== 1 ? 's' : ''} to review
        </Text>
      </View>

      {/* Items List */}
      <FlatList
        data={displayItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{
          paddingHorizontal: SPACING.md,
          paddingBottom: TAB_BAR_SAFE_PADDING,
        }}
        ItemSeparatorComponent={ItemSeparator}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          searchQuery?.trim() ? (
            <ListEmptyState
              state="filtered"
              icon={Search}
              title="No Results Found"
              description="No captures match your search query."
            />
          ) : (
            <ListEmptyState
              state="empty"
              icon={showAssigned ? CheckCircle : Inbox}
              title={showAssigned ? 'All Caught Up!' : 'Nothing to Triage'}
              description={
                showAssigned
                  ? 'All captured items have been reviewed and assigned.'
                  : 'Record a call, upload a document, or add a note to get started.'
              }
            />
          )
        }
      />

      {/* Push to Lead Sheet */}
      {selectedItem && (
        <PushToLeadSheet
          visible={showPushSheet}
          item={selectedItem}
          onClose={() => {
            setShowPushSheet(false);
            setSelectedItem(null);
          }}
          onComplete={handlePushComplete}
        />
      )}
    </View>
  );
}

export default TriageQueue;
