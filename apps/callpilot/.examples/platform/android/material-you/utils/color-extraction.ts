/**
 * color-extraction.ts
 *
 * Color utility functions for Material You
 */

import type { MaterialYouColors } from '../types';

/**
 * Color utility functions
 */
export const ColorUtils = {
  /**
   * Get color for role
   */
  getColor(colors: MaterialYouColors, role: keyof MaterialYouColors): string {
    return colors[role];
  },

  /**
   * Get contrast color (on-color)
   */
  getOnColor(colors: MaterialYouColors, role: string): string {
    const onRole = `on${role.charAt(0).toUpperCase()}${role.slice(1)}` as keyof MaterialYouColors;
    return colors[onRole] || colors.onSurface;
  },

  /**
   * Get container color
   */
  getContainerColor(colors: MaterialYouColors, role: string): string {
    const containerRole = `${role}Container` as keyof MaterialYouColors;
    return colors[containerRole] || colors.surfaceContainer;
  },

  /**
   * Add alpha to color
   */
  withAlpha(color: string, alpha: number): string {
    const alphaHex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, '0');
    return `${color}${alphaHex}`;
  },

  /**
   * Get surface elevation color
   */
  getSurfaceElevation(colors: MaterialYouColors, level: number): string {
    const elevationMap = {
      0: colors.surface,
      1: colors.surfaceContainerLow,
      2: colors.surfaceContainer,
      3: colors.surfaceContainerHigh,
      4: colors.surfaceContainerHighest,
    };

    return elevationMap[Math.min(level, 4) as keyof typeof elevationMap] || colors.surface;
  },
};
