/**
 * Hook for managing image gallery state
 */

import { useState, useCallback } from 'react';
import { Dimensions } from 'react-native';
import { spacing } from '@/theme/tokens';
import type { ImageItem } from './types';

interface UseImageGalleryOptions {
  numColumns?: number;
  onDelete?: (image: ImageItem) => void;
}

export function useImageGallery({
  numColumns = 3,
  onDelete,
}: UseImageGalleryOptions = {}) {
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const itemSize = (screenWidth - spacing[4] * (numColumns + 1)) / numColumns;

  const handleImagePress = useCallback((image: ImageItem) => {
    setSelectedImage(image);
    setShowViewer(true);
  }, []);

  const handleClose = useCallback(() => {
    setShowViewer(false);
    setSelectedImage(null);
  }, []);

  const handleDelete = useCallback(() => {
    if (selectedImage && onDelete) {
      onDelete(selectedImage);
      handleClose();
    }
  }, [selectedImage, onDelete, handleClose]);

  return {
    selectedImage,
    showViewer,
    itemSize,
    handleImagePress,
    handleClose,
    handleDelete,
  };
}
