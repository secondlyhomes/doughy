/**
 * PortfolioPropertyCard Component
 * Displays a property card in portfolio list view
 *
 * Features:
 * - Property thumbnail image
 * - Address and location
 * - Status badge (acquired, under contract, researching)
 * - Key metrics (purchase price, ARV, ROI)
 * - Last activity timestamp
 * - Navigation affordance (ChevronRight)
 * - Optional compact mode for denser lists
 *
 * Built on DataCard pattern for consistency.
 * Follows Zone B design system with zero hardcoded values.
 */

import React from 'react';
import { PortfolioPropertyCardCompact } from './PortfolioPropertyCardCompact';
import { PortfolioPropertyCardFull } from './PortfolioPropertyCardFull';
import type { PortfolioPropertyCardProps } from './portfolio-property-card-types';

// Re-export types for barrel export consumers
export type { PortfolioPropertyCardProps, PortfolioProperty, PropertyStatus } from './portfolio-property-card-types';

export function PortfolioPropertyCard({
  property,
  onPress,
  compact = false,
  variant = 'default',
  style,
}: PortfolioPropertyCardProps) {
  if (compact) {
    return (
      <PortfolioPropertyCardCompact
        property={property}
        onPress={onPress}
        variant={variant}
        style={style}
      />
    );
  }

  return (
    <PortfolioPropertyCardFull
      property={property}
      onPress={onPress}
      variant={variant}
      style={style}
    />
  );
}
