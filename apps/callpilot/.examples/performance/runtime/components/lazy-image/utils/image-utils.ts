/**
 * Image Utility Functions
 */

import { Image, ImageSource } from 'expo-image';
import { PixelRatio } from 'react-native';
import { ResponsiveImageOptions } from '../types';

/**
 * Gets responsive image URL based on device pixel ratio
 *
 * @example
 * ```tsx
 * const imageUrl = getResponsiveImageUrl(
 *   'https://cdn.example.com/image.jpg',
 *   300
 * )
 * ```
 */
export function getResponsiveImageUrl(
  baseUrl: string,
  width: number,
  options?: ResponsiveImageOptions
): string {
  const { format = 'webp', quality = 80 } = options || {};

  // For Cloudflare Images or similar CDN
  const url = new URL(baseUrl);
  url.searchParams.set('width', Math.round(width * PixelRatio.get()).toString());
  url.searchParams.set('format', format);
  url.searchParams.set('quality', quality.toString());

  return url.toString();
}

/**
 * Preloads multiple images in batch
 * Useful for galleries or image-heavy screens
 *
 * @example
 * ```tsx
 * const images = [
 *   'https://example.com/1.jpg',
 *   'https://example.com/2.jpg',
 * ]
 *
 * useEffect(() => {
 *   preloadImages(images)
 * }, [])
 * ```
 */
export async function preloadImages(sources: ImageSource[]): Promise<void> {
  const promises = sources.map((source) => {
    return new Promise<void>((resolve, reject) => {
      Image.prefetch(source as string)
        .then(() => resolve())
        .catch(reject);
    });
  });

  try {
    await Promise.all(promises);
  } catch (error) {
    console.error('Failed to preload images:', error);
  }
}
