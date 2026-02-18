/**
 * ProgressiveImage Component
 *
 * Progressive image loading (thumbnail → full resolution).
 * Shows low-quality thumbnail immediately, then loads full image.
 * Provides better perceived performance.
 */

import { Image } from 'expo-image';
import { useState, useEffect, useRef, memo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { ProgressiveImageProps } from './types';

/**
 * Progressive image loading component
 *
 * @example
 * ```tsx
 * <ProgressiveImage
 *   thumbnailSource={{ uri: 'https://example.com/thumb.jpg' }}
 *   source={{ uri: 'https://example.com/full.jpg' }}
 *   blurhash="LGF5]+Yk^6#M@-5c,1J5@[or[Q6."
 *   width={300}
 *   height={200}
 * />
 * ```
 */
export const ProgressiveImage = memo<ProgressiveImageProps>(
  ({ thumbnailSource, source, width, height, borderRadius = 0, blurhash }) => {
    const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
    const [fullImageLoaded, setFullImageLoaded] = useState(false);

    const thumbnailFade = useRef(new Animated.Value(0)).current;
    const fullImageFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (thumbnailLoaded) {
        Animated.timing(thumbnailFade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }, [thumbnailLoaded, thumbnailFade]);

    useEffect(() => {
      if (fullImageLoaded) {
        Animated.timing(fullImageFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }, [fullImageLoaded, fullImageFade]);

    return (
      <View style={{ width, height, borderRadius, overflow: 'hidden' }}>
        {/* Blurhash placeholder */}
        {blurhash && !thumbnailLoaded && (
          <Image
            source={blurhash}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            placeholder={blurhash}
          />
        )}

        {/* Thumbnail */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: thumbnailFade }]}
        >
          <Image
            source={thumbnailSource}
            style={{ width, height }}
            contentFit="cover"
            onLoad={() => setThumbnailLoaded(true)}
          />
        </Animated.View>

        {/* Full resolution image */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: fullImageFade }]}
        >
          <Image
            source={source}
            style={{ width, height }}
            contentFit="cover"
            onLoad={() => setFullImageLoaded(true)}
          />
        </Animated.View>
      </View>
    );
  }
);

ProgressiveImage.displayName = 'ProgressiveImage';
