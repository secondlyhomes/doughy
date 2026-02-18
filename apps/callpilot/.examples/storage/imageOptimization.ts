/**
 * Image Optimization Utilities
 *
 * Utilities for:
 * - Image compression
 * - Resizing
 * - Thumbnail generation
 * - CDN URL optimization
 * - Format conversion
 */

import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

// Types
export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: SaveFormat;
}

export interface ResizeOptions {
  width?: number;
  height?: number;
  mode?: 'contain' | 'cover' | 'stretch';
}

export interface ThumbnailOptions {
  width: number;
  height: number;
  quality?: number;
  format?: SaveFormat;
}

export interface OptimizedImageUrlOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'png' | 'jpeg';
}

// Compression
export async function compressImage(
  uri: string,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    format = SaveFormat.JPEG,
  } = options;

  try {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: maxWidth, height: maxHeight } }],
      { compress: quality, format }
    );

    return result.uri;
  } catch (error) {
    console.error('Image compression error:', error);
    throw error;
  }
}

// Resizing
export async function resizeImage(
  uri: string,
  options: ResizeOptions
): Promise<string> {
  const { width, height } = options;

  if (!width && !height) {
    throw new Error('At least one dimension (width or height) must be specified');
  }

  try {
    const result = await manipulateAsync(uri, [
      {
        resize: {
          width,
          height,
        },
      },
    ]);

    return result.uri;
  } catch (error) {
    console.error('Image resize error:', error);
    throw error;
  }
}

// Thumbnail Generation
export async function generateThumbnail(
  uri: string,
  options: ThumbnailOptions
): Promise<string> {
  const { width, height, quality = 0.7, format = SaveFormat.JPEG } = options;

  try {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width, height } }],
      { compress: quality, format }
    );

    return result.uri;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    throw error;
  }
}

export async function generateMultipleThumbnails(
  uri: string
): Promise<{
  small: string;
  medium: string;
  large: string;
}> {
  try {
    const [small, medium, large] = await Promise.all([
      generateThumbnail(uri, { width: 150, height: 150, quality: 0.6 }),
      generateThumbnail(uri, { width: 400, height: 400, quality: 0.7 }),
      generateThumbnail(uri, { width: 800, height: 800, quality: 0.8 }),
    ]);

    return { small, medium, large };
  } catch (error) {
    console.error('Multiple thumbnail generation error:', error);
    throw error;
  }
}

// Advanced Manipulations
export async function cropImage(
  uri: string,
  crop: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  }
): Promise<string> {
  try {
    const result = await manipulateAsync(uri, [{ crop }]);
    return result.uri;
  } catch (error) {
    console.error('Image crop error:', error);
    throw error;
  }
}

export async function rotateImage(uri: string, degrees: number): Promise<string> {
  try {
    const result = await manipulateAsync(uri, [{ rotate: degrees }]);
    return result.uri;
  } catch (error) {
    console.error('Image rotate error:', error);
    throw error;
  }
}

export async function flipImage(
  uri: string,
  flipType: FlipType
): Promise<string> {
  try {
    const result = await manipulateAsync(uri, [{ flip: flipType }]);
    return result.uri;
  } catch (error) {
    console.error('Image flip error:', error);
    throw error;
  }
}

export async function cropToSquare(uri: string, size: number): Promise<string> {
  try {
    // Get image dimensions
    const asset = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (asset.canceled) {
      throw new Error('Image selection cancelled');
    }

    const { width, height } = asset.assets[0];

    // Calculate center crop
    const cropSize = Math.min(width, height);
    const originX = (width - cropSize) / 2;
    const originY = (height - cropSize) / 2;

    // Crop to square
    const croppedUri = await cropImage(uri, {
      originX,
      originY,
      width: cropSize,
      height: cropSize,
    });

    // Resize to target size
    return await resizeImage(croppedUri, { width: size, height: size });
  } catch (error) {
    console.error('Crop to square error:', error);
    throw error;
  }
}

