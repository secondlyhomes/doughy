// src/features/focus/screens/FocusScreen.tsx
// Focus tab - dual-mode screen for property-focused work and inbox awareness

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { ThemedSafeAreaView } from '@/components';
import { BottomSheet, BottomSheetSection, Button, SearchBar } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import { useFocusMode } from '@/context/FocusModeContext';
import { SPACING, BORDER_RADIUS, ICON_SIZES, TOUCH_TARGETS, FONT_SIZES } from '@/constants/design-tokens';
import { withOpacity, getShadowStyle } from '@/lib/design-utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDebounce } from '@/hooks';
import { supabase } from '@/lib/supabase';
import { extractFromImage } from '@/lib/openai';
import {
  Mic,
  Phone,
  Upload,
  Camera,
  StickyNote,
} from 'lucide-react-native';

import { TriageQueue } from '@/features/capture/components/TriageQueue';
import { useCreateCaptureItem, usePendingCaptureCount } from '@/features/capture/hooks/useCaptureItems';
import { VoiceMemoRecorder } from '@/features/conversations/components/VoiceMemoRecorder';
import { useUnreadCounts } from '@/features/layout/hooks/useUnreadCounts';

import { FocusHeader, NudgesList, TouchLogSheet } from '../components';
import { useNudges, usePropertyTimeline } from '../hooks';

// ============================================
// Helper: Base64 decode for native platforms
// ============================================

function decodeBase64(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  let bufferLength = base64.length * 0.75;
  if (base64[base64.length - 1] === '=') {
    bufferLength--;
    if (base64[base64.length - 2] === '=') {
      bufferLength--;
    }
  }

  const bytes = new Uint8Array(bufferLength);
  let p = 0;

  for (let i = 0; i < base64.length; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i)];
    const encoded2 = lookup[base64.charCodeAt(i + 1)];
    const encoded3 = lookup[base64.charCodeAt(i + 2)];
    const encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (base64[i + 2] !== '=') {
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    }
    if (base64[i + 3] !== '=') {
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
  }

  return bytes;
}

// ============================================
// Helper: Upload file to Supabase Storage
// ============================================

async function uploadToSupabaseStorage(
  localUri: string,
  fileName: string,
  mimeType: string
): Promise<string | null> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      throw new Error('User not authenticated');
    }

    // Generate unique file path
    const fileExt = fileName.split('.').pop() || 'file';
    const uniqueFileName = `${userData.user.id}/captures/${Date.now()}.${fileExt}`;

    // Read file content
    let fileData: string | Blob;

    if (Platform.OS === 'web') {
      const response = await fetch(localUri);
      fileData = await response.blob();
    } else {
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: 'base64',
      });
      fileData = base64;
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = Platform.OS === 'web'
      ? await supabase.storage
          .from('capture-files')
          .upload(uniqueFileName, fileData as Blob, {
            contentType: mimeType,
          })
      : await supabase.storage
          .from('capture-files')
          .upload(uniqueFileName, decodeBase64(fileData as string), {
            contentType: mimeType,
          });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // Fallback to local URI if storage upload fails
      return localUri;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('capture-files')
      .getPublicUrl(uniqueFileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Failed to upload to Supabase Storage:', error);
    // Return local URI as fallback
    return localUri;
  }
}

// ============================================
// Spacing Constants
// ============================================

const SEARCH_BAR_CONTAINER_HEIGHT =
  SPACING.sm +
  40 +
  SPACING.xs;

const SEARCH_BAR_TO_CONTENT_GAP = SPACING.lg;

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
          width: TOUCH_TARGETS.COMFORTABLE,
          height: TOUCH_TARGETS.COMFORTABLE,
          borderRadius: BORDER_RADIUS.lg,
          backgroundColor: withOpacity(color, 'light'),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={ICON_SIZES.lg} color={color} />
      </View>
      <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: '500', color: colors.foreground }}>
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

