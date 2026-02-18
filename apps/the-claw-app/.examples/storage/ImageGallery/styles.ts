/**
 * Shared styles for ImageGallery components
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '@/theme/tokens';

export const galleryStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: spacing[2],
  },
  columnWrapper: {
    gap: spacing[2],
    marginBottom: spacing[2],
  },
});

export const emptyStyles = StyleSheet.create({
  container: {
    padding: spacing[8],
    alignItems: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing[4],
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  subtext: {
    fontSize: 14,
    color: colors.neutral[600],
    textAlign: 'center',
  },
});

export const masonryStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing[2],
    gap: spacing[2],
  },
  column: {
    gap: spacing[2],
  },
  item: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.neutral[200],
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export const carouselStyles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing[4],
    gap: spacing[4],
  },
  item: {
    height: 300,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.neutral[200],
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
