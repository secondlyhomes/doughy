// src/components/ui/PhotoGallery.tsx
// Horizontal scrolling photo gallery with add button
// Used for property inventory, maintenance photos, etc.

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { Plus, X, Trash2, ZoomIn, Camera } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, FONT_SIZES, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface PhotoItem {
  /** Unique identifier for the photo */
  id: string;
  /** URL or local path to the image */
  url: string;
  /** Optional caption for the photo */
  caption?: string;
  /** Type of photo (for maintenance: before, after, receipt) */
  type?: 'before' | 'after' | 'receipt' | 'general';
}

export interface PhotoGalleryProps {
  /** Array of photos to display */
  photos: PhotoItem[];
  /** Handler for adding a new photo */
  onAddPhoto?: () => void;
  /** Handler for removing a photo */
  onRemovePhoto?: (photoId: string) => void;
  /** Handler for photo press (opens full screen viewer by default) */
  onPhotoPress?: (photo: PhotoItem, index: number) => void;
  /** Whether editing is allowed (shows add/remove buttons) */
  editable?: boolean;
  /** Maximum number of photos allowed */
  maxPhotos?: number;
  /** Size variant for photo thumbnails */
  size?: 'small' | 'medium' | 'large';
  /** Show captions below photos */
  showCaptions?: boolean;
  /** Placeholder text when no photos */
  emptyText?: string;
  /** Test ID for testing */
  testID?: string;
}

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
            activeOpacity={0.7}
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

// ============================================
// Photo Thumbnail Component
// ============================================

interface PhotoThumbnailProps {
  photo: PhotoItem;
  size: number;
  editable: boolean;
  showCaption: boolean;
  onPress: () => void;
  onRemove?: () => void;
}

function PhotoThumbnail({
  photo,
  size,
  editable,
  showCaption,
  onPress,
  onRemove,
}: PhotoThumbnailProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.thumbnailWrapper}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[
          styles.thumbnail,
          {
            width: size,
            height: size,
            borderColor: colors.border,
          },
        ]}
      >
        <Image
          source={{ uri: photo.url }}
          style={styles.thumbnailImage}
          resizeMode="cover"
        />

        {/* Photo type badge */}
        {photo.type && photo.type !== 'general' && (
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor:
                  photo.type === 'before'
                    ? withOpacity(colors.warning, 'medium')
                    : photo.type === 'after'
                    ? withOpacity(colors.success, 'medium')
                    : withOpacity(colors.info, 'medium'),
              },
            ]}
          >
            <Text
              style={[
                styles.typeBadgeText,
                {
                  color:
                    photo.type === 'before'
                      ? colors.warning
                      : photo.type === 'after'
                      ? colors.success
                      : colors.info,
                },
              ]}
            >
              {photo.type.charAt(0).toUpperCase() + photo.type.slice(1)}
            </Text>
          </View>
        )}

        {/* Zoom indicator */}
        <View style={[styles.zoomIndicator, { backgroundColor: colors.background }]}>
          <ZoomIn size={12} color={colors.mutedForeground} />
        </View>

        {/* Remove button (editable mode) */}
        {editable && onRemove && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              onRemove();
            }}
            style={[styles.removeButton, { backgroundColor: colors.destructive }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={12} color="white" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Caption */}
      {showCaption && photo.caption && (
        <Text
          style={[styles.caption, { color: colors.mutedForeground, width: size }]}
          numberOfLines={1}
        >
          {photo.caption}
        </Text>
      )}
    </View>
  );
}

// ============================================
// Full Screen Photo Viewer
// ============================================

interface PhotoViewerProps {
  photo: PhotoItem | null;
  onClose: () => void;
  onRemove?: () => void;
}

function PhotoViewer({ photo, onClose, onRemove }: PhotoViewerProps) {
  const colors = useThemeColors();

  if (!photo) return null;

  return (
    <Pressable style={styles.viewerOverlay} onPress={onClose}>
      {/* Close button */}
      <TouchableOpacity
        onPress={onClose}
        style={[styles.viewerCloseButton, { backgroundColor: colors.background }]}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      >
        <X size={24} color={colors.foreground} />
      </TouchableOpacity>

      {/* Image */}
      <Pressable onPress={(e) => e.stopPropagation()}>
        <Image
          source={{ uri: photo.url }}
          style={styles.viewerImage}
          resizeMode="contain"
        />
      </Pressable>

      {/* Caption and actions */}
      <View style={[styles.viewerFooter, { backgroundColor: colors.background }]}>
        {photo.caption && (
          <Text style={[styles.viewerCaption, { color: colors.foreground }]}>
            {photo.caption}
          </Text>
        )}

        {photo.type && photo.type !== 'general' && (
          <View
            style={[
              styles.viewerTypeBadge,
              {
                backgroundColor:
                  photo.type === 'before'
                    ? withOpacity(colors.warning, 'medium')
                    : photo.type === 'after'
                    ? withOpacity(colors.success, 'medium')
                    : withOpacity(colors.info, 'medium'),
              },
            ]}
          >
            <Text
              style={{
                color:
                  photo.type === 'before'
                    ? colors.warning
                    : photo.type === 'after'
                    ? colors.success
                    : colors.info,
                fontSize: FONT_SIZES.sm,
                fontWeight: '600',
              }}
            >
              {photo.type.charAt(0).toUpperCase() + photo.type.slice(1)}
            </Text>
          </View>
        )}

        {onRemove && (
          <TouchableOpacity
            onPress={onRemove}
            style={[styles.viewerDeleteButton, { backgroundColor: colors.destructive }]}
          >
            <Trash2 size={16} color="white" />
            <Text style={styles.viewerDeleteText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
}

// ============================================
// Helpers
// ============================================

function getPhotoSize(size: 'small' | 'medium' | 'large'): number {
  switch (size) {
    case 'small':
      return 80;
    case 'large':
      return 160;
    default:
      return 120;
  }
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.xs,
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  emptyContainer: {
    height: 120,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  emptyPlaceholder: {
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
  },
  addButton: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  addButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  thumbnailWrapper: {
    alignItems: 'center',
  },
  thumbnail: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  typeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  zoomIndicator: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    fontSize: FONT_SIZES.xs,
    marginTop: 4,
    textAlign: 'center',
  },
  // Viewer styles
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  viewerImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  viewerFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl + 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  viewerCaption: {
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
    flex: 1,
  },
  viewerTypeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  viewerDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  viewerDeleteText: {
    color: 'white',
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});

export default PhotoGallery;
