// src/features/voip/components/CallControls.tsx
// Call control buttons: mute, speaker, hold, end call

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Mic, MicOff, Volume2, VolumeX, Pause, Play, PhoneOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import type { CallControls as CallControlsType } from '../types';

interface CallControlsProps {
  controls: CallControlsType;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onToggleHold: () => void;
  onEndCall: () => void;
  disabled?: boolean;
}

interface ControlButtonProps {
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  label: string;
  isActive?: boolean;
  isDestructive?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

function ControlButton({
  icon,
  activeIcon,
  label,
  isActive = false,
  isDestructive = false,
  onPress,
  disabled = false,
}: ControlButtonProps) {
  const colors = useThemeColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const backgroundColor = isDestructive
    ? colors.destructive
    : isActive
    ? colors.primary
    : withOpacity(colors.muted, 'strong');

  const iconColor = isDestructive || isActive ? '#FFFFFF' : colors.foreground;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive, disabled }}
      style={[
        styles.controlButton,
        {
          backgroundColor,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {isActive && activeIcon ? activeIcon : icon}
      <Text
        style={[
          styles.controlLabel,
          { color: isDestructive || isActive ? '#FFFFFF' : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function CallControls({
  controls,
  onToggleMute,
  onToggleSpeaker,
  onToggleHold,
  onEndCall,
  disabled = false,
}: CallControlsProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {/* Top row: Mute, Speaker, Hold */}
      <View style={styles.row}>
        <ControlButton
          icon={<Mic size={24} color={colors.foreground} />}
          activeIcon={<MicOff size={24} color="#FFFFFF" />}
          label={controls.isMuted ? 'Unmute' : 'Mute'}
          isActive={controls.isMuted}
          onPress={onToggleMute}
          disabled={disabled}
        />

        <ControlButton
          icon={<VolumeX size={24} color={colors.foreground} />}
          activeIcon={<Volume2 size={24} color="#FFFFFF" />}
          label={controls.isSpeakerOn ? 'Speaker Off' : 'Speaker'}
          isActive={controls.isSpeakerOn}
          onPress={onToggleSpeaker}
          disabled={disabled}
        />

        <ControlButton
          icon={<Play size={24} color={colors.foreground} />}
          activeIcon={<Pause size={24} color="#FFFFFF" />}
          label={controls.isOnHold ? 'Resume' : 'Hold'}
          isActive={controls.isOnHold}
          onPress={onToggleHold}
          disabled={disabled}
        />
      </View>

      {/* Bottom row: End Call */}
      <View style={styles.endCallRow}>
        <TouchableOpacity
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onEndCall();
          }}
          disabled={disabled}
          accessibilityLabel="End call"
          accessibilityRole="button"
          style={[
            styles.endCallButton,
            {
              backgroundColor: colors.destructive,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          <PhoneOff size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xl,
  },
  controlButton: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  controlLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  endCallRow: {
    alignItems: 'center',
  },
  endCallButton: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CallControls;
