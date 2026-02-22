/**
 * Shared types for PropertyCard sub-components.
 */

import { Property } from '../types';

export interface PropertyCardProps {
  property: Property;
  isSelected?: boolean;
  onPress: (property: Property) => void;
  compact?: boolean;
  /** Use glass effect instead of solid background */
  variant?: 'default' | 'glass';
  /** Blur intensity for glass variant. Default: GLASS_INTENSITY.strong (65) */
  glassIntensity?: number;
}

/** Props passed to compact and full sub-components */
export interface PropertyCardContentProps {
  property: Property;
  variant: 'default' | 'glass';
  glassIntensity: number;
  colors: ReturnType<typeof import('@/contexts/ThemeContext').useThemeColors>;
  badgeColor: string;
  imageUrl: string | undefined;
}
