// src/lib/property-card-utils.ts
// Helper functions for creating platform-specific property card metrics

import type { Metric } from '@/components/ui/MetricsRow';
import type { Property } from '@/features/real-estate/types/property';

// Types for rental properties (subset of fields needed for metrics)
export interface RentalPropertyForMetrics {
  base_rate?: number | null;
  rate_type?: 'nightly' | 'weekly' | 'monthly' | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
}

/**
 * Format currency value for compact display
 * @example formatCompactCurrency(350000) => "$350K"
 * @example formatCompactCurrency(2500) => "$2,500"
 */
export function formatCompactCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';

  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 10000) {
    return `$${Math.round(value / 1000)}K`;
  }
  return `$${value.toLocaleString()}`;
}

/**
 * Format square feet for compact display
 * @example formatCompactSqft(1500) => "1,500"
 */
export function formatCompactSqft(sqft: number | null | undefined): string {
  if (sqft === null || sqft === undefined || sqft === 0) return '-';
  return sqft.toLocaleString();
}

/**
 * Get rate suffix based on rental rate type
 */
export function getRateSuffix(rateType: 'nightly' | 'weekly' | 'monthly' | null | undefined): string {
  switch (rateType) {
    case 'nightly':
      return '/night';
    case 'weekly':
      return '/week';
    case 'monthly':
      return '/mo';
    default:
      return '/mo';
  }
}

/**
 * Create metrics array for investor property cards
 * Shows: ARV, Bedrooms, Bathrooms, Square Feet
 */
export function getInvestorPropertyMetrics(property: Property): Metric[] {
  const metrics: Metric[] = [];

  // ARV (primary metric)
  metrics.push({
    label: 'ARV',
    value: formatCompactCurrency(property.arv),
    color: property.arv ? 'success' : undefined,
  });

  // Bedrooms
  metrics.push({
    label: 'Beds',
    value: property.bedrooms?.toString() || '-',
  });

  // Bathrooms
  metrics.push({
    label: 'Baths',
    value: property.bathrooms?.toString() || '-',
  });

  // Square feet
  metrics.push({
    label: 'Sqft',
    value: formatCompactSqft(property.square_feet || property.sqft),
  });

  return metrics;
}

/**
 * Create metrics array for landlord/rental property cards
 * Shows: Rate, Bedrooms, Bathrooms
 */
export function getLandlordPropertyMetrics(property: RentalPropertyForMetrics): Metric[] {
  const metrics: Metric[] = [];

  // Rate (primary metric)
  const rateValue = property.base_rate
    ? `${formatCompactCurrency(property.base_rate)}${getRateSuffix(property.rate_type)}`
    : '-';

  metrics.push({
    label: 'Rate',
    value: rateValue,
    color: property.base_rate ? 'success' : undefined,
  });

  // Bedrooms
  metrics.push({
    label: 'Beds',
    value: property.bedrooms?.toString() || '-',
  });

  // Bathrooms
  metrics.push({
    label: 'Baths',
    value: property.bathrooms?.toString() || '-',
  });

  return metrics;
}

/**
 * Get image URL from a property, checking both images array and primary_image_url
 */
export function getPropertyImageUrl(property: {
  images?: { url: string; is_primary?: boolean }[] | null;
  primary_image_url?: string | null;
}): string | null {
  // Try to find primary image first
  const primaryImage = property.images?.find(img => img.is_primary);
  if (primaryImage?.url) return primaryImage.url;

  // Fall back to first image
  if (property.images?.[0]?.url) return property.images[0].url;

  // Fall back to primary_image_url field
  if (property.primary_image_url) return property.primary_image_url;

  return null;
}

/**
 * Get location string for property subtitle
 * @example getPropertyLocation({ city: 'Austin', state: 'TX', zip: '78701' }) => "Austin, TX 78701"
 */
export function getPropertyLocation(property: {
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}): string | undefined {
  const parts: string[] = [];

  if (property.city) parts.push(property.city);
  if (property.state) parts.push(property.state);

  let location = parts.join(', ');

  if (property.zip) {
    location = location ? `${location} ${property.zip}` : property.zip;
  }

  return location || undefined;
}
