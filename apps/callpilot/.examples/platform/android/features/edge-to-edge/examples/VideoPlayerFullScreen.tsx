/**
 * VideoPlayerFullScreen Example
 *
 * Example component demonstrating full-screen video playback
 * with edge-to-edge display.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useEdgeToEdge } from '../hooks/useEdgeToEdge';

/**
 * Full-screen video player with edge-to-edge display
 *
 * Demonstrates how to create an immersive video viewing experience
 * with proper inset handling for controls.
 *
 * @example
 * ```tsx
 * <VideoPlayerFullScreen />
 * ```
 */
export function VideoPlayerFullScreen() {
  const { insets } = useEdgeToEdge({
    enabled: true,
    style: {
      statusBarColor: 'transparent',
      navigationBarColor: '#000000',
      statusBarStyle: 'light-content',
    },
  });

  return (
    <View style={styles.fullScreen}>
      {/* Video */}
      <View style={styles.videoContainer}>
        {/* Video component would go here */}
        {/* e.g., <Video source={videoSource} style={styles.video} /> */}
      </View>

      {/* Controls */}
      <View
        style={[
          styles.videoControls,
          { paddingBottom: 16 + insets.bottom },
        ]}
      >
        {/* Control buttons would go here */}
        {/* e.g., Play/Pause, Seek bar, Fullscreen toggle */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
  },
  videoControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
  },
});
