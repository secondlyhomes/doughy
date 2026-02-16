// CallPilot — Active Call Screen
// Live coaching cards that appear during a call — NO transcript shown
// Cards refresh every 20-30 seconds via Haiku

import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  PhoneOff,
  X,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  HelpCircle,
  Clock,
} from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, ICON_SIZES } from '@/constants/design-tokens';
import { useActiveCall, type CoachingCard } from '../hooks/useCallPilot';

const COACHING_POLL_INTERVAL = 25_000; // 25 seconds

export function ActiveCallScreen() {
  const { id: callId } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const router = useRouter();
  const { cards, currentCard, isActive, startCall, endCall, fetchCoachingCards, dismissCard } = useActiveCall();
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Track last polling timestamp via ref to avoid stale closure
  const lastMsRef = useRef(0);

  // Update ref when cards change
  useEffect(() => {
    if (cards.length > 0) {
      lastMsRef.current = cards[cards.length - 1].timestamp_ms || 0;
    }
  }, [cards]);

  // Start call and polling
  useEffect(() => {
    if (callId) {
      startCall(callId);

      // Poll for coaching cards — uses ref to avoid stale closure
      pollRef.current = setInterval(() => {
        fetchCoachingCards(callId, lastMsRef.current).catch((err: unknown) => {
          console.error('[ActiveCall] Coaching poll failed:', err);
        });
      }, COACHING_POLL_INTERVAL);

      // Timer
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callId, startCall, fetchCoachingCards]);

  // Animate new card
  useEffect(() => {
    if (currentCard) {
      fadeAnim.setValue(0);
      Animated.spring(fadeAnim, {
        toValue: 1,
        damping: 15,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [currentCard, fadeAnim]);

  const handleEndCall = useCallback(async () => {
    if (!callId) return;
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    await endCall(callId);
    router.replace(`/(tabs)/calls/review/${callId}`);
  }, [callId, endCall, router]);

  const handleDismiss = useCallback(() => {
    if (callId && currentCard) {
      dismissCard(callId, currentCard.id);
    }
  }, [callId, currentCard, dismissCard]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top', 'bottom']}>
      {/* Timer header */}
      <View className="items-center pt-8 pb-4">
        <View className="flex-row items-center mb-2">
          <View className="w-3 h-3 rounded-full mr-2 bg-red-500" />
          <Text className="text-sm font-medium" style={{ color: colors.destructive }}>LIVE</Text>
        </View>
        <Text className="text-5xl font-light" style={{ color: colors.foreground }}>
          {mins}:{secs.toString().padStart(2, '0')}
        </Text>
        <Text className="text-sm mt-2" style={{ color: colors.mutedForeground }}>
          Call in progress
        </Text>
      </View>

      {/* Coaching Card Area */}
      <View className="flex-1 px-4 justify-center">
        {currentCard && !currentCard.was_dismissed ? (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
            }}
          >
            <CoachingCardView card={currentCard} colors={colors} onDismiss={handleDismiss} />
          </Animated.View>
        ) : (
          <View className="items-center py-8">
            <Lightbulb size={48} color={withOpacity(colors.mutedForeground, 'medium')} />
            <Text className="text-sm mt-4 text-center px-8" style={{ color: colors.mutedForeground }}>
              Coaching tips will appear here during the call
            </Text>
          </View>
        )}

        {/* Card count indicator */}
        {cards.length > 0 && (
          <View className="flex-row justify-center mt-4 gap-1">
            {cards.slice(-5).map((card, i) => (
              <View
                key={card.id}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: card.id === currentCard?.id ? colors.primary : colors.muted,
                }}
              />
            ))}
          </View>
        )}
      </View>

      {/* End Call Button */}
      <View className="items-center pb-8">
        <TouchableOpacity
          className="w-20 h-20 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.destructive }}
          onPress={handleEndCall}
          activeOpacity={0.7}
        >
          <PhoneOff size={32} color="white" />
        </TouchableOpacity>
        <Text className="text-xs mt-2" style={{ color: colors.mutedForeground }}>
          End Call
        </Text>
      </View>
    </ThemedSafeAreaView>
  );
}

function CoachingCardView({
  card,
  colors,
  onDismiss,
}: {
  card: CoachingCard;
  colors: ReturnType<typeof useThemeColors>;
  onDismiss: () => void;
}) {
  const { icon, borderColor } = getCardStyle(card, colors);

  return (
    <View
      className="rounded-2xl p-5"
      style={{
        backgroundColor: colors.card,
        borderWidth: 2,
        borderColor,
      }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          {icon}
          <Text className="ml-2 text-xs font-semibold uppercase tracking-wide" style={{ color: borderColor }}>
            {card.card_type.replace(/_/g, ' ')}
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <X size={ICON_SIZES.lg} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Text className="text-base leading-6" style={{ color: colors.foreground }}>
        {card.content}
      </Text>

      {/* Context hint */}
      {card.context && (
        <Text className="text-xs mt-3 italic" style={{ color: colors.mutedForeground }}>
          {card.context}
        </Text>
      )}
    </View>
  );
}

function getCardStyle(card: CoachingCard, colors: ReturnType<typeof useThemeColors>) {
  switch (card.priority) {
    case 'urgent':
      return {
        icon: <AlertTriangle size={ICON_SIZES.lg} color={colors.destructive} />,
        borderColor: colors.destructive,
      };
    case 'high':
      return {
        icon: <AlertTriangle size={ICON_SIZES.lg} color={colors.warning} />,
        borderColor: colors.warning,
      };
    default:
      if (card.card_type.includes('question')) {
        return {
          icon: <HelpCircle size={ICON_SIZES.lg} color={colors.info} />,
          borderColor: colors.info,
        };
      }
      return {
        icon: <Lightbulb size={ICON_SIZES.lg} color={colors.primary} />,
        borderColor: colors.primary,
      };
  }
}

export default ActiveCallScreen;
