/**
 * PictureInPicture.tsx
 *
 * Picture-in-Picture Mode implementation
 *
 * Features:
 * - Video playback in PiP
 * - Custom aspect ratios
 * - PiP controls
 * - Auto-enter PiP
 * - Seamless transitions
 *
 * Requirements:
 * - Android 8.0+ (API 26+) for PiP
 * - Android 12+ (API 31+) for auto-enter PiP
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, AppState, AppStateStatus } from 'react-native';

import { usePictureInPicture, usePiPActions } from './hooks/usePictureInPicture';
import { PIPControls, PIPModeIndicator, VideoCallControls } from './components/PIPControls';
import type { VideoPlayerWithPiPProps } from './types';

/**
 * Video Player with PiP support
 */
export function VideoPlayerWithPiP({
  videoUrl,
  aspectRatio = { width: 16, height: 9 },
  autoEnterOnBackground = true,
}: VideoPlayerWithPiPProps) {
  const { isInPipMode, isSupported, enterPiP } = usePictureInPicture();
  const [isPlaying, setIsPlaying] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/active/) &&
        nextAppState === 'background' &&
        isPlaying &&
        autoEnterOnBackground &&
        isSupported
      ) {
        await enterPiP({
          width: aspectRatio.width,
          height: aspectRatio.height,
          autoEnter: true,
          actions: [
            { icon: 'ic_play_arrow', title: 'Play', action: 'PLAY', enabled: !isPlaying },
            { icon: 'ic_pause', title: 'Pause', action: 'PAUSE', enabled: isPlaying },
          ],
        });
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isPlaying, autoEnterOnBackground, isSupported, enterPiP, aspectRatio]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);

  const handleEnterPiP = async () => {
    await enterPiP({
      width: aspectRatio.width,
      height: aspectRatio.height,
      actions: [
        { icon: 'ic_play_arrow', title: 'Play', action: 'PLAY', enabled: !isPlaying },
        { icon: 'ic_pause', title: 'Pause', action: 'PAUSE', enabled: isPlaying },
        { icon: 'ic_replay_10', title: 'Rewind', action: 'REWIND' },
        { icon: 'ic_forward_10', title: 'Forward', action: 'FORWARD' },
      ],
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff' }}>Video: {videoUrl}</Text>
        <Text style={{ color: '#fff', marginTop: 8 }}>{isPlaying ? 'Playing' : 'Paused'}</Text>
      </View>

      {!isInPipMode && (
        <PIPControls
          isPlaying={isPlaying}
          isSupported={isSupported}
          onPlayPause={handlePlayPause}
          onEnterPiP={handleEnterPiP}
        />
      )}

      <PIPModeIndicator visible={isInPipMode} />
    </View>
  );
}

/**
 * Video Call with PiP support
 */
export function VideoCallWithPiP() {
  const { isInPipMode, isSupported, enterPiP } = usePictureInPicture();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const handleEnterPiP = async () => {
    await enterPiP({
      width: 16,
      height: 9,
      actions: [
        { icon: isMuted ? 'ic_mic_off' : 'ic_mic', title: isMuted ? 'Unmute' : 'Mute', action: 'TOGGLE_MUTE' },
        { icon: isVideoOff ? 'ic_videocam_off' : 'ic_videocam', title: isVideoOff ? 'Video On' : 'Video Off', action: 'TOGGLE_VIDEO' },
        { icon: 'ic_call_end', title: 'End Call', action: 'END_CALL' },
      ],
    });
  };

  usePiPActions([
    { icon: 'ic_mic', title: 'Mute', action: 'TOGGLE_MUTE', enabled: true },
    { icon: 'ic_videocam', title: 'Video', action: 'TOGGLE_VIDEO', enabled: true },
    { icon: 'ic_call_end', title: 'End', action: 'END_CALL', enabled: true },
  ]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: '#000' }} />

      {!isInPipMode && (
        <VideoCallControls
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isSupported={isSupported}
          onToggleMute={() => setIsMuted(!isMuted)}
          onToggleVideo={() => setIsVideoOff(!isVideoOff)}
          onEnterPiP={handleEnterPiP}
        />
      )}
    </View>
  );
}
