/**
 * FullScreenImageViewer Example
 *
 * Example component demonstrating full-screen image viewing
 * with edge-to-edge display.
 */

import React from 'react';
import { View, Image, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';
import { useEdgeToEdge } from '../hooks/useEdgeToEdge';
import { FullScreenImageViewerProps } from '../types';

// Note: Icon component should be imported from your icon library
// import { Icon } from '@your-icon-library';

/**
 * Full-screen image viewer with edge-to-edge display
 *
 * Demonstrates how to create an immersive image viewing experience
 * with proper inset handling for the close button.
 *
 * @example
 * ```tsx
 * <FullScreenImageViewer
 *   imageUrl="https://example.com/image.jpg"
 *   onClose={() => navigation.goBack()}
 * />
 * ```
 */
export function FullScreenImageViewer({
  imageUrl,
  onClose,
}: FullScreenImageViewerProps) {
  const { insets } = useEdgeToEdge({
    enabled: true,
    style: {
      statusBarColor: 'transparent',
      navigationBarColor: 'transparent',
      statusBarStyle: 'light-content',
      navigationBarStyle: 'light',
    },
  });

  return (
    <View style={styles.fullScreen}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Image */}
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="contain"
      />

      {/* Close button */}
      <TouchableOpacity
        style={[
          styles.closeButton,
          {
            top: 16 + insets.top,
            right: 16 + insets.right,
          },
        ]}
        onPress={onClose}
      >
        {/* Replace with your icon component */}
        {/* <Icon name="close" color="#fff" size={24} /> */}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
