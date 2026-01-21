// src/features/capture/screens/CaptureScreen.tsx
// Capture tab - action center for capturing and routing information

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { ThemedSafeAreaView } from '@/components';
import { BottomSheet, BottomSheetSection, Button, SearchBar } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { withOpacity, getShadowStyle } from '@/lib/design-utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDebounce } from '@/hooks';
import {
  Mic,
  Phone,
  MessageSquare,
  Upload,
  Camera,
  StickyNote,
} from 'lucide-react-native';

import { TriageQueue } from '../components/TriageQueue';
import { useCreateCaptureItem, usePendingCaptureCount } from '../hooks/useCaptureItems';
import { VoiceMemoRecorder } from '@/features/conversations/components/VoiceMemoRecorder';
import { useUnreadCounts } from '@/features/layout/hooks/useUnreadCounts';

// ============================================
// Spacing Constants
// ============================================

// Calculate search bar container height based on its padding
const SEARCH_BAR_CONTAINER_HEIGHT =
  SPACING.sm +  // pt-2 (8px top padding)
  40 +          // SearchBar size="md" estimated height
  SPACING.xs;   // pb-1 (4px bottom padding)
  // Total: ~52px

const SEARCH_BAR_TO_CONTENT_GAP = SPACING.lg; // 16px comfortable gap

type TabKey = 'queue' | 'history';

interface CaptureActionProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  color: string;
  onPress: () => void;
}

