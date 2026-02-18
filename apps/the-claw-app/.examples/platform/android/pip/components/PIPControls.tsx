/**
 * PIPControls.tsx
 *
 * UI components for Picture-in-Picture controls
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PIPControlsProps {
  isPlaying: boolean;
  isSupported: boolean;
  onPlayPause: () => void;
  onEnterPiP: () => void;
}

/**
 * Video playback controls with PiP button
 */
export function PIPControls({
  isPlaying,
  isSupported,
  onPlayPause,
  onEnterPiP,
}: PIPControlsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={onPlayPause} style={styles.button}>
          <Text style={styles.buttonText}>{isPlaying ? 'Pause' : 'Play'}</Text>
        </TouchableOpacity>

        {isSupported && (
          <TouchableOpacity onPress={onEnterPiP} style={styles.button}>
            <Text style={styles.buttonText}>Enter PiP</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

interface PIPModeIndicatorProps {
  visible: boolean;
}

/**
 * Indicator shown when in PiP mode
 */
export function PIPModeIndicator({ visible }: PIPModeIndicatorProps) {
  if (!visible) return null;

  return (
    <View style={styles.indicator}>
      <Text style={styles.indicatorText}>Picture-in-Picture Mode</Text>
    </View>
  );
}

interface VideoCallControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isSupported: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEnterPiP: () => void;
}

/**
 * Video call controls with PiP support
 */
export function VideoCallControls({
  isMuted,
  isVideoOff,
  isSupported,
  onToggleMute,
  onToggleVideo,
  onEnterPiP,
}: VideoCallControlsProps) {
  return (
    <View style={styles.callControls}>
      <TouchableOpacity onPress={onToggleMute} style={styles.callButton}>
        <Text style={styles.buttonText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onToggleVideo} style={styles.callButton}>
        <Text style={styles.buttonText}>{isVideoOff ? 'Video On' : 'Video Off'}</Text>
      </TouchableOpacity>
      {isSupported && (
        <TouchableOpacity onPress={onEnterPiP} style={styles.callButton}>
          <Text style={styles.buttonText}>PiP</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
  indicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
  },
  indicatorText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
  },
  callControls: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#333',
    borderRadius: 8,
  },
});
