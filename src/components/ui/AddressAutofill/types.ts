// src/components/ui/AddressAutofill/types.ts
// Types for the unified address autofill component

import type { ViewProps } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

/**
 * Address source matches database ENUM `address_source`
 * - openstreetmap: Address came from OSM geocoding (verified)
 * - manual: User entered custom text (private)
 */
export type AddressSource = 'openstreetmap' | 'manual';

/**
 * Structured address value returned by the component
 */
export interface AddressValue {
  /** Full formatted address for display */
  formatted: string;
  /** Street number and name */
  street?: string;
  /** City name */
  city?: string;
  /** State abbreviation */
  state?: string;
  /** ZIP/postal code */
  zip?: string;
  /** County name */
  county?: string;
  /** Country code */
  country?: string;
  /** GPS latitude */
  lat?: number;
  /** GPS longitude */
  lng?: number;
  /** True if address is from geocoding, false if manual */
  isVerified: boolean;
  /** True if visible to workspace, false if private to user */
  isPublic: boolean;
  /** Source of the address */
  source: AddressSource;
  /** UUID from verified_addresses table (if saved) */
  verifiedAddressId?: string;
  /** OpenStreetMap place ID (for deduplication) */
  osmPlaceId?: string;
}

/**
 * Address suggestion item shown in dropdown
 */
export interface AddressSuggestion {
  /** Unique identifier */
  id: string;
  /** Primary display text (street address) */
  primaryText: string;
  /** Secondary display text (city, state, zip) */
  secondaryText: string;
  /** Full structured address */
  address: AddressValue;
  /** Visual indicator of source */
  badge?: 'verified' | 'recent';
}

/**
 * Props for AddressAutofill component
 */
export interface AddressAutofillProps extends ViewProps {
  /** Current address value (string or structured) */
  value?: AddressValue | string;
  /** Called when address changes */
  onChange?: (address: AddressValue | undefined) => void;
  /** Called when a verified address is selected - use to auto-fill city/state/zip */
  onAddressSelected?: (address: AddressValue) => void;
  /** Field label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Disable the input */
  disabled?: boolean;
  /** Mark as required */
  required?: boolean;
  /** Show info icon with tooltip about verification */
  showInfoIcon?: boolean;
  /** Icon to display on the left */
  icon?: LucideIcon;
  /** CSS class for styling */
  className?: string;
}

/**
 * Internal state for useAddressAutofill hook
 */
export interface AddressAutofillState {
  /** Current search text */
  searchText: string;
  /** Combined suggestions from all sources */
  suggestions: AddressSuggestion[];
  /** Loading state */
  isLoading: boolean;
  /** Whether dropdown is open */
  isOpen: boolean;
  /** Error message if search failed */
  searchError?: string;
}

/**
 * OSM geocoding API response structure
 */
export interface OSMGeocodingResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    street?: string;
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    neighbourhood?: string;
    state?: string;
    postcode?: string;
    county?: string;
    country?: string;
  };
}

/**
 * Database row from verified_addresses table
 */
export interface VerifiedAddressRow {
  id: string;
  formatted_address: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
  county: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  source: AddressSource;
  osm_place_id: string | null;
  is_verified: boolean;
  is_public: boolean;
  usage_count: number;
  workspace_id: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}
