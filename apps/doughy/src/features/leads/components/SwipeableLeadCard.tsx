// Swipeable Lead Card Component - React Native
// Zone D: Lead card with swipe actions for quick interactions

import React, { useRef, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert, Animated } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { Phone, MessageSquare, Archive, Star } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { haptic } from '@/lib/haptics';
import { SWIPE_ACTION_WIDTH } from '@/constants/design-tokens';

import { Lead } from '../types';
import { LeadCard } from './LeadCard';
import { useUpdateLead, useDeleteLead } from '../hooks/useLeads';
import { sanitizePhone } from '@/utils/sanitize';

interface SwipeableLeadCardProps {
  lead: Lead;
  onPress: () => void;
  /** Card variant: 'default' or 'glass' */
  variant?: 'default' | 'glass';
  /** Blur intensity for glass variant (0-100). Default: 55 */
  glassIntensity?: number;
}

function SwipeableLeadCardComponent({
  lead,
  onPress,
  variant = 'default',
  glassIntensity = 55,
}: SwipeableLeadCardProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const colors = useThemeColors();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const closeSwipeable = useCallback(() => {
    swipeableRef.current?.close();
  }, []);

  const handleCall = useCallback(() => {
    closeSwipeable();
    haptic.light();
    if (lead.phone) {
      Linking.openURL(`tel:${sanitizePhone(lead.phone)}`);
    } else {
      Alert.alert('No Phone', 'This lead does not have a phone number.');
    }
  }, [lead.phone, closeSwipeable]);

  const handleText = useCallback(() => {
    closeSwipeable();
    haptic.light();
    if (lead.phone) {
      Linking.openURL(`sms:${sanitizePhone(lead.phone)}`);
    } else {
      Alert.alert('No Phone', 'This lead does not have a phone number.');
    }
  }, [lead.phone, closeSwipeable]);

  const handleToggleStar = useCallback(async () => {
    closeSwipeable();
    haptic.selection();
    try {
      await updateLead.mutateAsync({
        id: lead.id,
        data: { starred: !lead.starred },
      });
      haptic.success();
    } catch (error) {
      haptic.error();
      Alert.alert('Error', 'Failed to update lead');
    }
  }, [lead.id, lead.starred, updateLead, closeSwipeable]);

  const handleArchive = useCallback(() => {
    closeSwipeable();
    haptic.warning();
    Alert.alert(
      'Archive Lead',
      `Are you sure you want to archive ${lead.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLead.mutateAsync(lead.id);
              haptic.success();
            } catch (error) {
              haptic.error();
              Alert.alert('Error', 'Failed to archive lead');
            }
          },
        },
      ]
    );
  }, [lead.name, lead.id, deleteLead, closeSwipeable]);

  const renderLeftActions = useCallback((
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, SWIPE_ACTION_WIDTH],
      outputRange: [0.5, 1],
      extrapolate: 'clamp',
    });

    return (
      <View className="flex-row" accessibilityRole="menubar">
        {/* Star Action */}
        <RectButton
          style={{
            backgroundColor: lead.starred ? colors.mutedForeground : colors.warning,
            justifyContent: 'center',
            alignItems: 'center',
            width: SWIPE_ACTION_WIDTH,
          }}
          onPress={handleToggleStar}
          accessibilityLabel={lead.starred ? `Remove ${lead.name} from starred` : `Star ${lead.name}`}
          accessibilityRole="button"
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Star
              size={24}
              color="white"
              fill={lead.starred ? 'transparent' : 'white'}
            />
            <Text className="text-white text-xs mt-1">
              {lead.starred ? 'Unstar' : 'Star'}
            </Text>
          </Animated.View>
        </RectButton>
      </View>
    );
  }, [colors.warning, colors.mutedForeground, lead.starred, handleToggleStar]);

  const renderRightActions = useCallback((
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-(SWIPE_ACTION_WIDTH * 3), 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <View className="flex-row" accessibilityRole="menubar">
        {/* Call Action */}
        <RectButton
          style={{
            backgroundColor: colors.info,
            justifyContent: 'center',
            alignItems: 'center',
            width: SWIPE_ACTION_WIDTH,
          }}
          onPress={handleCall}
          accessibilityLabel={`Call ${lead.name}`}
          accessibilityRole="button"
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Phone size={24} color="white" />
            <Text className="text-white text-xs mt-1">Call</Text>
          </Animated.View>
        </RectButton>

        {/* Text Action */}
        <RectButton
          style={{
            backgroundColor: colors.success,
            justifyContent: 'center',
            alignItems: 'center',
            width: SWIPE_ACTION_WIDTH,
          }}
          onPress={handleText}
          accessibilityLabel={`Send text message to ${lead.name}`}
          accessibilityRole="button"
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <MessageSquare size={24} color="white" />
            <Text className="text-white text-xs mt-1">Text</Text>
          </Animated.View>
        </RectButton>

        {/* Archive Action */}
        <RectButton
          style={{
            backgroundColor: colors.destructive,
            justifyContent: 'center',
            alignItems: 'center',
            width: SWIPE_ACTION_WIDTH,
          }}
          onPress={handleArchive}
          accessibilityLabel={`Archive ${lead.name}`}
          accessibilityRole="button"
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Archive size={24} color="white" />
            <Text className="text-white text-xs mt-1">Archive</Text>
          </Animated.View>
        </RectButton>
      </View>
    );
  }, [colors.info, colors.success, colors.destructive, lead.name, handleCall, handleText, handleArchive]);

  return (
    <View accessibilityHint="Swipe left for call, text, archive actions. Swipe right to star.">
      <Swipeable
        testID="swipeable"
        ref={swipeableRef}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        leftThreshold={40}
        rightThreshold={40}
        overshootLeft={false}
        overshootRight={false}
        friction={2}
      >
        <LeadCard
          lead={lead}
          onPress={onPress}
          variant={variant}
          glassIntensity={glassIntensity}
        />
      </Swipeable>
    </View>
  );
}

// Memoize the component with custom comparison for better list performance
// Note: onPress is included to prevent stale closure bugs when parent recreates callback
export const SwipeableLeadCard = memo(SwipeableLeadCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.lead.id === nextProps.lead.id &&
    prevProps.lead.name === nextProps.lead.name &&
    prevProps.lead.phone === nextProps.lead.phone &&
    prevProps.lead.starred === nextProps.lead.starred &&
    prevProps.lead.status === nextProps.lead.status &&
    prevProps.variant === nextProps.variant &&
    prevProps.glassIntensity === nextProps.glassIntensity &&
    prevProps.onPress === nextProps.onPress
  );
});

export default SwipeableLeadCard;
