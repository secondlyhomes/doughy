/**
 * Custom hook for AvatarUpload state management
 *
 * Handles:
 * - Options menu visibility
 * - Upload operations (pick, camera, remove)
 * - Error handling
 */

import { useState, useCallback } from 'react';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import type { UseAvatarUploadStateProps, UseAvatarUploadStateReturn } from '../types';

export function useAvatarUploadState({
  userId,
  onUploadSuccess,
  onUploadError,
}: UseAvatarUploadStateProps): UseAvatarUploadStateReturn {
  const [showOptions, setShowOptions] = useState(false);

  const { pickAndUpload, takePhotoAndUpload, removeAvatar, uploading, progress, error } =
    useAvatarUpload({
      userId,
      onSuccess: (url) => {
        setShowOptions(false);
        onUploadSuccess?.(url);
      },
      onError: (err) => {
        onUploadError?.(err);
      },
    });

  const handlePickImage = useCallback(async () => {
    try {
      await pickAndUpload();
    } catch (err) {
      console.error('Pick image failed:', err);
    }
  }, [pickAndUpload]);

  const handleTakePhoto = useCallback(async () => {
    try {
      await takePhotoAndUpload();
    } catch (err) {
      console.error('Take photo failed:', err);
    }
  }, [takePhotoAndUpload]);

  const handleRemove = useCallback(async () => {
    try {
      await removeAvatar();
      setShowOptions(false);
      onUploadSuccess?.('');
    } catch (err) {
      console.error('Remove avatar failed:', err);
    }
  }, [removeAvatar, onUploadSuccess]);

  return {
    showOptions,
    setShowOptions,
    uploading,
    progress,
    error,
    handlePickImage,
    handleTakePhoto,
    handleRemove,
  };
}
