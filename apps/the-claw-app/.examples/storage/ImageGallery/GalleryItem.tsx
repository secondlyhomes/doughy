/**
 * Individual gallery image item
 */

import { Image, Pressable, StyleSheet } from 'react-native';
import { colors, borderRadius } from '@/theme/tokens';
import { getOptimizedImageUrl } from '@/utils/imageOptimization';
import type { GalleryItemProps } from './types';

export function GalleryItem({ item, size, onPress }: GalleryItemProps) {
  return (
    <Pressable
      onPress={() => onPress(item)}
      style={[styles.container, { width: size, height: size }]}
    >
      <Image
        source={{
          uri: getOptimizedImageUrl(item.url, {
            width: size * 2,
            height: size * 2,
            quality: 80,
          }),
        }}
        style={styles.image}
        resizeMode="cover"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.neutral[200],
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
