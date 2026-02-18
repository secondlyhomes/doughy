/**
 * useAvatarUpload Hook
 *
 * Manages avatar upload state and operations including image picking,
 * camera capture, and upload logic.
 */

import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import type { UseAvatarUploadReturn } from '../types';

interface UseAvatarUploadOptions {
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: Error) => void;
}

/**
 * Hook for managing avatar upload functionality
 *
 * @example
 * ```tsx
 * const {
 *   uploading,
 *   showOptions,
 *   toggleOptions,
 *   pickImage,
 *   takePhoto,
 *   removeAvatar,
 * } = useAvatarUpload({
 *   onUploadSuccess: (url) => console.log('Uploaded:', url),
 *   onUploadError: (error) => console.error(error),
 * });
 * ```
 */
export function useAvatarUpload({
  onUploadSuccess,
  onUploadError,
}: UseAvatarUploadOptions): UseAvatarUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const toggleOptions = useCallback(() => {
    setShowOptions((prev) => !prev);
  }, []);

  const closeOptions = useCallback(() => {
    setShowOptions(false);
  }, []);

  const uploadImage = useCallback(
    async (uri: string) => {
      setUploading(true);
      try {
        // In real implementation, call profileService.uploadAvatar
        // For now, simulate upload
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setShowOptions(false);
        onUploadSuccess?.(uri);
      } catch (error) {
        console.error('Error uploading image:', error);
        const err = error instanceof Error ? error : new Error('Failed to upload image');
        onUploadError?.(err);
      } finally {
        setUploading(false);
      }
    },
    [onUploadSuccess, onUploadError]
  );

  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      const err = error instanceof Error ? error : new Error('Failed to pick image');
      onUploadError?.(err);
    }
  }, [uploadImage, onUploadError]);

  const takePhoto = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        throw new Error('Camera permission required');
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      const err = error instanceof Error ? error : new Error('Failed to take photo');
      onUploadError?.(err);
    }
  }, [uploadImage, onUploadError]);

  const removeAvatar = useCallback(() => {
    setShowOptions(false);
    onUploadSuccess?.('');
  }, [onUploadSuccess]);

  return {
    uploading,
    showOptions,
    toggleOptions,
    closeOptions,
    pickImage,
    takePhoto,
    removeAvatar,
  };
}
