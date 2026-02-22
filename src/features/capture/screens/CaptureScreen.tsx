// src/features/capture/screens/CaptureScreen.tsx
// Capture tab - action center for capturing and routing information

import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import { SearchBar } from '@/components/ui';
import { SPACING } from '@/constants/design-tokens';
import { useDebounce } from '@/hooks';

import { usePendingCaptureCount } from '../hooks/useCaptureItems';
import { VoiceMemoRecorder } from '@/features/conversations/components/VoiceMemoRecorder';
import { useUnreadCounts } from '@/features/layout/hooks/useUnreadCounts';
import { TriageQueue } from '../components/TriageQueue';

import type { TabKey } from './capture-screen-types';
import { QuickActionsBar } from './QuickActionsBar';
import { CaptureFiltersSheet } from './CaptureFiltersSheet';
import { QuickNoteSheet } from './QuickNoteSheet';
import { useCaptureActions } from './useCaptureActions';

export function CaptureScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);

  const { count: pendingCount } = usePendingCaptureCount();
  const { setCaptureItems } = useUnreadCounts();

  const {
    showRecorder,
    setShowRecorder,
    showNoteModal,
    setShowNoteModal,
    noteText,
    setNoteText,
    isCreating,
    handleRecordComplete,
    handleUploadDocument,
    handleTakePhoto,
    handleAddNote,
    handleSaveNote,
    handleLogCall,
    handleLogText,
  } = useCaptureActions();

  // Sync capture badge count with pending items
  useEffect(() => {
    setCaptureItems(pendingCount);
  }, [pendingCount, setCaptureItems]);

  // Check if any filters are active
  const hasActiveFilters = searchQuery.trim().length > 0 || activeTab !== 'queue';

  if (showRecorder) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <View style={{ flex: 1, padding: SPACING.lg, justifyContent: 'center' }}>
          <VoiceMemoRecorder
            onSave={handleRecordComplete}
            onCancel={() => setShowRecorder(false)}
            maxDuration={600} // 10 minutes
          />
        </View>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Search Bar - in normal document flow */}
      <View style={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.xs }}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search captures..."
          size="md"
          glass={true}
          onFilter={() => setShowFiltersSheet(true)}
          hasActiveFilters={hasActiveFilters}
        />
      </View>

      {/* Quick Actions */}
      <QuickActionsBar
        onRecord={() => setShowRecorder(true)}
        onLogCall={handleLogCall}
        onLogText={handleLogText}
        onUpload={handleUploadDocument}
        onPhoto={handleTakePhoto}
        onNote={handleAddNote}
      />

      {/* Content */}
      <View style={{ flex: 1 }}>
        <TriageQueue
          showAssigned={activeTab === 'history'}
          searchQuery={debouncedSearchQuery}
        />
      </View>

      {/* Filters Sheet */}
      <CaptureFiltersSheet
        visible={showFiltersSheet}
        onClose={() => setShowFiltersSheet(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        onClearFilters={() => {
          setSearchQuery('');
          setActiveTab('queue');
          setShowFiltersSheet(false);
        }}
      />

      {/* Quick Note Modal */}
      <QuickNoteSheet
        visible={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        noteText={noteText}
        onChangeText={setNoteText}
        onSave={handleSaveNote}
        isCreating={isCreating}
      />
    </ThemedSafeAreaView>
  );
}

export default CaptureScreen;