export function FocusScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { activeMode, focusedProperty } = useFocusMode();
  const [activeTab, setActiveTab] = useState<TabKey>('queue');
  const [showRecorder, setShowRecorder] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showTouchLogSheet, setShowTouchLogSheet] = useState(false);
  const [nudgeTouchLogLead, setNudgeTouchLogLead] = useState<{ id: string; name?: string } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);

  const { mutateAsync: createItem, isPending: isCreating } = useCreateCaptureItem();
  const { count: pendingCount } = usePendingCaptureCount();
  const { setCaptureItems } = useUnreadCounts();
  const { nudges, summary, isLoading: nudgesLoading } = useNudges();

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
        // Auto-link to focused property if in focus mode
        ...(focusedProperty ? { assigned_property_id: focusedProperty.id } : {}),
      } as any);
      setShowRecorder(false);
      Alert.alert('Saved', focusedProperty
        ? `Voice memo saved and linked to ${focusedProperty.address}.`
        : 'Voice memo added to triage queue.');
    } catch {
      Alert.alert('Error', 'Failed to save voice memo. Please try again.');
    }
  }, [createItem, focusedProperty]);

  // Handle document upload
  const handleUploadDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/*', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      // Upload to Supabase Storage for persistence
      const persistedUrl = await uploadToSupabaseStorage(
        file.uri,
        file.name,
        file.mimeType || 'application/octet-stream'
      );

      await createItem({
        type: 'document',
        title: file.name,
        file_name: file.name,
        file_url: persistedUrl || file.uri,
        file_size: file.size,
        mime_type: file.mimeType,
        source: 'upload',
        ...(focusedProperty ? { assigned_property_id: focusedProperty.id } : {}),
      } as any);
      Alert.alert('Uploaded', focusedProperty
        ? `Document linked to ${focusedProperty.address}.`
        : 'Document added to triage queue.');
    } catch {
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    }
  }, [createItem, focusedProperty]);

  // Handle photo capture with optional AI analysis
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
      const fileName = photo.fileName || `photo_${Date.now()}.jpg`;
      const mimeType = photo.mimeType || 'image/jpeg';

      // Upload to Supabase Storage for persistence
      const persistedUrl = await uploadToSupabaseStorage(photo.uri, fileName, mimeType);

      // Ask if user wants to analyze the photo with AI
      Alert.alert(
        'Analyze Photo?',
        'Would you like AI to extract data from this image? (MLS sheets, documents, business cards)',
        [
          {
            text: 'Just Save',
            style: 'cancel',
            onPress: async () => {
              await createItem({
                type: 'photo',
                title: `Photo ${new Date().toLocaleDateString()}`,
                file_url: persistedUrl || photo.uri,
                file_name: fileName,
                mime_type: mimeType,
                source: 'app_camera',
                ...(focusedProperty ? { assigned_property_id: focusedProperty.id } : {}),
              } as any);
              Alert.alert('Saved', focusedProperty
                ? `Photo linked to ${focusedProperty.address}.`
                : 'Photo added to triage queue.');
            },
          },
          {
            text: 'Analyze with AI',
            onPress: async () => {
              try {
                // Show processing indicator
                Alert.alert('Analyzing...', 'AI is extracting data from your image. This may take a moment.');

                // Call AI extraction
                const extractionResult = await extractFromImage(photo.uri);

                // Save with extracted data
                await createItem({
                  type: 'photo',
                  title: `Photo ${new Date().toLocaleDateString()} (${extractionResult.type})`,
                  file_url: persistedUrl || photo.uri,
                  file_name: fileName,
                  mime_type: mimeType,
                  source: 'app_camera',
                  ai_extracted_data: extractionResult.extractedData,
                  ai_confidence: extractionResult.confidence,
                  ...(focusedProperty ? { assigned_property_id: focusedProperty.id } : {}),
                } as any);

                // Show what was extracted
                const extractedKeys = Object.keys(extractionResult.extractedData || {});
                const extractedSummary = extractedKeys.length > 0
                  ? `Extracted: ${extractedKeys.slice(0, 3).join(', ')}${extractedKeys.length > 3 ? '...' : ''}`
                  : 'No data extracted';

                Alert.alert(
                  'Analysis Complete',
                  `Document type: ${extractionResult.type}\n${extractedSummary}\n\nConfidence: ${Math.round((extractionResult.confidence || 0) * 100)}%`
                );
              } catch (analysisError) {
                console.error('AI analysis failed:', analysisError);
                // Still save the photo even if analysis fails
                await createItem({
                  type: 'photo',
                  title: `Photo ${new Date().toLocaleDateString()}`,
                  file_url: persistedUrl || photo.uri,
                  file_name: fileName,
                  mime_type: mimeType,
                  source: 'app_camera',
                  ...(focusedProperty ? { assigned_property_id: focusedProperty.id } : {}),
                } as any);
                Alert.alert('Photo Saved', 'AI analysis failed, but your photo was saved.');
              }
            },
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  }, [createItem, focusedProperty]);

  // Handle quick note
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
        ...(focusedProperty ? { assigned_property_id: focusedProperty.id } : {}),
      } as any);
      setShowNoteModal(false);
      setNoteText('');
      Alert.alert('Saved', focusedProperty
        ? `Note linked to ${focusedProperty.address}.`
        : 'Note added to triage queue.');
    } catch {
      Alert.alert('Error', 'Failed to save note. Please try again.');
    }
  }, [createItem, noteText, focusedProperty]);

  // Handle log call - opens TouchLogSheet
  const handleLogCall = useCallback(() => {
    if (!focusedProperty?.leadId) {
      Alert.alert('No Lead Selected', 'Please select a property with an associated lead to log a call.');
      return;
    }
    setShowTouchLogSheet(true);
  }, [focusedProperty]);

  // Handle log call from nudge inline action
  const handleNudgeLogCall = useCallback((leadId: string, leadName?: string) => {
    setNudgeTouchLogLead({ id: leadId, name: leadName });
  }, []);

  // Check if any filters are active
  const hasActiveFilters = searchQuery.trim().length > 0 || activeTab !== 'queue';

  // Voice recorder full screen
  if (showRecorder) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <View style={{ flex: 1, padding: SPACING.lg, justifyContent: 'center' }}>
          <VoiceMemoRecorder
            onSave={handleRecordComplete}
            onCancel={() => setShowRecorder(false)}
            maxDuration={600}
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
            placeholder={activeMode === 'focus' ? 'Search timeline...' : 'Search captures...'}
            size="md"
            glass={true}
            onFilter={() => setShowFiltersSheet(true)}
            hasActiveFilters={hasActiveFilters}
          />
        </View>
      </View>

      {/* Main Content - below search bar */}
      <View style={{ flex: 1, paddingTop: SEARCH_BAR_CONTAINER_HEIGHT + SEARCH_BAR_TO_CONTENT_GAP }}>
        {/* Focus Header with mode switcher */}
        <FocusHeader nudgeCount={summary.total} />

        {/* Mode-specific content */}
        {activeMode === 'focus' ? (
          // Focus Mode Content
          <View style={{ flex: 1 }}>
            {/* Quick Actions - only show when property is selected */}
            {focusedProperty && (
              <View style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.md }}>
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
                    <CaptureAction
                      icon={Phone}
                      label="Log Call"
                      color={colors.info}
                      onPress={handleLogCall}
                    />
                    <CaptureAction
                      icon={Upload}
                      label="Upload"
                      color={colors.primary}
                      onPress={handleUploadDocument}
                    />
                  </ScrollView>
                </View>
              </View>
            )}

            {/* Property Timeline or empty state */}
            {focusedProperty ? (
              <View style={{ flex: 1 }}>
                <TriageQueue
                  showAssigned={true}
                  searchQuery={debouncedSearchQuery}
                  propertyId={focusedProperty.id}
                />
              </View>
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: SPACING.xl,
                }}
              >
                <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center' }}>
                  Select a property above to start capturing
                </Text>
              </View>
            )}
          </View>
        ) : (
          // Inbox Mode Content
          <View style={{ flex: 1 }}>
            {/* Quick Actions in Inbox mode too */}
            <View style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.md }}>
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
                  <CaptureAction
                    icon={Phone}
                    label="Log Call"
                    color={colors.info}
                    onPress={handleLogCall}
                  />
                  <CaptureAction
                    icon={Upload}
                    label="Upload"
                    color={colors.primary}
                    onPress={handleUploadDocument}
                  />
                </ScrollView>
              </View>
            </View>

            {/* Nudges List */}
            <NudgesList
              nudges={nudges}
              summary={summary}
              isLoading={nudgesLoading}
              onLogCall={handleNudgeLogCall}
            />
          </View>
        )}
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

      {/* Quick Note Modal */}
      <BottomSheet
        visible={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title={focusedProperty ? `Note for ${focusedProperty.address}` : 'Quick Note'}
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

      {/* Touch Log Sheet for Log Call (Focus mode) */}
      <TouchLogSheet
        visible={showTouchLogSheet}
        onClose={() => setShowTouchLogSheet(false)}
        focusedProperty={focusedProperty}
      />

      {/* Touch Log Sheet for Nudge inline action (Inbox mode) */}
      <TouchLogSheet
        visible={!!nudgeTouchLogLead}
        onClose={() => setNudgeTouchLogLead(null)}
        focusedProperty={nudgeTouchLogLead ? {
          id: '', // No property context
          address: '',
          city: '',
          state: '',
          leadId: nudgeTouchLogLead.id,
          leadName: nudgeTouchLogLead.name,
        } : null}
      />
    </ThemedSafeAreaView>
  );
}

export default FocusScreen;
