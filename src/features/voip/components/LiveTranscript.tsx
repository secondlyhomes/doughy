// src/features/voip/components/LiveTranscript.tsx
// Real-time transcript display during calls

import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import { MessageCircle, User } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES, ICON_SIZES } from '@/constants/design-tokens';
import type { TranscriptSegment } from '../types';

interface LiveTranscriptProps {
  transcript: TranscriptSegment[];
  isLoading?: boolean;
  maxHeight?: number;
}

function TranscriptBubble({ segment }: { segment: TranscriptSegment }) {
  const colors = useThemeColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isUser = segment.speaker === 'user';

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View
      style={[
        styles.bubbleContainer,
        { opacity: fadeAnim },
        isUser ? styles.userBubbleContainer : styles.contactBubbleContainer,
      ]}
    >
      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: isUser
              ? withOpacity(colors.primary, 'light')
              : withOpacity(colors.info, 'light'),
          },
        ]}
      >
        {isUser ? (
          <User size={ICON_SIZES.sm} color={colors.primary} />
        ) : (
          <MessageCircle size={ICON_SIZES.sm} color={colors.info} />
        )}
      </View>

      {/* Bubble */}
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser
              ? colors.primary
              : colors.muted,
          },
          isUser ? styles.userBubble : styles.contactBubble,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isUser ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {segment.text}
        </Text>
        {segment.confidence !== undefined && segment.confidence < 0.8 && (
          <Text
            style={[
              styles.confidenceLabel,
              { color: isUser ? withOpacity(colors.primaryForeground, 'medium') : colors.mutedForeground },
            ]}
          >
            (low confidence)
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

function LoadingIndicator() {
  const colors = useThemeColors();
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.loadingContainer}>
      <Animated.View
        style={[
          styles.loadingDot,
          { backgroundColor: colors.mutedForeground, opacity: pulseAnim },
        ]}
      />
      <Animated.View
        style={[
          styles.loadingDot,
          { backgroundColor: colors.mutedForeground, opacity: pulseAnim, marginLeft: 4 },
        ]}
      />
      <Animated.View
        style={[
          styles.loadingDot,
          { backgroundColor: colors.mutedForeground, opacity: pulseAnim, marginLeft: 4 },
        ]}
      />
    </View>
  );
}

export function LiveTranscript({
  transcript,
  isLoading = false,
  maxHeight = 200,
}: LiveTranscriptProps) {
  const colors = useThemeColors();
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (transcript.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [transcript.length]);

  if (transcript.length === 0 && !isLoading) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.muted }]}>
        <MessageCircle size={ICON_SIZES.xl} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Live transcript will appear here...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, maxHeight }]}>
      <View style={styles.header}>
        <MessageCircle size={ICON_SIZES.md} color={colors.primary} />
        <Text style={[styles.headerText, { color: colors.foreground }]}>
          Live Transcript
        </Text>
        {isLoading && (
          <View
            style={[
              styles.liveBadge,
              { backgroundColor: withOpacity(colors.success, 'light') },
            ]}
          >
            <View style={[styles.liveIndicator, { backgroundColor: colors.success }]} />
            <Text style={[styles.liveText, { color: colors.success }]}>LIVE</Text>
          </View>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {transcript.map((segment) => (
          <TranscriptBubble key={segment.id} segment={segment} />
        ))}
        {isLoading && <LoadingIndicator />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    gap: SPACING.xs,
  },
  headerText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  bubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  userBubbleContainer: {
    flexDirection: 'row-reverse',
  },
  contactBubbleContainer: {
    flexDirection: 'row',
  },
  avatar: {
    width: ICON_SIZES.xl,
    height: ICON_SIZES.xl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  contactBubble: {
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  confidenceLabel: {
    fontSize: FONT_SIZES['2xs'],
    fontStyle: 'italic',
    marginTop: 2,
  },
  emptyContainer: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default LiveTranscript;
