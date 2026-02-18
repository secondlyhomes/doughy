// src/features/focus/components/NudgeCard.tsx
// Individual nudge card component

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  PhoneMissed,
  AlertCircle,
  Clock,
  Calendar,
  Inbox,
  ChevronRight,
  Phone,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/context/ThemeContext';
import { useFocusMode } from '@/context/FocusModeContext';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { Nudge, NudgeType, NUDGE_TYPE_CONFIG } from '../types';

interface NudgeCardProps {
  nudge: Nudge;
  onPress?: () => void;
  onLogCall?: (leadId: string, leadName?: string) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'phone-missed': PhoneMissed,
  'alert-circle': AlertCircle,
  'clock': Clock,
  'calendar': Calendar,
  'inbox': Inbox,
};

export function NudgeCard({ nudge, onPress, onLogCall }: NudgeCardProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const { setActiveMode } = useFocusMode();

  const config = NUDGE_TYPE_CONFIG[nudge.type];
  const iconColor = colors[config.color] || colors.primary;
  const IconComponent = ICON_MAP[config.icon] || AlertCircle;

  // Show inline action for stale leads
  const showLogCallAction = nudge.type === 'stale_lead' && onLogCall;

  const handleLogCallPress = () => {
    if (onLogCall && nudge.entityId) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onLogCall(nudge.entityId, nudge.entityName);
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    // Default navigation based on entity type
    switch (nudge.entityType) {
      case 'lead':
        router.push(`/(tabs)/leads/${nudge.entityId}`);
        break;
      case 'deal':
        router.push(`/(tabs)/deals/${nudge.entityId}`);
        break;
      case 'property':
        router.push(`/(tabs)/properties/${nudge.entityId}`);
        break;
      case 'capture':
        // Switch to focus mode to show the triage queue
        setActiveMode('focus');
        break;
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${nudge.title}. ${nudge.subtitle || ''}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        gap: SPACING.md,
      }}
    >
      {/* Priority indicator + Icon */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: BORDER_RADIUS.md,
          backgroundColor: withOpacity(iconColor, 'light'),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconComponent size={ICON_SIZES.md} color={iconColor} />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
          {/* Priority badge */}
          {nudge.priority === 'high' && (
            <View
              style={{
                backgroundColor: colors.destructive,
                paddingHorizontal: SPACING.xs,
                paddingVertical: 2,
                borderRadius: BORDER_RADIUS.sm,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '600', color: colors.destructiveForeground }}>
                URGENT
              </Text>
            </View>
          )}
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.foreground,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {nudge.title}
          </Text>
        </View>

        {nudge.subtitle && (
          <Text
            style={{
              fontSize: 13,
              color: colors.mutedForeground,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {nudge.subtitle}
          </Text>
        )}

        {/* Meta info */}
        <Text
          style={{
            fontSize: 11,
            color: colors.mutedForeground,
            marginTop: SPACING.xs,
          }}
        >
          {config.label} • {formatTimeAgo(nudge.createdAt)}
        </Text>
      </View>

      {/* Inline action or chevron */}
      {showLogCallAction ? (
        <TouchableOpacity
          onPress={handleLogCallPress}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: colors.info,
            paddingHorizontal: SPACING.sm,
            paddingVertical: 6,
            borderRadius: BORDER_RADIUS.md,
          }}
          accessibilityRole="button"
          accessibilityLabel="Log call for this lead"
        >
          <Phone size={14} color={colors.primaryForeground} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primaryForeground }}>
            Log Call
          </Text>
        </TouchableOpacity>
      ) : (
        <ChevronRight size={ICON_SIZES.sm} color={colors.mutedForeground} />
      )}
    </TouchableOpacity>
  );
}

export default NudgeCard;
