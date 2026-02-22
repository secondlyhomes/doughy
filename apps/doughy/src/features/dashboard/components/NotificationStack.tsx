// src/features/dashboard/components/NotificationStack.tsx
// Stack of swipeable notification cards with collapse logic
// Shows up to 3 cards, with "View X more" for additional notifications

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { ChevronDown, ChevronUp, CheckCheck } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { NotificationCard, Notification } from './NotificationCard';
import { withOpacity } from '@/lib/design-utils';
import { ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface NotificationStackProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}

const MAX_VISIBLE = 3;

export function NotificationStack({ notifications, onDismiss, onDismissAll }: NotificationStackProps) {
  const colors = useThemeColors();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDismiss = (id: string) => {
    // Trigger smooth layout animation
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onDismiss(id);
  };

  const handleDismissAll = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onDismissAll();
  };

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  // Empty state
  if (notifications.length === 0) {
    return (
      <View
        className="mx-4 mb-4 rounded-xl p-6 items-center"
        style={{ backgroundColor: withOpacity(colors.success, 'muted') }}
      >
        <CheckCheck size={ICON_SIZES['2xl']} color={colors.success} />
        <Text className="text-base font-medium mt-2" style={{ color: colors.success }}>
          All caught up!
        </Text>
        <Text className="text-sm mt-1 text-center" style={{ color: colors.mutedForeground }}>
          No pending notifications right now
        </Text>
      </View>
    );
  }

  const visibleNotifications = isExpanded
    ? notifications
    : notifications.slice(0, MAX_VISIBLE);

  const hiddenCount = notifications.length - MAX_VISIBLE;
  const showExpandToggle = hiddenCount > 0;

  return (
    <View className="px-4 mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm font-medium uppercase" style={{ color: colors.mutedForeground }}>
          Notifications ({notifications.length})
        </Text>
        {notifications.length > 1 && (
          <TouchableOpacity
            onPress={handleDismissAll}
            className="flex-row items-center"
            activeOpacity={PRESS_OPACITY.DEFAULT}
          >
            <CheckCheck size={14} color={colors.primary} />
            <Text className="text-sm font-medium ml-1" style={{ color: colors.primary }}>
              Dismiss All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notification Cards */}
      {visibleNotifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onDismiss={handleDismiss}
        />
      ))}

      {/* Expand/Collapse Toggle */}
      {showExpandToggle && (
        <TouchableOpacity
          onPress={toggleExpand}
          className="rounded-lg p-3 items-center flex-row justify-center"
          style={{
            backgroundColor: colors.muted,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          activeOpacity={PRESS_OPACITY.DEFAULT}
        >
          {isExpanded ? (
            <>
              <ChevronUp size={ICON_SIZES.md} color={colors.mutedForeground} />
              <Text className="text-sm font-medium ml-2" style={{ color: colors.foreground }}>
                Show Less
              </Text>
            </>
          ) : (
            <>
              <ChevronDown size={ICON_SIZES.md} color={colors.mutedForeground} />
              <Text className="text-sm font-medium ml-2" style={{ color: colors.foreground }}>
                View {hiddenCount} More
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
