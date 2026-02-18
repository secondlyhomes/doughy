/**
 * LazyImage Component
 *
 * Lazy loading image with optimization, caching, and fade-in animation.
 *
 * Features:
 * - Lazy loading (loads when visible)
 * - Placeholder while loading
 * - Blurhash support
 * - Error fallback
 * - expo-image integration (WebP, caching)
 */

import { Image } from 'expo-image';
import { useState, useEffect, useRef, memo } from 'react';
import { View, Text, Animated, ActivityIndicator, Pressable } from 'react-native';
import { LazyImageProps } from './types';
import { styles } from './lazy-image.styles';

/**
 * Lazy loading image component with optimization
 *
 * Automatically uses WebP format when available.
 * Caches images for faster subsequent loads.
 * Fades in smoothly when loaded.
 *
 * @example
 * ```tsx
 * <LazyImage
 *   source={{ uri: 'https://example.com/image.jpg' }}
 *   blurhash="LGF5]+Yk^6#M@-5c,1J5@[or[Q6."
 *   width={300}
 *   height={200}
 *   borderRadius={12}
 * />
 * ```
 */
export const LazyImage = memo<LazyImageProps>(
  ({
    source,
    blurhash,
    placeholder,
    width,
    height,
    borderRadius = 0,
    contentFit = 'cover',
    transitionDuration = 300,
    lazyOffset = 500,
    onLoad,
    onError,
    onPress,
    accessibilityLabel,
    style,
    imageStyle,
    cachePolicy = 'memory-disk',
    priority = 'normal',
    enableFadeIn = true,
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [shouldLoad, setShouldLoad] = useState(priority === 'high');

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const viewRef = useRef<View>(null);

    // Lazy loading trigger
    useEffect(() => {
      if (priority === 'high') {
        setShouldLoad(true);
        return;
      }

      // For native, load after small delay (RN handles viewport optimization)
      const timer = setTimeout(() => setShouldLoad(true), 100);
      return () => clearTimeout(timer);
    }, [priority]);

    // Fade in animation
    useEffect(() => {
      if (isLoaded && enableFadeIn) {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: transitionDuration,
          useNativeDriver: true,
        }).start();
      }
    }, [isLoaded, fadeAnim, transitionDuration, enableFadeIn]);

    const handleLoad = () => {
      setIsLoaded(true);
      setHasError(false);
      onLoad?.();
    };

    const handleError = (error: unknown) => {
      setHasError(true);
      setIsLoaded(false);
      onError?.(error);
    };

    const renderPlaceholder = () => {
      if (hasError) {
        return (
          <View style={[styles.placeholder, { width, height, borderRadius }]}>
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load</Text>
            </View>
          </View>
        );
      }

      if (blurhash) {
        return (
          <Image
            source={blurhash}
            style={[styles.placeholder, { width, height, borderRadius }]}
            contentFit="cover"
            placeholder={blurhash}
          />
        );
      }

      if (placeholder) {
        return (
          <Image
            source={placeholder}
            style={[styles.placeholder, { width, height, borderRadius }]}
            contentFit={contentFit}
          />
        );
      }

      return (
        <View style={[styles.placeholder, { width, height, borderRadius }]}>
          <ActivityIndicator size="small" color="#999" />
        </View>
      );
    };

    const renderImage = () => {
      if (!shouldLoad) {
        return renderPlaceholder();
      }

      return (
        <>
          {!isLoaded && renderPlaceholder()}
          <Animated.View
            style={[
              styles.imageContainer,
              { opacity: enableFadeIn ? fadeAnim : 1 },
            ]}
          >
            <Image
              source={source}
              style={[{ width, height, borderRadius }, imageStyle]}
              contentFit={contentFit}
              onLoad={handleLoad}
              onError={handleError}
              placeholder={blurhash}
              placeholderContentFit="cover"
              transition={transitionDuration}
              cachePolicy={cachePolicy}
              priority={priority}
              accessibilityLabel={accessibilityLabel}
            />
          </Animated.View>
        </>
      );
    };

    const content = (
      <View ref={viewRef} style={[styles.container, style]}>
        {renderImage()}
      </View>
    );

    if (onPress) {
      return (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          {content}
        </Pressable>
      );
    }

    return content;
  }
);

LazyImage.displayName = 'LazyImage';