function CaptureAction({ icon: Icon, label, color, onPress }: CaptureActionProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        alignItems: 'center',
        gap: SPACING.xs,
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: BORDER_RADIUS.lg,
          backgroundColor: withOpacity(color, 'light'),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={ICON_SIZES.lg} color={color} />
      </View>
      <Text style={{ fontSize: 12, fontWeight: '500', color: colors.foreground }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Tab configuration
const TABS: { key: TabKey; label: string }[] = [
  { key: 'queue', label: 'Queue' },
  { key: 'history', label: 'History' },
];

export function CaptureScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('queue');
  const [showRecorder, setShowRecorder] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);

  const { mutateAsync: createItem, isPending: isCreating } = useCreateCaptureItem();
  const { count: pendingCount } = usePendingCaptureCount();
  const { setCaptureItems } = useUnreadCounts();

  // Sync capture badge count with pending items
  useEffect(() => {
    setCaptureItems(pendingCount);
  }, [pendingCount, setCaptureItems]);

  // Handle voice memo recording
  const handleRecordComplete = useCallback(async (data: {
    transcript: string;
    durationSeconds: number;
    audioUri?: string;
    keepAudio: boolean;
  }) => {
    try {
      await createItem({
        type: 'recording',
        title: `Voice Memo ${new Date().toLocaleDateString()}`,
        transcript: data.transcript,
        duration_seconds: data.durationSeconds,
        file_url: data.audioUri,
        source: 'app_recording',
      });
      setShowRecorder(false);
      Alert.alert('Saved', 'Voice memo added to triage queue.');
    } catch {
      Alert.alert('Error', 'Failed to save voice memo. Please try again.');
    }
  }, [createItem]);

  // Handle document upload
  // TODO: Files are currently stored with local URIs. This needs Supabase Storage
  // integration to upload files and store permanent URLs. See separate ticket.
  const handleUploadDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/*', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      await createItem({
        type: 'document',
        title: file.name,
        file_name: file.name,
        file_url: file.uri, // TODO: Upload to Supabase Storage and use permanent URL
        file_size: file.size,
        mime_type: file.mimeType,
        source: 'upload',
      });
      Alert.alert('Uploaded', 'Document added to triage queue.');
    } catch {
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    }
  }, [createItem]);

  // Handle photo capture
  const handleTakePhoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) return;

      const photo = result.assets[0];
      await createItem({
        type: 'photo',
        title: `Photo ${new Date().toLocaleDateString()}`,
        file_url: photo.uri,
        file_name: photo.fileName || 'photo.jpg',
        mime_type: photo.mimeType || 'image/jpeg',
        source: 'app_camera',
      });
      Alert.alert('Saved', 'Photo added to triage queue.');
    } catch {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  }, [createItem]);

  // Handle quick note - open cross-platform modal
  const handleAddNote = useCallback(() => {
    setNoteText('');
    setShowNoteModal(true);
  }, []);

  // Save note from modal
  const handleSaveNote = useCallback(async () => {
    if (!noteText.trim()) {
      setShowNoteModal(false);
      return;
    }
    try {
      await createItem({
        type: 'note',
        title: `Note ${new Date().toLocaleDateString()}`,
        content: noteText.trim(),
        source: 'manual',
      });
      setShowNoteModal(false);
      setNoteText('');
      Alert.alert('Saved', 'Note added to triage queue.');
    } catch {
      Alert.alert('Error', 'Failed to save note. Please try again.');
    }
  }, [createItem, noteText]);

  // Handle log call
  const handleLogCall = useCallback(() => {
    // TODO: Open call logging sheet
    Alert.alert('Coming Soon', 'Call logging will be available soon.');
  }, []);

  // Handle log text
  const handleLogText = useCallback(() => {
    // TODO: Open text logging sheet
    Alert.alert('Coming Soon', 'Text logging will be available soon.');
  }, []);

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
      {/* Glass Search Bar - positioned absolutely at top */}
      <View className="absolute top-0 left-0 right-0 z-10" style={{ paddingTop: insets.top }}>
        <View className="px-4 pt-2 pb-1">
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
      </View>

      {/* Quick Actions - positioned below search bar */}
      <View style={{
        paddingTop: SEARCH_BAR_CONTAINER_HEIGHT + SEARCH_BAR_TO_CONTENT_GAP,
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md
      }}>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: BORDER_RADIUS.xl,
            padding: SPACING.md,
            ...getShadowStyle(colors, { size: 'sm' }),
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: SPACING.lg,
              paddingHorizontal: SPACING.sm,
            }}
          >
            <CaptureAction
              icon={Mic}
              label="Record"
              color={colors.destructive}
              onPress={() => setShowRecorder(true)}
            />
            <CaptureAction
              icon={Phone}
              label="Log Call"
              color={colors.info}
              onPress={handleLogCall}
            />
            <CaptureAction
              icon={MessageSquare}
              label="Log Text"
              color={colors.success}
              onPress={handleLogText}
            />
            <CaptureAction
              icon={Upload}
              label="Upload"
              color={colors.primary}
              onPress={handleUploadDocument}
            />
            <CaptureAction
              icon={Camera}
              label="Photo"
              color={colors.warning}
              onPress={handleTakePhoto}
            />
            <CaptureAction
              icon={StickyNote}
              label="Note"
              color={colors.mutedForeground}
              onPress={handleAddNote}
            />
          </ScrollView>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <TriageQueue
          showAssigned={activeTab === 'history'}
          searchQuery={debouncedSearchQuery}
        />
      </View>

      {/* Filters Sheet */}
      <BottomSheet
        visible={showFiltersSheet}
        onClose={() => setShowFiltersSheet(false)}
        title="Capture Filters"
      >
        <BottomSheetSection title="View">
          <View className="flex-row flex-wrap gap-2">
            {TABS.map(tab => {
              const isActive = activeTab === tab.key;
              const label = tab.key === 'queue' && pendingCount > 0
                ? `${tab.label} (${pendingCount})`
                : tab.label;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => {
                    setActiveTab(tab.key);
                  }}
                  className="px-4 py-2 rounded-full border"
                  style={{
                    backgroundColor: isActive ? colors.primary : colors.muted,
                    borderColor: isActive ? colors.primary : colors.border,
                  }}
                  accessibilityRole="tab"
                  accessibilityLabel={`${label} view${isActive ? ', selected' : ''}`}
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{ color: isActive ? colors.primaryForeground : colors.foreground }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </BottomSheetSection>

        {/* Action buttons */}
        <View className="flex-row gap-3 pt-4 pb-6">
          <Button
            variant="outline"
            onPress={() => {
              setSearchQuery('');
              setActiveTab('queue');
              setShowFiltersSheet(false);
            }}
            className="flex-1"
          >
            Clear Filters
          </Button>
          <Button
            onPress={() => setShowFiltersSheet(false)}
            className="flex-1"
          >
            Done
          </Button>
        </View>
      </BottomSheet>

      {/* Quick Note Modal - Cross-platform (works on Android and iOS) */}
      <BottomSheet
        visible={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="Quick Note"
        snapPoints={['50%']}
      >
        <View style={{ gap: SPACING.md }}>
          <TextInput
            value={noteText}
            onChangeText={setNoteText}
            placeholder="Enter your note..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            autoFocus
            style={{
              backgroundColor: colors.muted,
              borderRadius: BORDER_RADIUS.md,
              padding: SPACING.md,
              fontSize: 16,
              color: colors.foreground,
              minHeight: 120,
            }}
          />
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <Button
              variant="secondary"
              onPress={() => setShowNoteModal(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onPress={handleSaveNote}
              disabled={!noteText.trim() || isCreating}
              loading={isCreating}
              style={{ flex: 1 }}
            >
              Save
            </Button>
          </View>
        </View>
      </BottomSheet>
    </ThemedSafeAreaView>
  );
}

export default CaptureScreen;
