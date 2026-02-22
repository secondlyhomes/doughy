// src/components/ui/PhotoGallery.tsx
// Horizontal scrolling photo gallery with add button
// Used for property inventory, maintenance photos, etc.

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Plus, Camera } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import {
  PhotoThumbnail,
  PhotoViewer,
  styles,
  getPhotoSize,
  PhotoItem,
  PhotoGalleryProps,
} from './photo-gallery';

// Re-export types for backward compatibility
export type { PhotoItem, PhotoGalleryProps };

export function PhotoGallery({
  photos,
  onAddPhoto,
  onRemovePhoto,
  onPhotoPress,
  editable = false,
  maxPhotos = 10,
  size = 'medium',
  showCaptions = false,
  emptyText = 'No photos',
  testID,
}: PhotoGalleryProps) {
  const colors = useThemeColors();
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);

  const photoSize = getPhotoSize(size);
  const canAddMore = photos.length < maxPhotos;

  const handlePhotoPress = useCallback(
    (photo: PhotoItem, index: number) => {
      if (onPhotoPress) {
        onPhotoPress(photo, index);
      } else {
        // Default: open full screen viewer
        setSelectedPhoto(photo);
        setViewerVisible(true);
      }
    },
    [onPhotoPress]
  );

  const handleCloseViewer = useCallback(() => {
    setViewerVisible(false);
    setSelectedPhoto(null);
  }, []);

  const handleRemoveFromViewer = useCallback(() => {
    if (selectedPhoto && onRemovePhoto) {
      onRemovePhoto(selectedPhoto.id);
      handleCloseViewer();
    }
  }, [selectedPhoto, onRemovePhoto, handleCloseViewer]);

  // Empty state with add button
  if (photos.length === 0 && !editable) {
    return (
      <View
        style={[styles.emptyContainer, { backgroundColor: colors.muted }]}
        testID={testID}
      >
        <Camera size={32} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          {emptyText}
        </Text>
      </View>
    );
  }

  return (
    <View testID={testID}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Add Photo Button (first position when editable) */}
        {editable && canAddMore && (
          <TouchableOpacity
            onPress={onAddPhoto}
            style={[
              styles.addButton,
              {
                width: photoSize,
                height: photoSize,
                backgroundColor: withOpacity(colors.primary, 'subtle'),
                borderColor: colors.primary,
              },
            ]}
            activeOpacity={PRESS_OPACITY.DEFAULT}
          >
            <Plus size={ICON_SIZES.lg} color={colors.primary} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>
              Add
            </Text>
          </TouchableOpacity>
        )}

        {/* Photo Thumbnails */}
        {photos.map((photo, index) => (
          <PhotoThumbnail
            key={photo.id}
            photo={photo}
            size={photoSize}
            editable={editable}
            showCaption={showCaptions}
            onPress={() => handlePhotoPress(photo, index)}
            onRemove={onRemovePhoto ? () => onRemovePhoto(photo.id) : undefined}
          />
        ))}

        {/* Empty state placeholder when editable */}
        {photos.length === 0 && editable && !canAddMore && (
          <View
            style={[
              styles.emptyPlaceholder,
              {
                width: photoSize,
                height: photoSize,
                backgroundColor: colors.muted,
              },
            ]}
          >
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Max photos reached
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Full Screen Photo Viewer */}
      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseViewer}
      >
        <PhotoViewer
          photo={selectedPhoto}
          onClose={handleCloseViewer}
          onRemove={editable && onRemovePhoto ? handleRemoveFromViewer : undefined}
        />
      </Modal>
    </View>
  );
}

export default PhotoGallery;
