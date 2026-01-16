/**
 * Design Utilities Tests
 * Tests for helper functions that work with design tokens
 */

import { withOpacity, getShadowStyle, getBackdropColor } from '../design-utils';
import { OPACITY, SHADOWS } from '@/constants/design-tokens';
import { ThemeColors } from '@/context/ThemeContext';

// Mock theme colors for testing
const mockColors: ThemeColors = {
  background: '#FFFFFF',
  foreground: '#000000',
  card: '#F5F5F5',
  cardForeground: '#000000',
  popover: '#FFFFFF',
  popoverForeground: '#000000',
  primary: '#4D7C5F',
  primaryForeground: '#FFFFFF',
  secondary: '#E5E7EB',
  secondaryForeground: '#111827',
  muted: '#F3F4F6',
  mutedForeground: '#6B7280',
  accent: '#F3F4F6',
  accentForeground: '#111827',
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',
  border: '#E5E7EB',
  input: '#E5E7EB',
  ring: '#4D7C5F',
  success: '#10B981',
  successForeground: '#FFFFFF',
  warning: '#F59E0B',
  warningForeground: '#FFFFFF',
  info: '#3B82F6',
  infoForeground: '#FFFFFF',
  chart1: '#3B82F6',
  chart2: '#10B981',
  chart3: '#F59E0B',
  chart4: '#EF4444',
  chart5: '#8B5CF6',
};

describe('Design Utilities', () => {
  describe('withOpacity', () => {
    it('should append opacity hex to color', () => {
      const result = withOpacity('#4D7C5F', 'muted');
      expect(result).toBe('#4D7C5F1A'); // 10% opacity
    });

    it('should handle all opacity token values', () => {
      Object.keys(OPACITY).forEach((key) => {
        const result = withOpacity('#4D7C5F', key as keyof typeof OPACITY);
        expect(result).toBe(`#4D7C5F${OPACITY[key as keyof typeof OPACITY]}`);
      });
    });

    it('should strip existing opacity before applying new one', () => {
      const result = withOpacity('#4D7C5F80', 'subtle');
      expect(result).toBe('#4D7C5F0D'); // Should replace '80' with '0D'
    });

    it('should work with theme colors', () => {
      const result = withOpacity(mockColors.primary, 'light');
      expect(result).toBe(`${mockColors.primary}${OPACITY.light}`);
    });

    it('should handle invalid opacity keys gracefully', () => {
      // @ts-expect-error - testing runtime behavior with invalid key
      const result = withOpacity('#4D7C5F', 'invalid');
      expect(result).toBe('#4D7C5F'); // Falls back to original color
    });

    it('should work with lowercase hex colors', () => {
      const result = withOpacity('#4d7c5f', 'muted');
      expect(result).toBe('#4d7c5f1A');
    });

    it('should handle 3-character hex colors', () => {
      const result = withOpacity('#FFF', 'opaque');
      expect(result).toBe('#FFF80');
    });
  });

  describe('getShadowStyle', () => {
    it('should return shadow style with default size', () => {
      const result = getShadowStyle(mockColors);
      expect(result).toMatchObject(SHADOWS.md);
      expect(result.shadowColor).toBe('#000');
    });

    it('should accept custom shadow size', () => {
      const result = getShadowStyle(mockColors, { size: 'lg' });
      expect(result).toMatchObject(SHADOWS.lg);
    });

    it('should use theme primary color when requested', () => {
      const result = getShadowStyle(mockColors, { useThemeColor: true });
      expect(result.shadowColor).toBe(mockColors.primary);
    });

    it('should use custom color when provided', () => {
      const customColor = '#FF0000';
      const result = getShadowStyle(mockColors, { color: customColor });
      expect(result.shadowColor).toBe(customColor);
    });

    it('should prioritize custom color over useThemeColor', () => {
      const customColor = '#FF0000';
      const result = getShadowStyle(mockColors, {
        color: customColor,
        useThemeColor: true,
      });
      expect(result.shadowColor).toBe(customColor);
    });

    it('should include all shadow properties', () => {
      const result = getShadowStyle(mockColors, { size: 'xl' });
      expect(result).toHaveProperty('shadowOffset');
      expect(result).toHaveProperty('shadowRadius');
      expect(result).toHaveProperty('shadowOpacity');
      expect(result).toHaveProperty('elevation');
      expect(result).toHaveProperty('shadowColor');
    });

    it('should work with all shadow sizes', () => {
      (['sm', 'md', 'lg', 'xl'] as const).forEach((size) => {
        const result = getShadowStyle(mockColors, { size });
        expect(result.shadowRadius).toBe(SHADOWS[size].shadowRadius);
      });
    });
  });

  describe('getBackdropColor', () => {
    it('should return dark backdrop for dark mode', () => {
      const result = getBackdropColor(true);
      expect(result).toBe(`#000${OPACITY.backdropDark}`); // 60% black
    });

    it('should return light backdrop for light mode', () => {
      const result = getBackdropColor(false);
      expect(result).toBe(`#000${OPACITY.backdropLight}`); // 40% black
    });

    it('should use withOpacity internally', () => {
      const darkResult = getBackdropColor(true);
      const lightResult = getBackdropColor(false);
      expect(darkResult.startsWith('#000')).toBe(true);
      expect(lightResult.startsWith('#000')).toBe(true);
      expect(darkResult).not.toBe(lightResult);
    });
  });

  describe('Integration Tests', () => {
    it('should work together for themed glass effects', () => {
      const backgroundColor = withOpacity(mockColors.card, 'opaque');
      const shadowStyle = getShadowStyle(mockColors, {
        size: 'lg',
        useThemeColor: true,
      });

      expect(backgroundColor).toContain(mockColors.card);
      expect(backgroundColor).toContain(OPACITY.opaque);
      expect(shadowStyle.shadowColor).toBe(mockColors.primary);
      expect(shadowStyle.shadowRadius).toBe(SHADOWS.lg.shadowRadius);
    });

    it('should handle multiple opacity layers', () => {
      const base = withOpacity(mockColors.primary, 'light');
      const layered = withOpacity(base, 'medium');

      // Should replace the opacity, not stack it
      expect(layered).toBe(`${mockColors.primary}${OPACITY.medium}`);
    });

    it('should maintain type safety with const tokens', () => {
      // This test verifies TypeScript types work correctly
      const opacity1: keyof typeof OPACITY = 'subtle';
      const opacity2: keyof typeof OPACITY = 'almostOpaque';

      const result1 = withOpacity('#FFF', opacity1);
      const result2 = withOpacity('#000', opacity2);

      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty color string', () => {
      const result = withOpacity('', 'muted');
      expect(result).toBe(OPACITY.muted);
    });

    it('should handle color without # prefix', () => {
      const result = withOpacity('4D7C5F', 'light');
      expect(result).toBe(`4D7C5F${OPACITY.light}`);
    });

    it('should handle uppercase hex colors', () => {
      const result = withOpacity('#FF00FF', 'strong');
      expect(result).toBe(`#FF00FF${OPACITY.strong}`);
    });
  });
});
