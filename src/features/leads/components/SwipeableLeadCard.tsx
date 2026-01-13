// Swipeable Lead Card Component - React Native
// Zone D: Lead card with swipe actions for quick interactions

import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert, Animated } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { Phone, MessageSquare, Archive, Star } from 'lucide-react-native';

import { Lead } from '../types';
import { LeadCard } from './LeadCard';
import { useUpdateLead, useDeleteLead } from '../hooks/useLeads';
import { sanitizePhone } from '@/utils/sanitize';

interface SwipeableLeadCardProps {
  lead: Lead;
  onPress: () => void;
}

export function SwipeableLeadCard({ lead, onPress }: SwipeableLeadCardProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const closeSwipeable = () => {
    swipeableRef.current?.close();
  };

  const handleCall = () => {
    closeSwipeable();
    if (lead.phone) {
      Linking.openURL(`tel:${sanitizePhone(lead.phone)}`);
    } else {
      Alert.alert('No Phone', 'This lead does not have a phone number.');
    }
  };

  const handleText = () => {
    closeSwipeable();
    if (lead.phone) {
      Linking.openURL(`sms:${sanitizePhone(lead.phone)}`);
    } else {
      Alert.alert('No Phone', 'This lead does not have a phone number.');
    }
  };

  const handleToggleStar = async () => {
    closeSwipeable();
    try {
      await updateLead.mutateAsync({
        id: lead.id,
        data: { starred: !lead.starred },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update lead');
    }
  };

  const handleArchive = () => {
    closeSwipeable();
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
            } catch (error) {
              Alert.alert('Error', 'Failed to archive lead');
            }
          },
        },
      ]
    );
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [0.5, 1],
      extrapolate: 'clamp',
    });

    return (
      <View className="flex-row" accessibilityRole="menubar">
        {/* Star Action */}
        <RectButton
          style={{
            backgroundColor: lead.starred ? '#6b7280' : '#f59e0b',
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
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
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-240, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <View className="flex-row" accessibilityRole="menubar">
        {/* Call Action */}
        <RectButton
          style={{
            backgroundColor: '#3b82f6',
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
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
            backgroundColor: '#22c55e',
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
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
            backgroundColor: '#ef4444',
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
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
  };

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
        <LeadCard lead={lead} onPress={onPress} />
      </Swipeable>
    </View>
  );
}

export default SwipeableLeadCard;
