// src/features/real-estate/utils/formatters.ts
// Utility functions for formatting property data

import { PropertyType } from '../types/constants';

/**
 * Format property type for display
 */
export function formatPropertyType(propertyType: string | undefined): string {
  if (!propertyType) return 'Other';

  const typeMap: Record<string, string> = {
    'single_family': 'Single Family',
    'multi_family': 'Multi Family',
    'condo': 'Condo',
    'townhouse': 'Townhouse',
    'duplex': 'Duplex',
    'triplex': 'Triplex',
    'fourplex': 'Fourplex',
    'apartment': 'Apartment',
    'mobile_home': 'Mobile Home',
    'land': 'Land',
    'lot': 'Vacant Lot',
    'farm': 'Farm',
    'ranch': 'Ranch',
    'commercial': 'Commercial',
    'industrial': 'Industrial',
    'retail': 'Retail',
    'office': 'Office',
    'mixed_use': 'Mixed Use',
    'other': 'Other',
  };

  return typeMap[propertyType.toLowerCase()] || propertyType;
}

/**
 * Get badge color class for property type
 */
export function getPropertyTypeBadgeColor(propertyType: string | undefined): string {
  if (!propertyType) return 'bg-gray-500';

  const colorMap: Record<string, string> = {
    'single_family': 'bg-blue-500',
    'multi_family': 'bg-purple-500',
    'condo': 'bg-indigo-500',
    'townhouse': 'bg-cyan-500',
    'duplex': 'bg-violet-500',
    'triplex': 'bg-fuchsia-500',
    'fourplex': 'bg-pink-500',
    'apartment': 'bg-rose-500',
    'mobile_home': 'bg-amber-500',
    'land': 'bg-green-500',
    'lot': 'bg-lime-500',
    'farm': 'bg-emerald-500',
    'ranch': 'bg-teal-500',
    'commercial': 'bg-orange-500',
    'industrial': 'bg-stone-500',
    'retail': 'bg-red-500',
    'office': 'bg-sky-500',
    'mixed_use': 'bg-yellow-500',
    'other': 'bg-gray-500',
  };

  return colorMap[propertyType.toLowerCase()] || 'bg-gray-500';
}

/**
 * Format currency
 */
export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format number with commas
 */
export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null) return 'N/A';
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format square feet
 */
export function formatSquareFeet(sqft: number | undefined | null): string {
  if (sqft === undefined || sqft === null) return 'N/A';
  return `${formatNumber(sqft)} sqft`;
}

/**
 * Format date
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return 'N/A';
  }
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string | undefined | null): string {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch {
    return 'N/A';
  }
}

/**
 * Format percentage
 */
export function formatPercentage(value: number | undefined | null, decimals: number = 1): string {
  if (value === undefined || value === null) return 'N/A';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format address for display
 */
export function formatAddress(property: {
  address?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  zip?: string;
}): string {
  const parts: string[] = [];

  const address = property.address || property.address_line_1;
  if (address) parts.push(address);
  if (property.address_line_2) parts.push(property.address_line_2);

  const cityStateZip: string[] = [];
  if (property.city) cityStateZip.push(property.city);
  if (property.state) cityStateZip.push(property.state);
  if (property.zip) cityStateZip.push(property.zip);

  if (cityStateZip.length > 0) {
    parts.push(cityStateZip.join(', '));
  }

  return parts.join('\n') || 'Address not specified';
}
