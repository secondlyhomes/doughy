// src/features/real-estate/components/property-actions/utils.ts
// Utility functions for property actions

import { withOpacity } from '@/lib/design-utils';
import type { ThemeColors } from '@/contexts/ThemeContext';

export function getStatusColors(status: string, colors: ThemeColors) {
  switch (status) {
    case 'Active':
      return { bg: withOpacity(colors.success, 'muted'), text: colors.success, solid: colors.success };
    case 'Pending':
      return { bg: withOpacity(colors.warning, 'muted'), text: colors.warning, solid: colors.warning };
    case 'Sold':
      return { bg: withOpacity(colors.info, 'muted'), text: colors.info, solid: colors.info };
    case 'Withdrawn':
      return { bg: colors.muted, text: colors.mutedForeground, solid: colors.mutedForeground };
    case 'Expired':
      return { bg: withOpacity(colors.destructive, 'muted'), text: colors.destructive, solid: colors.destructive };
    case 'Off Market':
      return { bg: withOpacity(colors.primary, 'muted'), text: colors.primary, solid: colors.primary };
    default:
      return { bg: colors.muted, text: colors.foreground, solid: colors.foreground };
  }
}

export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const imageHostDomains = ['unsplash.com', 'images.unsplash.com', 'imgur.com', 'i.imgur.com', 'cloudinary.com'];

    const hasImageExtension = imageExtensions.some(ext => urlObj.pathname.toLowerCase().includes(ext));
    const isImageHost = imageHostDomains.some(domain => urlObj.hostname.includes(domain));

    return hasImageExtension || isImageHost || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}
