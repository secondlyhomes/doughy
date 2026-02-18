// src/components/ui/photo-gallery/PhotoViewer.tsx
// Full screen photo viewer with caption and delete button

import React from 'react';
import { View, Text, TouchableOpacity, Image, Pressable } from 'react-native';
import { X, Trash2 } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { FONT_SIZES } from '@/constants/design-tokens';
import { styles } from './styles';
import type { PhotoItem } from './types';

interface PhotoViewerProps {
  photo: PhotoItem | null;
  onClose: () => void;
  onRemove?: () => void;
}

export function PhotoViewer({ photo, onClose, onRemove }: PhotoViewerProps) {
  const colors = useThemeColors();

  if (!photo) return null;

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

        {typeColors && (
          <View style={[styles.viewerTypeBadge, { backgroundColor: typeColors.bg }]}>
            <Text
              style={{
                color: typeColors.text,
                fontSize: FONT_SIZES.sm,
                fontWeight: '600',
              }}
            >
              {photo.type!.charAt(0).toUpperCase() + photo.type!.slice(1)}
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
