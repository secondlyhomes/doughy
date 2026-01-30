// src/features/voip/screens/InCallScreen.tsx
// Full-screen call UI - removes distractions for focus mode
// Shows contact info, duration, AI Coach suggestions, and controls
// Transcript is collected in background for post-call summary

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Animated, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Phone, User, Circle, X, Check, ChevronRight, FileText, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { isVoipDevMode, MOCK_TRANSCRIPT_SEGMENTS, MOCK_EXTRACTED_DATA, MOCK_AI_SUGGESTIONS, VOIP_CONFIG } from '../config';

import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';

import { CallControls } from '../components/CallControls';
import { AISuggestions, AISuggestionsHeader } from '../components/AISuggestions';
import { useVoipCallStore, selectIsInCall } from '../stores/voip-call-store';
import type { CallStatus, SubscriptionTier } from '../types';
import { VOIP_FEATURES_BY_TIER } from '../types';

// ============================================
// Call Status Display
// ============================================

// Semantic color keys for call status - maps to theme colors
type StatusColorKey = 'warning' | 'success' | 'muted' | 'destructive';

function getStatusDisplay(status: CallStatus | null): { text: string; colorKey: StatusColorKey } {
  switch (status) {
    case 'initiating':
      return { text: 'Initiating...', colorKey: 'warning' };
    case 'ringing':
      return { text: 'Ringing...', colorKey: 'warning' };
    case 'connecting':
      return { text: 'Connecting...', colorKey: 'warning' };
    case 'connected':
      return { text: 'Connected', colorKey: 'success' };
    case 'on_hold':
      return { text: 'On Hold', colorKey: 'warning' };
    case 'ended':
      return { text: 'Call Ended', colorKey: 'muted' };
    case 'failed':
      return { text: 'Call Failed', colorKey: 'destructive' };
    case 'busy':
      return { text: 'Busy', colorKey: 'destructive' };
    case 'no_answer':
      return { text: 'No Answer', colorKey: 'destructive' };
    default:
      return { text: 'Unknown', colorKey: 'muted' };
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================
// Contact Avatar
// ============================================

interface ContactAvatarProps {
  name: string;
  isConnected: boolean;
}

function ContactAvatar({ name, isConnected }: ContactAvatarProps) {
  const colors = useThemeColors();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (isConnected) {
      // Pulse animation when connected
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      // Ring animation when not connected
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(ringAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(ringAnim, {
            toValue: 0.5,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    }

    // Cleanup: stop animation when component unmounts or isConnected changes
    return () => {
      if (animation) {
        animation.stop();
      }
      // Reset to default values
      pulseAnim.setValue(1);
      ringAnim.setValue(0.5);
    };
  }, [isConnected, pulseAnim, ringAnim]);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.avatarContainer}>
      {/* Ring effect */}
      {!isConnected && (
        <Animated.View
          style={[
            styles.avatarRing,
            {
              borderColor: colors.primary,
              opacity: ringAnim,
              transform: [{ scale: ringAnim.interpolate({
                inputRange: [0.5, 1],
                outputRange: [1, 1.3],
              }) }],
            },
          ]}
        />
      )}

      <Animated.View
        style={[
          styles.avatar,
          {
            backgroundColor: colors.primary,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Text style={styles.avatarText}>{initials || <User size={40} color="#FFFFFF" />}</Text>
      </Animated.View>
    </View>
  );
}

// ============================================
// Recording Indicator
// ============================================

function RecordingIndicator() {
  const colors = useThemeColors();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => {
      animation.stop();
      pulseAnim.setValue(1);
    };
  }, [pulseAnim]);

  return (
    <View style={[styles.recordingContainer, { backgroundColor: withOpacity(colors.destructive, 'light') }]}>
      <Animated.View style={[styles.recordingDot, { backgroundColor: colors.destructive, opacity: pulseAnim }]} />
      <Text style={[styles.recordingText, { color: colors.destructive }]}>Recording</Text>
    </View>
  );
}

// ============================================
// Main InCallScreen
// ============================================

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

    // Show suggestions faster for demo: 3s, 6s, 9s, 12s
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

  // Duration timer - uses incrementDuration to avoid stale closure
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        incrementDuration();
      }, 1000);
    } else {
      // Clear timer when not connected (on_hold, ended, etc.)
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

    // Show post-call summary if enabled
    if (VOIP_CONFIG.features.showPostCallSummary) {
      setTimeout(() => {
        setShowPostCallSummary(true);
      }, 500);
    } else {
      // Navigate back after a short delay
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

  // Handle applying extracted data (would save to lead/property in real implementation)
  const handleApplyExtractedData = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Actually apply the extracted data to the lead/property
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

  // Status display - map colorKey to actual theme color
  const statusDisplay = getStatusDisplay(callStatus);
  const statusColor = colors[statusDisplay.colorKey] || colors.mutedForeground;
  const contactName = params.contactName || activeCall?.phone_number || 'Unknown';

  // Post-call summary view
  if (showPostCallSummary) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Header */}
        <View style={styles.summaryHeader}>
          <TouchableOpacity onPress={handleDismissSummary} style={styles.closeButton}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.summaryTitle}>Call Summary</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.summaryScroll} contentContainerStyle={styles.summaryContent}>
          {/* Call Info */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardHeader}>
              <Phone size={18} color={colors.primary} />
              <Text style={styles.summaryCardTitle}>Call Details</Text>
            </View>
            <Text style={styles.summaryText}>Duration: {formatDuration(duration)}</Text>
            <Text style={styles.summaryText}>Contact: {contactName}</Text>
          </View>

          {/* Transcript Preview */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardHeader}>
              <FileText size={18} color={colors.primary} />
              <Text style={styles.summaryCardTitle}>Transcript</Text>
            </View>
            {transcript.length > 0 ? (
              transcript.slice(0, 4).map((segment, index) => (
                <View key={segment.id || index} style={styles.transcriptLine}>
                  <Text style={styles.transcriptSpeaker}>
                    {segment.speaker === 'user' ? 'You' : 'Contact'}:
                  </Text>
                  <Text style={styles.transcriptText}>{segment.text}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.summaryTextMuted}>No transcript available</Text>
            )}
            {transcript.length > 4 && (
              <Text style={styles.summaryTextMuted}>...and {transcript.length - 4} more lines</Text>
            )}
          </View>

          {/* Extracted Data */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardHeader}>
              <Sparkles size={18} color={colors.primary} />
              <Text style={styles.summaryCardTitle}>AI Extracted Data</Text>
            </View>

            <Text style={styles.extractedLabel}>Contact Info</Text>
            <Text style={styles.summaryText}>• Name: {MOCK_EXTRACTED_DATA.contact.name}</Text>
            <Text style={styles.summaryText}>• Relationship: {MOCK_EXTRACTED_DATA.contact.relationship}</Text>

            <Text style={[styles.extractedLabel, { marginTop: SPACING.sm }]}>Property Details</Text>
            <Text style={styles.summaryText}>• {MOCK_EXTRACTED_DATA.property.bedrooms} bed, {MOCK_EXTRACTED_DATA.property.bathrooms} bath</Text>
            <Text style={styles.summaryText}>• {MOCK_EXTRACTED_DATA.property.sqft} sqft, built {MOCK_EXTRACTED_DATA.property.yearBuilt}</Text>
            <Text style={styles.summaryText}>• Condition: {MOCK_EXTRACTED_DATA.property.condition}</Text>

            <Text style={[styles.extractedLabel, { marginTop: SPACING.sm }]}>Deal Info</Text>
            <Text style={styles.summaryText}>• Asking: ${MOCK_EXTRACTED_DATA.deal.askingPrice.toLocaleString()}</Text>
            <Text style={styles.summaryText}>• Motivation: {MOCK_EXTRACTED_DATA.deal.motivation}</Text>
            <Text style={styles.summaryText}>• Timeline: {MOCK_EXTRACTED_DATA.deal.timeline}</Text>
          </View>

          {/* Suggested Actions */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardHeader}>
              <ChevronRight size={18} color={colors.primary} />
              <Text style={styles.summaryCardTitle}>Suggested Next Steps</Text>
            </View>
            {MOCK_EXTRACTED_DATA.suggestedActions.map((action, index) => (
              <View key={index} style={styles.actionItem}>
                <View style={[
                  styles.priorityBadge,
                  { backgroundColor: action.priority === 'high' ? colors.destructive : colors.warning }
                ]}>
                  <Text style={styles.priorityText}>{action.priority}</Text>
                </View>
                <Text style={styles.actionText}>{action.action}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.summaryActions}>
          <TouchableOpacity
            style={[styles.summaryButton, styles.dismissButton]}
            onPress={handleDismissSummary}
          >
            <X size={20} color="#FFFFFF" />
            <Text style={styles.summaryButtonText}>Dismiss</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.summaryButton, styles.applyButton, { backgroundColor: colors.primary }]}
            onPress={handleApplyExtractedData}
          >
            <Check size={20} color="#FFFFFF" />
            <Text style={styles.summaryButtonText}>Apply to Lead</Text>
          </TouchableOpacity>
        </View>
      </View>
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

        <Text style={styles.contactName}>{contactName}</Text>

        <View style={styles.statusContainer}>
          <Circle size={8} color={statusColor} fill={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusDisplay.text}
          </Text>
        </View>

        {/* Always reserve space for duration to prevent layout shift */}
        <Text style={[
          styles.durationText,
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
            {/* AI Coach header - always visible */}
            <AISuggestionsHeader />

            {/* Scrollable suggestions */}
            <ScrollView
              ref={suggestionsScrollRef}
              style={styles.suggestionsScroll}
              contentContainerStyle={styles.suggestionsContent}
              showsVerticalScrollIndicator={false}
              fadingEdgeLength={80}
              onContentSizeChange={() => {
                // Auto-scroll to bottom when new suggestions added
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
          <Text style={styles.disclosureText}>
            This call may be recorded for quality purposes
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  avatarRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  durationText: {
    fontSize: 48,
    fontWeight: '200',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    minHeight: 58, // Reserve space to prevent layout shift
  },
  durationPlaceholder: {
    opacity: 0.3, // Dim when not connected
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    // backgroundColor set inline using theme colors.destructive
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    // backgroundColor set inline using theme colors.destructive
  },
  recordingText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    // color set inline using theme colors.destructive
  },
  middleSection: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: 'flex-end', // Anchor suggestions to bottom, scroll up
  },
  suggestionsWrapper: {
    flex: 1,
    maxHeight: 350, // Constrain height
  },
  suggestionsScroll: {
    flex: 1,
    marginTop: SPACING.sm,
  },
  suggestionsContent: {
    paddingBottom: SPACING.md,
  },
  bottomSection: {
    paddingBottom: SPACING.md,
  },
  disclosureContainer: {
    alignItems: 'center',
    paddingBottom: SPACING.sm,
  },
  disclosureText: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  // Post-call summary styles
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryScroll: {
    flex: 1,
  },
  summaryContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  summaryCardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryText: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  summaryTextMuted: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  transcriptLine: {
    marginBottom: SPACING.xs,
  },
  transcriptSpeaker: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
  },
  transcriptText: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  extractedLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  actionText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  summaryActions: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  summaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
  },
  dismissButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  applyButton: {
    // backgroundColor set dynamically via colors.primary
  },
  summaryButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default InCallScreen;
