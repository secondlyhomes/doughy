/**
 * Helpers for PortfolioPropertyCard component
 */

import type { PropertyStatus } from './portfolio-property-card-types';

/**
 * Formats currency
 */
export function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
}

/**
 * Formats relative time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return date.toLocaleDateString();
}

/**
 * Gets status badge variant and label
 */
export function getStatusConfig(status: PropertyStatus): { variant: 'default' | 'success' | 'warning' | 'outline'; label: string } {
  switch (status) {
    case 'acquired':
      return { variant: 'success', label: 'Acquired' };
    case 'under_contract':
      return { variant: 'warning', label: 'Under Contract' };
    case 'researching':
      return { variant: 'outline', label: 'Researching' };
    case 'archived':
      return { variant: 'default', label: 'Archived' };
  }
}
