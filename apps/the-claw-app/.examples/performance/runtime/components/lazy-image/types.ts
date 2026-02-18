/**
 * LazyImage Type Definitions
 */

import type { ImageSource } from 'expo-image';
import type { StyleProp, ViewStyle, ImageStyle } from 'react-native';

export interface LazyImageProps {
  /** Image source (URI or require()) */
  source: ImageSource;

  /** Blurhash string for placeholder. Generate at: https://blurha.sh/ */
  blurhash?: string;

  /** Placeholder image (shown while loading) */
  placeholder?: ImageSource;

  /** Width of the image */
  width: number;

  /** Height of the image */
  height: number;

  /** Border radius */
  borderRadius?: number;

  /** Content fit mode */
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';

  /** Transition duration in ms */
  transitionDuration?: number;

  /** Lazy load offset (load when within this many pixels of viewport) */
  lazyOffset?: number;

  /** Callback when image loads successfully */
  onLoad?: () => void;

  /** Callback when image fails to load */
  onError?: (error: unknown) => void;

  /** Callback when image is pressed */
  onPress?: () => void;

  /** Accessibility label */
  accessibilityLabel?: string;

  /** Style for container */
  style?: StyleProp<ViewStyle>;

  /** Style for image */
  imageStyle?: StyleProp<ImageStyle>;

  /** Cache policy */
  cachePolicy?: 'memory' | 'disk' | 'memory-disk';

  /** Priority (higher = loads first) */
  priority?: 'low' | 'normal' | 'high';

  /** Enable fade-in animation */
  enableFadeIn?: boolean;
}

export interface ProgressiveImageProps {
  /** Low quality placeholder URL (small file size) */
  thumbnailSource: ImageSource;

  /** Full quality image URL */
  source: ImageSource;

  /** Width of the image */
  width: number;

  /** Height of the image */
  height: number;

  /** Border radius */
  borderRadius?: number;

  /** Blurhash for initial placeholder */
  blurhash?: string;
}

export interface ResponsiveImageOptions {
  format?: 'webp' | 'jpg' | 'png';
  quality?: number;
}
