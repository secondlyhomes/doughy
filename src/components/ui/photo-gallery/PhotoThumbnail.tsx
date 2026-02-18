// src/components/ui/photo-gallery/PhotoThumbnail.tsx
// Photo thumbnail component with type badge and remove button

import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { X, ZoomIn } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { PRESS_OPACITY } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { styles } from './styles';
import type { PhotoItem } from './types';

interface PhotoThumbnailProps {
  photo: PhotoItem;
  size: number;
  editable: boolean;
  showCaption: boolean;
  onPress: () => void;
  onRemove?: () => void;
}

export function PhotoThumbnail({
  photo,
  size,
  editable,
  showCaption,
  onPress,
  onRemove,
}: PhotoThumbnailProps) {
  const colors = useThemeColors();

  const getTypeBadgeColor = () => {
    switch (photo.type) {
      case 'before':
        return { bg: withOpacity(colors.warning, 'medium'), text: colors.warning };
      case 'after':
        return { bg: withOpacity(colors.success, 'medium'), text: colors.success };
      default:
        return { bg: withOpacity(colors.info, 'medium'), text: colors.info };
    }
  };

  const typeColors = photo.type && photo.type !== 'general' ? getTypeBadgeColor() : null;

  return (
    <View style={styles.thumbnailWrapper}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={PRESS_OPACITY.DEFAULT}
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
        {typeColors && (
          <View style={[styles.typeBadge, { backgroundColor: typeColors.bg }]}>
            <Text style={[styles.typeBadgeText, { color: typeColors.text }]}>
              {photo.type!.charAt(0).toUpperCase() + photo.type!.slice(1)}
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
