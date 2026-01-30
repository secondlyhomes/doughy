// src/features/dashboard/components/NotificationCard.tsx
// Swipeable notification card with iOS-style dismiss gesture
// Uses react-native-gesture-handler for swipe gestures

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { AlertTriangle, Info, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4; // 40% of screen width

export interface Notification {
  id: string;
  type: 'overdue' | 'info' | 'warning' | 'success';
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  timestamp: Date;
}

interface NotificationCardProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

export function NotificationCard({ notification, onDismiss }: NotificationCardProps) {
  const colors = useThemeColors();
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const handleDismiss = useCallback(() => {
    onDismiss(notification.id);
  }, [notification.id, onDismiss]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      // Only allow swiping left (negative translation)
      if (event.translationX < 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      const shouldDismiss = Math.abs(event.translationX) > SWIPE_THRESHOLD;

      if (shouldDismiss) {
        // Animate off screen
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(handleDismiss)();
        });
      } else {
        // Spring back to original position
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const getIcon = () => {
    const iconSize = 18;
    switch (notification.type) {
      case 'overdue':
        return <AlertTriangle size={iconSize} color={colors.destructive} />;
      case 'warning':
        return <AlertCircle size={iconSize} color={colors.warning} />;
      case 'success':
        return <CheckCircle2 size={iconSize} color={colors.success} />;
      case 'info':
      default:
        return <Info size={iconSize} color={colors.info} />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'overdue':
        return colors.destructive;
      case 'warning':
        return colors.warning;
      case 'success':
        return colors.success;
      case 'info':
      default:
        return colors.info;
    }
  };

  const getRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[animatedStyle, { marginBottom: 12 }]}>
        <View
          className="rounded-xl p-4"
          style={{
            backgroundColor: colors.card,
            borderLeftWidth: 4,
            borderLeftColor: getBorderColor(),
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {/* Header Row */}
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center flex-1">
              <View
                className="rounded-full p-1.5 mr-2"
                style={{ backgroundColor: withOpacity(getBorderColor(), 'muted') }}
              >
                {getIcon()}
              </View>
              <Text className="text-sm font-semibold flex-1" style={{ color: colors.foreground }}>
                {notification.title}
              </Text>
            </View>
            <Text className="text-xs ml-2" style={{ color: colors.mutedForeground }}>
              {getRelativeTime(notification.timestamp)}
            </Text>
          </View>

          {/* Message */}
          <Text className="text-sm mb-3 ml-9" style={{ color: colors.mutedForeground }}>
            {notification.message}
          </Text>

          {/* Action Button */}
          {notification.actionLabel && notification.onAction && (
            <TouchableOpacity
              onPress={notification.onAction}
              className="flex-row items-center ml-9"
              activeOpacity={0.7}
            >
              <Text className="text-sm font-medium mr-1" style={{ color: colors.primary }}>
                {notification.actionLabel}
              </Text>
              <ChevronRight size={14} color={colors.primary} />
            </TouchableOpacity>
          )}

          {/* Swipe Hint (subtle) */}
          <View className="absolute right-4 top-4 bottom-4 justify-center">
            <Text className="text-xs" style={{ color: withOpacity(colors.mutedForeground, 'muted') }}>
              ←
            </Text>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
