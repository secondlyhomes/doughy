// src/features/field-mode/screens/FieldModeScreen.tsx
// Main Field Mode screen for property walkthroughs

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Sparkles,
  Save,
  Camera,
  Mic,
  CheckCircle2,
} from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { LoadingSpinner, TAB_BAR_HEIGHT, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhotoBucket, PHOTO_BUCKET_CONFIG } from '../../deals/types';
import { useWalkthrough } from '../hooks/useWalkthrough';
import { PhotoBucketCard } from '../components/PhotoBucketCard';
import { VoiceMemoRecorder } from '../components/VoiceMemoRecorder';
import {
  WalkthroughSummary,
  WalkthroughSummaryPlaceholder,
} from '../components/WalkthroughSummary';

export function FieldModeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dealId: string }>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const dealId = params.dealId || 'demo';

  const {
    walkthrough,
    items,
    aiSummary,
    progress,
    isLoading,
    addPhoto,
    addVoiceMemo,
    removeItem,
    getItemsForBucket,
    organizeWithAI,
    isOrganizing,
    saveWalkthrough,
    isSaving,
  } = useWalkthrough({ dealId });

  // Voice memo recording state
  const [recordingBucket, setRecordingBucket] = useState<PhotoBucket | null>(null);

  // Handle voice memo recording
  const handleRecordMemo = useCallback((bucket: PhotoBucket) => {
    setRecordingBucket(bucket);
  }, []);

  // Handle voice memo save
  const handleSaveMemo = useCallback(
    (bucket: PhotoBucket, uri: string) => {
      addVoiceMemo(bucket, uri);
      setRecordingBucket(null);
    },
    [addVoiceMemo]
  );

  // Handle AI organize
  const handleOrganize = useCallback(async () => {
    if (items.length === 0) {
      Alert.alert(
        'No Content',
        'Add some photos or voice memos before organizing with AI.'
      );
      return;
    }

    Alert.alert(
      'Organize with AI',
      'AI will analyze your photos and voice memos to generate a summary of issues, questions, and scope of work.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Organize', onPress: organizeWithAI },
      ]
    );
  }, [items.length, organizeWithAI]);

  // Handle save
  const handleSave = useCallback(async () => {
    await saveWalkthrough();
    Alert.alert('Saved', 'Your walkthrough has been saved.');
  }, [saveWalkthrough]);

  // Get bucket list
  const buckets = Object.keys(PHOTO_BUCKET_CONFIG) as PhotoBucket[];

  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen />
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-1"
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
              Field Mode
            </Text>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              {progress.totalPhotos} photos • {progress.totalMemos} memos
            </Text>
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          className="p-2"
          accessibilityLabel="Save walkthrough"
          accessibilityRole="button"
        >
          {isSaving ? (
            <LoadingSpinner size="small" />
          ) : (
            <Save size={22} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SAFE_PADDING + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress indicator */}
        <View
          className="flex-row items-center justify-between p-3 rounded-lg mb-4"
          style={{ backgroundColor: colors.muted }}
        >
          <View className="flex-row items-center gap-2">
            {progress.isComplete ? (
              <CheckCircle2 size={20} color={colors.success} />
            ) : (
              <Camera size={20} color={colors.mutedForeground} />
            )}
            <Text className="text-sm" style={{ color: colors.foreground }}>
              {progress.bucketsWithContent.length} of {buckets.length} areas documented
            </Text>
          </View>
          {progress.isComplete && (
            <Text className="text-xs font-medium" style={{ color: colors.success }}>Ready to organize</Text>
          )}
        </View>

        {/* AI Summary (if available) */}
        {aiSummary ? (
          <WalkthroughSummary summary={aiSummary} />
        ) : (
          <WalkthroughSummaryPlaceholder />
        )}

        {/* Photo buckets */}
        {buckets.map((bucket) => (
          <PhotoBucketCard
            key={bucket}
            bucket={bucket}
            items={getItemsForBucket(bucket)}
            onAddPhoto={addPhoto}
            onRemoveItem={removeItem}
            onRecordMemo={handleRecordMemo}
            disabled={walkthrough.status === 'organized'}
          />
        ))}
      </ScrollView>

      {/* AI Organize FAB */}
      {!aiSummary && (
        <TouchableOpacity
          className="absolute right-4 flex-row items-center gap-2 px-5 py-3 rounded-full shadow-lg"
          style={{ bottom: TAB_BAR_HEIGHT + insets.bottom + 16, backgroundColor: colors.primary }}
          onPress={handleOrganize}
          disabled={isOrganizing || items.length === 0}
          accessibilityLabel="Organize with AI"
          accessibilityRole="button"
        >
          {isOrganizing ? (
            <>
              <LoadingSpinner size="small" color={colors.primaryForeground} />
              <Text className="text-base font-semibold" style={{ color: colors.primaryForeground }}>
                Organizing...
              </Text>
            </>
          ) : (
            <>
              <Sparkles size={20} color={colors.primaryForeground} />
              <Text className="text-base font-semibold" style={{ color: colors.primaryForeground }}>
                AI Organize
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Voice Memo Recorder Modal */}
      <VoiceMemoRecorder
        visible={recordingBucket !== null}
        bucket={recordingBucket}
        onClose={() => setRecordingBucket(null)}
        onSave={handleSaveMemo}
      />
    </ThemedSafeAreaView>
  );
}

export default FieldModeScreen;
