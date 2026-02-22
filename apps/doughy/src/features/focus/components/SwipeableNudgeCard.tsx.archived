// src/features/focus/components/SwipeableNudgeCard.tsx
// Swipeable nudge card with snooze and dismiss actions

import React, { useRef, useCallback, memo } from 'react';
import { View, Text, Alert, Animated } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { Clock, X, AlarmClock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/context/ThemeContext';
import { useQueryClient } from '@tanstack/react-query';

import { Nudge } from '../types';
import { NudgeCard } from './NudgeCard';

// Storage key for snoozed nudges
const SNOOZED_NUDGES_KEY = 'doughy_snoozed_nudges';

interface SnoozeEntry {
  nudgeId: string;
  expiresAt: number; // Unix timestamp
}

interface SwipeableNudgeCardProps {
  nudge: Nudge;
  onPress?: () => void;
  onLogCall?: (leadId: string, leadName?: string) => void;
  onDismiss?: (nudgeId: string) => void;
  onSnooze?: (nudgeId: string, duration: number) => void;
}

function SwipeableNudgeCardComponent({
  nudge,
  onPress,
  onLogCall,
  onDismiss,
  onSnooze,
}: SwipeableNudgeCardProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const colors = useThemeColors();
  const queryClient = useQueryClient();

  const closeSwipeable = useCallback(() => {
    swipeableRef.current?.close();
  }, []);

  // Snooze the nudge
  const handleSnooze = useCallback(async (days: number) => {
    closeSwipeable();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Load existing snoozed nudges
      const existing = await AsyncStorage.getItem(SNOOZED_NUDGES_KEY);
      const snoozedNudges: SnoozeEntry[] = existing ? JSON.parse(existing) : [];

      // Add/update this nudge
      const expiresAt = Date.now() + (days * 24 * 60 * 60 * 1000);
      const updatedSnoozed = snoozedNudges.filter(s => s.nudgeId !== nudge.id);
      updatedSnoozed.push({ nudgeId: nudge.id, expiresAt });

      await AsyncStorage.setItem(SNOOZED_NUDGES_KEY, JSON.stringify(updatedSnoozed));

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['nudges-leads-with-touches'] });
      queryClient.invalidateQueries({ queryKey: ['nudges-deals'] });
      queryClient.invalidateQueries({ queryKey: ['nudges-captures'] });

      onSnooze?.(nudge.id, days);

      Alert.alert(
        'Snoozed',
        `This reminder will reappear in ${days} day${days > 1 ? 's' : ''}.`
      );
    } catch (error) {
      console.error('Failed to snooze nudge:', error);
      Alert.alert('Error', 'Failed to snooze. Please try again.');
    }
  }, [nudge.id, closeSwipeable, queryClient, onSnooze]);

  // Show snooze options
  const showSnoozeOptions = useCallback(() => {
    closeSwipeable();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Alert.alert(
      'Snooze Reminder',
      `Snooze "${nudge.title}" for how long?`,
      [
        { text: '1 Day', onPress: () => handleSnooze(1) },
        { text: '3 Days', onPress: () => handleSnooze(3) },
        { text: '1 Week', onPress: () => handleSnooze(7) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [nudge.title, handleSnooze, closeSwipeable]);

  // Dismiss the nudge
  const handleDismiss = useCallback(() => {
    closeSwipeable();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Alert.alert(
      'Dismiss Reminder',
      'Are you sure you want to dismiss this reminder? It will reappear if the condition still applies tomorrow.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              // Snooze for 1 day effectively acts as dismiss
              await handleSnooze(1);
              onDismiss?.(nudge.id);
            } catch (error) {
              console.error('Failed to dismiss nudge:', error);
            }
          },
        },
      ]
    );
  }, [nudge.id, handleSnooze, closeSwipeable, onDismiss]);

  // Left swipe actions (snooze options)
  const renderLeftActions = useCallback((
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [0.5, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={{ flexDirection: 'row' }}>
        {/* Snooze 1 Day */}
        <RectButton
          style={{
            backgroundColor: colors.info,
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
          }}
          onPress={() => handleSnooze(1)}
          accessibilityLabel="Snooze for 1 day"
          accessibilityRole="button"
        >
          <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
            <Clock size={20} color="white" />
            <Text style={{ color: 'white', fontSize: 11, marginTop: 2 }}>1 Day</Text>
          </Animated.View>
        </RectButton>

        {/* Snooze Options */}
        <RectButton
          style={{
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
          }}
          onPress={showSnoozeOptions}
          accessibilityLabel="More snooze options"
          accessibilityRole="button"
        >
          <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
            <AlarmClock size={20} color="white" />
            <Text style={{ color: 'white', fontSize: 11, marginTop: 2 }}>More...</Text>
          </Animated.View>
        </RectButton>
      </View>
    );
  }, [colors.info, colors.primary, handleSnooze, showSnoozeOptions]);

  // Right swipe actions (dismiss)
  const renderRightActions = useCallback((
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <View style={{ flexDirection: 'row' }}>
        {/* Dismiss */}
        <RectButton
          style={{
            backgroundColor: colors.destructive,
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
          }}
          onPress={handleDismiss}
          accessibilityLabel="Dismiss reminder"
          accessibilityRole="button"
        >
          <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
            <X size={20} color="white" />
            <Text style={{ color: 'white', fontSize: 11, marginTop: 2 }}>Dismiss</Text>
          </Animated.View>
        </RectButton>
      </View>
    );
  }, [colors.destructive, handleDismiss]);

  return (
    <View accessibilityHint="Swipe left to snooze. Swipe right to dismiss.">
      <Swipeable
        ref={swipeableRef}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        leftThreshold={40}
        rightThreshold={40}
        overshootLeft={false}
        overshootRight={false}
        friction={2}
      >
        <NudgeCard
          nudge={nudge}
          onPress={onPress}
          onLogCall={onLogCall}
        />
      </Swipeable>
    </View>
  );
}

// Helper function to check if a nudge is snoozed
export async function isNudgeSnoozed(nudgeId: string): Promise<boolean> {
  try {
    const existing = await AsyncStorage.getItem(SNOOZED_NUDGES_KEY);
    if (!existing) return false;

    const snoozedNudges: SnoozeEntry[] = JSON.parse(existing);
    const entry = snoozedNudges.find(s => s.nudgeId === nudgeId);

    if (!entry) return false;

    // Check if snooze has expired
    return entry.expiresAt > Date.now();
  } catch {
    return false;
  }
}

// Helper function to clean expired snooze entries
export async function cleanExpiredSnoozes(): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(SNOOZED_NUDGES_KEY);
    if (!existing) return;

    const snoozedNudges: SnoozeEntry[] = JSON.parse(existing);
    const now = Date.now();
    const valid = snoozedNudges.filter(s => s.expiresAt > now);

    await AsyncStorage.setItem(SNOOZED_NUDGES_KEY, JSON.stringify(valid));
  } catch (error) {
    console.error('Failed to clean expired snoozes:', error);
  }
}

// Memoize component for performance
export const SwipeableNudgeCard = memo(SwipeableNudgeCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.nudge.id === nextProps.nudge.id &&
    prevProps.nudge.title === nextProps.nudge.title &&
    prevProps.nudge.priority === nextProps.nudge.priority &&
    prevProps.onPress === nextProps.onPress &&
    prevProps.onLogCall === nextProps.onLogCall
  );
});

export default SwipeableNudgeCard;
