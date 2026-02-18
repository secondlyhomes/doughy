// src/features/voip/screens/InCallScreen.tsx
// Full-screen call UI - removes distractions for focus mode
// Shows contact info, duration, AI Coach suggestions, and controls
// Transcript is collected in background for post-call summary

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { isVoipDevMode, MOCK_TRANSCRIPT_SEGMENTS, MOCK_EXTRACTED_DATA, MOCK_AI_SUGGESTIONS, VOIP_CONFIG } from '../config';

import { useThemeColors } from '@/contexts/ThemeContext';

import { CallControls } from '../components/CallControls';
import { AISuggestions, AISuggestionsHeader } from '../components/AISuggestions';
import { useVoipCallStore, selectIsInCall } from '../stores/voip-call-store';
import type { SubscriptionTier } from '../types';
import { VOIP_FEATURES_BY_TIER } from '../types';

import {
  getStatusDisplay,
  formatDuration,
  ContactAvatar,
  RecordingIndicator,
  PostCallSummary,
  styles,
} from './in-call';

interface InCallScreenProps {
  subscriptionTier?: SubscriptionTier;
}

export function InCallScreen({ subscriptionTier = 'pro' }: InCallScreenProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ phoneNumber?: string; contactId?: string; contactName?: string }>();

  // Debug: Log when component mounts (dev only)
  useEffect(() => {
    if (__DEV__) {
      console.log('[VOIP DEBUG] InCallScreen mounted!');
      console.log('[VOIP DEBUG] Params:', params);
    }
    return () => {
      if (__DEV__) console.log('[VOIP DEBUG] InCallScreen unmounted');
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentional mount-only logging

  // Post-call state
  const [showPostCallSummary, setShowPostCallSummary] = useState(false);
  const [mockTranscriptIndex, setMockTranscriptIndex] = useState(0);
  const [mockSuggestionIndex, setMockSuggestionIndex] = useState(0);

  // Ref for auto-scrolling suggestions
  const suggestionsScrollRef = useRef<ScrollView>(null);

  // Store
  const {
    activeCall,
    callStatus,
    callControls,
    transcript,
    aiSuggestions,
    duration,
    error,
    toggleMute,
    toggleSpeaker,
    toggleHold,
    endCall,
    dismissSuggestion,
    incrementDuration,
    addTranscriptSegment,
    addAISuggestion,
    reset,
  } = useVoipCallStore();

  const isInCall = useVoipCallStore(selectIsInCall);

  // Debug: Log call status changes (dev only)
  useEffect(() => {
    if (__DEV__) {
      console.log('[VOIP DEBUG] Call status changed to:', callStatus);
      console.log('[VOIP DEBUG] isInCall:', isInCall);
    }
  }, [callStatus, isInCall]);

  // Features based on tier
  const features = VOIP_FEATURES_BY_TIER[subscriptionTier];

  // Dev mode: simulate transcript being added during call
  useEffect(() => {
    if (!isVoipDevMode() || !VOIP_CONFIG.simulation.enableMockTranscript) return;
    if (callStatus !== 'connected') return;
    if (mockTranscriptIndex >= MOCK_TRANSCRIPT_SEGMENTS.length) return;

    const timer = setTimeout(() => {
      const segment = MOCK_TRANSCRIPT_SEGMENTS[mockTranscriptIndex];
      addTranscriptSegment({
        id: `mock-${Date.now()}`,
        speaker: segment.speaker,
        text: segment.text,
        timestamp: Date.now(),
        confidence: 0.95,
      });
      setMockTranscriptIndex((i) => i + 1);
    }, VOIP_CONFIG.simulation.transcriptInterval);

    return () => clearTimeout(timer);
  }, [callStatus, mockTranscriptIndex, addTranscriptSegment]);

  // Dev mode: simulate AI suggestions being shown during call
  useEffect(() => {
    if (!isVoipDevMode() || !VOIP_CONFIG.simulation.enableMockSuggestions) return;
    if (callStatus !== 'connected') return;
    if (mockSuggestionIndex >= MOCK_AI_SUGGESTIONS.length) return;

    const delay = 3000 + mockSuggestionIndex * 3000;
    if (__DEV__) console.log(`[VOIP DEBUG] Scheduling AI suggestion #${mockSuggestionIndex + 1} in ${delay}ms`);

    const timer = setTimeout(() => {
      const suggestion = MOCK_AI_SUGGESTIONS[mockSuggestionIndex];
      if (__DEV__) console.log('[VOIP DEBUG] Adding AI suggestion:', suggestion.type, '-', suggestion.text.slice(0, 50));
      addAISuggestion({
        id: `mock-suggestion-${Date.now()}`,
        type: suggestion.type,
        text: suggestion.text,
        confidence: suggestion.confidence,
        timestamp: Date.now(),
      });
      setMockSuggestionIndex((i) => i + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [callStatus, mockSuggestionIndex, addAISuggestion]);

  // Duration timer
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        incrementDuration();
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callStatus, incrementDuration]);

  // Handle call end
  const handleEndCall = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    endCall();

    if (VOIP_CONFIG.features.showPostCallSummary) {
      setTimeout(() => {
        setShowPostCallSummary(true);
      }, 500);
    } else {
      setTimeout(() => {
        reset();
        router.back();
      }, 1000);
    }
  }, [endCall, reset, router]);

  // Handle closing post-call summary
  const handleDismissSummary = useCallback(() => {
    setShowPostCallSummary(false);
    reset();
    router.back();
  }, [reset, router]);

  // Handle applying extracted data
  const handleApplyExtractedData = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (__DEV__) console.log('[DEV] Would apply extracted data:', MOCK_EXTRACTED_DATA);
    Alert.alert(
      'Data Applied',
      'Call summary and extracted information have been saved to the lead profile.',
      [{ text: 'OK', onPress: handleDismissSummary }]
    );
  }, [handleDismissSummary]);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert('Call Error', error, [
        {
          text: 'OK',
          onPress: () => {
            reset();
            router.back();
          },
        },
      ]);
    }
  }, [error, reset, router]);

  // Status display
  const statusDisplay = getStatusDisplay(callStatus);
  const statusColor = colors[statusDisplay.colorKey] || colors.mutedForeground;
  const contactName = params.contactName || activeCall?.phone_number || 'Unknown';

  // Post-call summary view
  if (showPostCallSummary) {
    return (
      <PostCallSummary
        duration={duration}
        contactName={contactName}
        transcript={transcript}
        topInset={insets.top}
        bottomInset={insets.bottom}
        onDismiss={handleDismissSummary}
        onApply={handleApplyExtractedData}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />

      {/* Background gradient */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top section: Contact info */}
      <View style={styles.topSection}>
        <ContactAvatar name={contactName} isConnected={callStatus === 'connected'} />

        <Text style={[styles.contactName, { color: '#FFFFFF' }]}>{contactName}</Text>

        <View style={styles.statusContainer}>
          <Circle size={8} color={statusColor} fill={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusDisplay.text}
          </Text>
        </View>

        <Text style={[
          styles.durationText,
          { color: '#FFFFFF' },
          !isInCall && styles.durationPlaceholder
        ]}>
          {isInCall ? formatDuration(duration) : '0:00'}
        </Text>

        {callControls.isRecording && features.recording && <RecordingIndicator />}
      </View>

      {/* Middle section: AI Coach suggestions */}
      <View style={styles.middleSection}>
        {(features.realtimeAISuggestions || isVoipDevMode()) && aiSuggestions.length > 0 && (
          <View style={styles.suggestionsWrapper}>
            <AISuggestionsHeader />
            <ScrollView
              ref={suggestionsScrollRef}
              style={styles.suggestionsScroll}
              contentContainerStyle={styles.suggestionsContent}
              showsVerticalScrollIndicator={false}
              fadingEdgeLength={80}
              onContentSizeChange={() => {
                suggestionsScrollRef.current?.scrollToEnd({ animated: true });
              }}
            >
              <AISuggestions
                suggestions={aiSuggestions}
                onDismiss={dismissSuggestion}
                hideHeader
                darkMode
              />
            </ScrollView>
          </View>
        )}
      </View>

      {/* Bottom section: Call controls */}
      <View style={styles.bottomSection}>
        <CallControls
          controls={callControls}
          onToggleMute={toggleMute}
          onToggleSpeaker={toggleSpeaker}
          onToggleHold={toggleHold}
          onEndCall={handleEndCall}
          disabled={!isInCall && callStatus !== 'ringing'}
        />
      </View>

      {/* Recording disclosure */}
      {features.recording && (
        <View style={styles.disclosureContainer}>
          <Text style={[styles.disclosureText, { color: 'rgba(255, 255, 255, 0.4)' }]}>
            This call may be recorded for quality purposes
          </Text>
        </View>
      )}
    </View>
  );
}

export default InCallScreen;