// CDN URL Optimization
export function getOptimizedImageUrl(
  url: string,
  options: OptimizedImageUrlOptions = {}
): string {
  const { width, height, quality, format } = options;

  // Supabase Storage supports transformations via URL parameters
  const params = new URLSearchParams();

  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  if (quality) params.append('quality', quality.toString());
  if (format) params.append('format', format);

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

// Preset sizes for responsive images
export const IMAGE_SIZES = {
  thumb: { width: 150, height: 150, quality: 70 },
  small: { width: 400, height: 400, quality: 75 },
  medium: { width: 800, height: 800, quality: 80 },
  large: { width: 1200, height: 1200, quality: 85 },
  xlarge: { width: 1920, height: 1920, quality: 90 },
} as const;

export function getResponsiveImageUrl(
  url: string,
  size: keyof typeof IMAGE_SIZES = 'medium'
): string {
  return getOptimizedImageUrl(url, IMAGE_SIZES[size]);
}

// Image Info
export interface ImageInfo {
  width: number;
  height: number;
  uri: string;
}

export async function getImageInfo(uri: string): Promise<ImageInfo> {
  try {
    const result = await manipulateAsync(uri, []);
    return {
      width: result.width,
      height: result.height,
      uri: result.uri,
    };
  } catch (error) {
    console.error('Get image info error:', error);
    throw error;
  }
}

// Batch Operations
export async function compressMultipleImages(
  uris: string[],
  options: CompressOptions = {}
): Promise<string[]> {
  try {
    const compressed = await Promise.all(
      uris.map((uri) => compressImage(uri, options))
    );
    return compressed;
  } catch (error) {
    console.error('Batch compress error:', error);
    throw error;
  }
}

// Image Quality Detection
export function getOptimalQuality(fileSizeMB: number): number {
  if (fileSizeMB < 1) return 0.9;
  if (fileSizeMB < 2) return 0.85;
  if (fileSizeMB < 5) return 0.8;
  if (fileSizeMB < 10) return 0.75;
  return 0.7;
}

export function getOptimalDimensions(
  width: number,
  height: number,
  maxDimension: number = 1920
): { width: number; height: number } {
  const aspectRatio = width / height;

  if (width > height) {
    return {
      width: Math.min(width, maxDimension),
      height: Math.min(width, maxDimension) / aspectRatio,
    };
  } else {
    return {
      width: Math.min(height, maxDimension) * aspectRatio,
      height: Math.min(height, maxDimension),
    };
  }
}

// Format Detection
export function shouldUseWebP(): boolean {
  // WebP is supported in modern browsers and React Native
  return true;
}

export function getOptimalFormat(hasTransparency: boolean): SaveFormat {
  if (hasTransparency) {
    return SaveFormat.PNG;
  }
  return shouldUseWebP() ? SaveFormat.WEBP : SaveFormat.JPEG;
}

// Validation
export function isImageUri(uri: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const lowerUri = uri.toLowerCase();
  return imageExtensions.some((ext) => lowerUri.endsWith(ext));
}

export function getImageDimensions(
  uri: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = uri;
  });
}

// Progressive Image Loading
export interface ProgressiveImageOptions {
  uri: string;
  placeholderUri?: string;
  sizes: Array<keyof typeof IMAGE_SIZES>;
}

export function getProgressiveImageUrls(
  options: ProgressiveImageOptions
): string[] {
  const { uri, sizes } = options;

  return sizes.map((size) => getResponsiveImageUrl(uri, size));
}

// Memory Optimization
export function calculateMemoryUsage(
  width: number,
  height: number,
  bytesPerPixel: number = 4
): number {
  return width * height * bytesPerPixel;
}

export function shouldDownsample(
  width: number,
  height: number,
  maxMemoryMB: number = 10
): boolean {
  const memoryBytes = calculateMemoryUsage(width, height);
  const memoryMB = memoryBytes / (1024 * 1024);
  return memoryMB > maxMemoryMB;
}

// Smart Compression
export async function smartCompress(
  uri: string,
  targetSizeMB: number = 1
): Promise<string> {
  try {
    // Get current size
    const info = await getImageInfo(uri);
    const currentSizeMB = info.uri.length / (1024 * 1024); // Rough estimate

    if (currentSizeMB <= targetSizeMB) {
      return uri;
    }

    // Calculate quality based on target size
    const quality = Math.max(0.5, Math.min(0.95, targetSizeMB / currentSizeMB));

    // Get optimal dimensions
    const { width, height } = getOptimalDimensions(info.width, info.height);

    return await compressImage(uri, {
      maxWidth: width,
      maxHeight: height,
      quality,
      format: SaveFormat.JPEG,
    });
  } catch (error) {
    console.error('Smart compress error:', error);
    throw error;
  }
}
