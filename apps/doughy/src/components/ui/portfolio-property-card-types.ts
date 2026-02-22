/**
 * Types for PortfolioPropertyCard component
 */

import type { ViewStyle } from 'react-native';

export type PropertyStatus = 'acquired' | 'under_contract' | 'researching' | 'archived';

export interface PortfolioProperty {
  /** Property ID */
  id: string;

  /** Property address */
  address: string;

  /** City */
  city?: string;

  /** State */
  state?: string;

  /** Property status */
  status: PropertyStatus;

  /** Purchase price (or offer price if under contract) */
  price?: number;

  /** After Repair Value */
  arv?: number;

  /** Return on Investment percentage */
  roi?: number;

  /** Property thumbnail image URL */
  thumbnail_url?: string;

  /** Last activity timestamp */
  last_activity?: string;
}

export interface PortfolioPropertyCardProps {
  /** Property data */
  property: PortfolioProperty;

  /** onPress handler for navigation */
  onPress: () => void;

  /** Compact mode (smaller, denser layout) */
  compact?: boolean;

  /** Card variant */
  variant?: 'default' | 'glass';

  /** Custom style */
  style?: ViewStyle;
}
